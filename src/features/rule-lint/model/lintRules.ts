import type { RulerFile } from '@/entities/ruler-file';
import { RECOMMENDED_TOKEN_LIMIT, estimateTokensFromBytes } from '@/shared/lib';

export type LintSeverity = 'error' | 'warning' | 'info';

export type LintCategory =
  | 'ambiguity'
  | 'missing-rationale'
  | 'token-budget'
  | 'empty-section'
  | 'short-content';

export interface LintFinding {
  readonly severity: LintSeverity;
  readonly category: LintCategory;
  readonly fileName: string;
  readonly line?: number;
  readonly message: string;
  readonly snippet?: string;
}

export interface LintInput {
  readonly files: readonly RulerFile[];
  readonly selected: ReadonlySet<string>;
  readonly getContent: (fileName: string) => string;
}

export interface LintResult {
  readonly findings: readonly LintFinding[];
  readonly totalBytes: number;
  readonly totalTokensEstimate: number;
  readonly recommendedTokenLimit: number;
  readonly selectedFileCount: number;
}

const AMBIGUOUS_TERMS = [
  '적절히',
  '필요시',
  '필요 시',
  '가능한 한',
  '되도록',
  '상황에 따라',
  '왠만하면',
  '웬만하면',
  '적당히',
] as const;

const STRONG_DIRECTIVES = ['금지', '필수', '반드시', '절대'] as const;

const SHORT_CONTENT_THRESHOLD = 200;

/**
 * 코드블록(``` 펜스) 안에 있는 줄을 표시한다.
 * 펜스 안의 내용은 규칙 문장이 아니라 예시·리포트 포맷이므로 린트 대상이 아니다.
 */
const markFencedLines = (lines: readonly string[]): readonly boolean[] => {
  const fenced: boolean[] = [];
  let open = false;
  for (const line of lines) {
    const isFence = line.trimStart().startsWith('```');
    fenced.push(open || isFence);
    if (isFence) open = !open;
  }
  return fenced;
};

export const lintRules = (input: LintInput): LintResult => {
  const findings: LintFinding[] = [];
  let totalBytes = 0;
  let selectedCount = 0;

  for (const file of input.files) {
    if (!input.selected.has(file.fileName)) continue;
    selectedCount += 1;
    const content = input.getContent(file.fileName);
    totalBytes += content.length;

    findings.push(...detectAmbiguousTerms(file.fileName, content));
    findings.push(...detectMissingRationale(file.fileName, content));
    findings.push(...detectEmptySections(file.fileName, content));
    findings.push(...detectShortContent(file.fileName, content));
  }

  const totalTokensEstimate = estimateTokensFromBytes(totalBytes);
  if (totalTokensEstimate > RECOMMENDED_TOKEN_LIMIT) {
    findings.push({
      severity: 'warning',
      category: 'token-budget',
      fileName: '__overall__',
      message: `선택된 룰셋 ${totalTokensEstimate.toLocaleString()} 토큰 추정 — 권장 한도(${RECOMMENDED_TOKEN_LIMIT.toLocaleString()}) 초과. 자동 로드를 줄이거나 룰을 on-demand 로 옮기는 것을 검토하세요.`,
    });
  }

  return {
    findings: sortFindings(findings),
    totalBytes,
    totalTokensEstimate,
    recommendedTokenLimit: RECOMMENDED_TOKEN_LIMIT,
    selectedFileCount: selectedCount,
  };
};

const detectAmbiguousTerms = (fileName: string, content: string): LintFinding[] => {
  const findings: LintFinding[] = [];
  const lines = content.split('\n');
  const fenced = markFencedLines(lines);
  lines.forEach((line, idx) => {
    if (fenced[idx]) return;
    for (const term of AMBIGUOUS_TERMS) {
      if (!line.includes(term)) continue;
      // 같은 단어가 frontmatter 또는 코드 블록 안이면 건너뛰기 (가장 흔한 false positive)
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('```')) continue;
      findings.push({
        severity: 'warning',
        category: 'ambiguity',
        fileName,
        line: idx + 1,
        message: `모호 표현 "${term}" — Claude가 매번 다르게 해석합니다. 구체 조건/숫자/예시로 교체하세요.`,
        snippet: line.trim().slice(0, 140),
      });
    }
  });
  return findings;
};

const detectMissingRationale = (fileName: string, content: string): LintFinding[] => {
  const findings: LintFinding[] = [];
  const lines = content.split('\n');
  const fenced = markFencedLines(lines);
  lines.forEach((line, idx) => {
    if (fenced[idx]) return;
    if (!line.startsWith('- ') && !line.startsWith('* ')) return;
    if (/^[-*]\s*\[[ xX]\]/.test(line)) return; // 체크리스트 항목은 명령문이 아니다
    if (/\((필수|선택)[,)]/.test(line)) return; // "(필수, ...)" 는 입력 목록의 라벨
    if (/^[-*]\s*["'“][^"'”]*["'”]\s*$/.test(line)) return; // 통째로 인용된 줄은 남의 문장이다
    const hitDirective = STRONG_DIRECTIVES.find((kw) => line.includes(kw));
    if (hitDirective === undefined) return;
    // 같은 줄에 "근거:" 또는 이후 4줄 안에 "근거:" 있으면 OK
    const lookahead = [line, ...lines.slice(idx + 1, idx + 5)].join('\n');
    if (lookahead.includes('근거:')) return;
    findings.push({
      severity: 'info',
      category: 'missing-rationale',
      fileName,
      line: idx + 1,
      message: `강한 명령(${hitDirective}) 항목에 "근거:" 라인이 없습니다. Why 1줄로 Claude가 엣지 케이스에서 판단 가능해집니다.`,
      snippet: line.trim().slice(0, 140),
    });
  });
  return findings;
};

const detectEmptySections = (fileName: string, content: string): LintFinding[] => {
  const findings: LintFinding[] = [];
  const lines = content.split('\n');
  const fenced = markFencedLines(lines);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line === undefined || fenced[i] || !line.startsWith('## ')) continue;
    let hasContent = false;
    for (let j = i + 1; j < lines.length; j += 1) {
      const next = lines[j];
      if (next === undefined) break;
      if (!fenced[j] && next.startsWith('## ')) break;
      if (next.trim().length > 0 && !next.startsWith('---')) {
        hasContent = true;
        break;
      }
    }
    if (!hasContent) {
      findings.push({
        severity: 'warning',
        category: 'empty-section',
        fileName,
        line: i + 1,
        message: `빈 섹션: "${line.trim()}"`,
      });
    }
  }
  return findings;
};

const detectShortContent = (fileName: string, content: string): LintFinding[] => {
  if (content.length >= SHORT_CONTENT_THRESHOLD) return [];
  return [
    {
      severity: 'info',
      category: 'short-content',
      fileName,
      message: `룰 본문이 매우 짧음 (${content.length} bytes). 본문이 충분한지 검토하세요.`,
    },
  ];
};

const SEVERITY_RANK: Record<LintSeverity, number> = {
  error: 0,
  warning: 1,
  info: 2,
};

const sortFindings = (findings: readonly LintFinding[]): readonly LintFinding[] =>
  [...findings].sort((a, b) => {
    const severityDiff = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (severityDiff !== 0) return severityDiff;
    if (a.fileName !== b.fileName) return a.fileName.localeCompare(b.fileName);
    return (a.line ?? 0) - (b.line ?? 0);
  });

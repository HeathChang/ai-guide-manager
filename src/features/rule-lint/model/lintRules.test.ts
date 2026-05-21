import { describe, it, expect } from 'vitest';
import type { RulerFile } from '@/entities/ruler-file';
import { lintRules } from './lintRules';

const makeFile = (fileName: string, content: string): RulerFile => ({
  fileName,
  title: fileName,
  description: '',
  category: '공통',
  stack: 'frontend',
  defaultSelected: true,
  content,
});

const runWith = (files: readonly RulerFile[], selected: readonly string[]) =>
  lintRules({
    files,
    selected: new Set(selected),
    getContent: (name) => files.find((f) => f.fileName === name)?.content ?? '',
  });

describe('lintRules', () => {
  it('returns no findings for a clean rule file', () => {
    const file = makeFile(
      'clean.md',
      `# Heading\n\n## Section\n\n- 명령 1: any 금지 — unknown 사용.\n  - 근거: 런타임 안전성. ${'채움 '.repeat(60)}\n\n## Other\n\n본문이 충분히 길어야 short-content 경고를 피할 수 있다. 이 문장은 그 임계값을 넘기기 위한 것이다. ${'채움 '.repeat(60)}`,
    );
    const result = runWith([file], ['clean.md']);
    expect(result.findings).toHaveLength(0);
    expect(result.selectedFileCount).toBe(1);
  });

  it('detects ambiguous terms', () => {
    const file = makeFile(
      'amb.md',
      `# X\n\n## Y\n\n- 가능한 한 조심한다.\n- 필요시 검증한다.\n\n본문은 200자 이상이어야 한다. 이 문장은 short-content 경고를 피하기 위한 채움이다. 더 길게 더 길게 더 길게.`,
    );
    const result = runWith([file], ['amb.md']);
    const ambiguity = result.findings.filter((f) => f.category === 'ambiguity');
    expect(ambiguity.length).toBeGreaterThanOrEqual(2);
    expect(ambiguity[0]?.severity).toBe('warning');
  });

  it('detects missing rationale on strong directives', () => {
    const file = makeFile(
      'no-rationale.md',
      `# X\n\n## Y\n\n- foo는 절대 금지.\n- 추가 설명 없음.\n\n본문이 짧지 않게 더 길게 적어야 short-content 경고가 안 뜬다. 이 문장은 그 채움 역할이다.`,
    );
    const result = runWith([file], ['no-rationale.md']);
    const missing = result.findings.filter((f) => f.category === 'missing-rationale');
    expect(missing.length).toBeGreaterThanOrEqual(1);
    expect(missing[0]?.severity).toBe('info');
  });

  it('skips missing-rationale when 근거 follows within 4 lines', () => {
    const file = makeFile(
      'has-rationale.md',
      `# X\n\n## Y\n\n- foo 금지\n  - 근거: 보안 위험.\n\n본문이 200자가 안 되면 short-content 경고가 뜨므로 길게 길게 길게 채워서 임계값을 넘긴다.`,
    );
    const result = runWith([file], ['has-rationale.md']);
    const missing = result.findings.filter((f) => f.category === 'missing-rationale');
    expect(missing).toHaveLength(0);
  });

  it('detects empty section', () => {
    const file = makeFile(
      'empty.md',
      `# X\n\n## Filled\n\n어떤 내용\n\n## Empty\n\n## Next\n\n또 다른 내용입니다. 충분히 길게 작성합니다. 충분히 길게 작성합니다.`,
    );
    const result = runWith([file], ['empty.md']);
    const empty = result.findings.filter((f) => f.category === 'empty-section');
    expect(empty.length).toBeGreaterThanOrEqual(1);
    expect(empty[0]?.message).toContain('Empty');
  });

  it('warns when token budget exceeds limit', () => {
    const big = makeFile('big.md', 'x'.repeat(35_000));
    const result = runWith([big], ['big.md']);
    const budget = result.findings.filter((f) => f.category === 'token-budget');
    expect(budget).toHaveLength(1);
    expect(result.totalTokensEstimate).toBeGreaterThan(result.recommendedTokenLimit);
  });

  it('only counts selected files in totals', () => {
    const a = makeFile('a.md', 'x'.repeat(3000));
    const b = makeFile('b.md', 'y'.repeat(3000));
    const result = runWith([a, b], ['a.md']);
    expect(result.selectedFileCount).toBe(1);
    expect(result.totalBytes).toBe(3000);
  });

  it('sorts findings by severity then file', () => {
    const f1 = makeFile(
      'b.md',
      `# X\n\n## Y\n\n- 가능한 한 X 한다.\n\n본문 채움 본문 채움 본문 채움 본문 채움 본문 채움 본문 채움 본문 채움 본문 채움 본문 채움.`,
    );
    const f2 = makeFile(
      'a.md',
      `# X\n\n## Y\n\n- 필수 금지.\n\n근거가 없는 강한 명령입니다. 본문은 충분히 길어야 합니다. 이 문장이 채움 역할을 합니다.`,
    );
    const result = runWith([f1, f2], ['a.md', 'b.md']);
    // warnings 먼저, info 나중
    const severities = result.findings.map((f) => f.severity);
    const firstInfoIdx = severities.indexOf('info');
    const lastWarningIdx = severities.lastIndexOf('warning');
    if (firstInfoIdx !== -1 && lastWarningIdx !== -1) {
      expect(lastWarningIdx).toBeLessThan(firstInfoIdx);
    }
  });
});

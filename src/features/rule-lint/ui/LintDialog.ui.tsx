import { useEffect, useId, useMemo, useRef } from 'react';
import { Heading, Stack, Text } from 'null_ong2-design-system';
import { Button } from '@/shared/ui';
import type { LintFinding, LintResult, LintSeverity, LintCategory } from '../model/lintRules';

interface LintDialogProps {
  readonly open: boolean;
  readonly result: LintResult | undefined;
  readonly onClose: () => void;
}

const SEVERITY_LABEL: Record<LintSeverity, string> = {
  error: '오류',
  warning: '경고',
  info: '제안',
};

const SEVERITY_BADGE_CLASS: Record<LintSeverity, string> = {
  error: 'bg-fg-danger text-text-inverse',
  warning: 'bg-fg-warning text-text-main',
  info: 'bg-fg-info text-text-inverse',
};

const CATEGORY_LABEL: Record<LintCategory, string> = {
  ambiguity: '모호 표현',
  'missing-rationale': '근거 누락',
  'token-budget': '토큰 예산',
  'empty-section': '빈 섹션',
  'short-content': '짧은 본문',
};

const groupBySeverity = (findings: readonly LintFinding[]) => {
  const groups: Record<LintSeverity, LintFinding[]> = { error: [], warning: [], info: [] };
  for (const f of findings) groups[f.severity].push(f);
  return groups;
};

export const LintDialog = ({ open, result, onClose }: LintDialogProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    dialogRef.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  const grouped = useMemo(
    () => (result !== undefined ? groupBySeverity(result.findings) : undefined),
    [result],
  );

  if (!open || result === undefined || grouped === undefined) return null;

  const tokenRatio = Math.round((result.totalTokensEstimate / result.recommendedTokenLimit) * 100);
  const tokenOver = result.totalTokensEstimate > result.recommendedTokenLimit;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-card border border-border-base bg-bg-card shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-border-base p-6">
          <Heading id={titleId} as="h2" size="lg">
            룰셋 분석
          </Heading>
          <Button size="sm" variant="ghost" onClick={onClose} aria-label="닫기">
            ✕
          </Button>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Stack spacing="md">
            <div className="rounded-card border border-border-base bg-bg-base p-4">
              <Stack spacing="xs">
                <Text size="sm" color="muted">선택된 파일</Text>
                <Text weight="semibold">{result.selectedFileCount}개</Text>
                <Text size="sm" color="muted" className="mt-2">
                  토큰 추정 / 권장
                </Text>
                <Text weight="semibold">
                  ≈ {result.totalTokensEstimate.toLocaleString()} / {result.recommendedTokenLimit.toLocaleString()} tok
                  <span className={`ml-2 text-sm ${tokenOver ? 'text-fg-danger' : 'text-text-muted'}`}>
                    ({tokenRatio}%)
                  </span>
                </Text>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-bg-muted">
                  <div
                    className={`h-full ${tokenOver ? 'bg-fg-danger' : 'bg-brand'}`}
                    style={{ width: `${Math.min(tokenRatio, 100)}%` }}
                  />
                </div>
              </Stack>
            </div>

            {result.findings.length === 0 ? (
              <div className="rounded-card border border-border-base bg-bg-base p-4 text-center">
                <Text>검출된 이슈 없음. 클린한 룰셋입니다.</Text>
              </div>
            ) : (
              <Stack spacing="sm">
                {(['error', 'warning', 'info'] as const).map((severity) =>
                  grouped[severity].length === 0 ? null : (
                    <section key={severity} aria-label={SEVERITY_LABEL[severity]}>
                      <Text size="sm" weight="semibold" className="mb-2">
                        {SEVERITY_LABEL[severity]} ({grouped[severity].length})
                      </Text>
                      <Stack spacing="xs">
                        {grouped[severity].map((f, idx) => (
                          <FindingItem key={`${f.fileName}-${f.line ?? 0}-${idx}`} finding={f} />
                        ))}
                      </Stack>
                    </section>
                  ),
                )}
              </Stack>
            )}
          </Stack>
        </div>

        <footer className="flex justify-end border-t border-border-base p-4">
          <Button onClick={onClose}>확인</Button>
        </footer>
      </div>
    </div>
  );
};

const FindingItem = ({ finding }: { readonly finding: LintFinding }) => (
  <div className="rounded-card border border-border-base bg-bg-base p-3">
    <div className="flex items-start gap-2">
      <span
        className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE_CLASS[finding.severity]}`}
      >
        {CATEGORY_LABEL[finding.category]}
      </span>
      <div className="min-w-0 flex-1">
        <Text size="sm" className="font-mono">
          {finding.fileName === '__overall__'
            ? '(전체 룰셋)'
            : `${finding.fileName}${finding.line !== undefined ? `:${finding.line}` : ''}`}
        </Text>
        <Text size="sm" className="mt-1">
          {finding.message}
        </Text>
        {finding.snippet !== undefined && (
          <pre className="mt-2 overflow-x-auto rounded bg-bg-muted px-2 py-1 text-xs">
            {finding.snippet}
          </pre>
        )}
      </div>
    </div>
  </div>
);

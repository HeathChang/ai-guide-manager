import { useState } from 'react';
import { Alert, Flex, Spinner, Text } from 'null_ong2-design-system';
import type { BackendFramework, FrontendFramework, Stack } from '@/shared/types';
import {
  BACKEND_FRAMEWORK_LABELS,
  FRONTEND_FRAMEWORK_LABELS,
  isBackendFramework,
  isFrontendFramework,
} from '@/shared/types';
import { Button, ThemeToggle } from '@/shared/ui';
import { formatTokenCount } from '@/shared/lib';
import type { Preset } from '@/features/presets';

interface BuilderHeaderProps {
  readonly stack: Stack;
  readonly framework?: FrontendFramework | BackendFramework;
  readonly selectedCount: number;
  readonly totalTokens: number;
  readonly recommendedTokenLimit: number;
  readonly presets: readonly Preset[];
  readonly isDownloading: boolean;
  readonly onBack: () => void;
  readonly onApplyPreset: (preset: Preset) => void;
  readonly onShare: () => void;
  readonly onDownload: () => void;
  readonly onLint: () => void;
  readonly onOpenVerifyPrompts: () => void;
  readonly notice?: BuilderNotice | undefined;
}

const frameworkLabel = (
  framework: FrontendFramework | BackendFramework | undefined,
): string | undefined => {
  if (framework === undefined) return undefined;
  if (isFrontendFramework(framework)) return FRONTEND_FRAMEWORK_LABELS[framework];
  if (isBackendFramework(framework)) return BACKEND_FRAMEWORK_LABELS[framework];
  return undefined;
};

export interface BuilderNotice {
  readonly message: string;
  readonly variant: 'info' | 'success' | 'warning' | 'danger';
}

export const BuilderHeader = ({
  stack,
  framework,
  selectedCount,
  totalTokens,
  recommendedTokenLimit,
  presets,
  isDownloading,
  onBack,
  onApplyPreset,
  onShare,
  onDownload,
  onLint,
  onOpenVerifyPrompts,
  notice,
}: BuilderHeaderProps) => {
  const [presetOpen, setPresetOpen] = useState(false);
  const fwLabel = frameworkLabel(framework);
  const tokenRatio =
    recommendedTokenLimit > 0
      ? Math.min(100, Math.round((totalTokens / recommendedTokenLimit) * 100))
      : 0;
  const tokenOver = totalTokens > recommendedTokenLimit;

  return (
    <header className="border-b border-border-base bg-bg-card">
      <div className="px-4 py-3">
        <Flex align="center" justify="space-between" gap="3" wrap="wrap">
          <Flex align="center" gap="3" className="min-w-0">
            <Button size="sm" variant="ghost" onClick={onBack} aria-label="랜딩으로 돌아가기">
              ← 뒤로
            </Button>
            <Flex align="center" gap="2" className="min-w-0">
              <div
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-btn bg-brand text-sm font-bold text-text-inverse"
              >
                R
              </div>
              <div className="min-w-0">
                <Text as="div" weight="semibold" truncate>
                  AI-Ruler
                </Text>
                <Text as="div" size="xs" color="muted" truncate>
                  {stack === 'frontend' ? 'Frontend' : 'Backend'}
                  {fwLabel !== undefined ? ` · ${fwLabel}` : ''} · {selectedCount}개 선택
                </Text>
              </div>
            </Flex>

            <div
              className="hidden md:flex flex-col gap-1 min-w-[140px]"
              aria-label="토큰 사용량"
              title={`선택된 룰셋: ≈ ${totalTokens.toLocaleString()} / ${recommendedTokenLimit.toLocaleString()} tok`}
            >
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className={tokenOver ? 'text-fg-danger font-semibold' : 'text-text-muted'}>
                  ≈ {formatTokenCount(totalTokens)} tok
                </span>
                <span className="text-text-muted">
                  / {formatTokenCount(recommendedTokenLimit)}
                </span>
              </div>
              <div
                className="h-1.5 w-full overflow-hidden rounded-full bg-bg-muted"
                role="progressbar"
                aria-valuenow={tokenRatio}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={tokenOver ? 'h-full bg-fg-danger' : 'h-full bg-brand'}
                  style={{ width: `${tokenRatio}%` }}
                />
              </div>
            </div>
          </Flex>

          <Flex align="center" gap="2" wrap="wrap">
            <div className="relative">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setPresetOpen((previous) => !previous)}
                aria-haspopup="menu"
                aria-expanded={presetOpen}
              >
                프리셋 ▾
              </Button>
              {presetOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-40 mt-2 w-64 overflow-hidden rounded-card border border-border-base bg-bg-card shadow-lg"
                >
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      role="menuitem"
                      className="w-full cursor-pointer border-none bg-transparent px-4 py-3 text-left hover:bg-bg-muted"
                      onClick={() => {
                        onApplyPreset(preset);
                        setPresetOpen(false);
                      }}
                    >
                      <Text weight="medium" size="sm">
                        {preset.label}
                      </Text>
                      <Text size="xs" color="muted" className="mt-0.5">
                        {preset.description}
                      </Text>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              size="sm"
              variant="secondary"
              onClick={onLint}
              disabled={selectedCount === 0}
              aria-label="룰셋 분석"
            >
              분석
            </Button>

            <Button
              size="sm"
              variant="secondary"
              onClick={onOpenVerifyPrompts}
              aria-label="Claude 검증 프롬프트"
            >
              검증 프롬프트
            </Button>

            <Button size="sm" variant="secondary" onClick={onShare}>
              공유 링크 복사
            </Button>

            <ThemeToggle />

            <Button
              size="sm"
              onClick={onDownload}
              disabled={selectedCount === 0 || isDownloading}
              isLoading={isDownloading}
            >
              {isDownloading ? (
                <>
                  <Spinner size="sm" label="다운로드 준비 중" />
                  생성 중…
                </>
              ) : (
                <>다운로드 ({selectedCount}) ↓</>
              )}
            </Button>
          </Flex>
        </Flex>
      </div>
      {notice !== undefined && (
        <div className="px-4 pb-3">
          <Alert variant={notice.variant}>{notice.message}</Alert>
        </div>
      )}
    </header>
  );
};

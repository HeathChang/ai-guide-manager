import { useState } from 'react';
import { Alert, Flex, Spinner, Text } from 'null_ong2-design-system';
import type { Stack } from '@/shared/types';
import { Button, ThemeToggle } from '@/shared/ui';
import type { Preset } from '@/features/presets';

interface BuilderHeaderProps {
  readonly stack: Stack;
  readonly selectedCount: number;
  readonly presets: readonly Preset[];
  readonly isDownloading: boolean;
  readonly onBack: () => void;
  readonly onApplyPreset: (preset: Preset) => void;
  readonly onShare: () => void;
  readonly onDownload: () => void;
  readonly notice?: BuilderNotice | undefined;
}

export interface BuilderNotice {
  readonly message: string;
  readonly variant: 'info' | 'success' | 'warning' | 'danger';
}

export const BuilderHeader = ({
  stack,
  selectedCount,
  presets,
  isDownloading,
  onBack,
  onApplyPreset,
  onShare,
  onDownload,
  notice,
}: BuilderHeaderProps) => {
  const [presetOpen, setPresetOpen] = useState(false);

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
                  {stack === 'frontend' ? 'Frontend' : 'Backend'} · {selectedCount}개 선택
                </Text>
              </div>
            </Flex>
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

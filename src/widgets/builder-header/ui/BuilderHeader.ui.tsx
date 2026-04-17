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
    <header
      style={{
        borderBottom: '1px solid var(--ds-color-neutral-200)',
        background: 'var(--ds-color-neutral-0)',
      }}
    >
      <div
        style={{
          padding: 'var(--ds-spacing-3) var(--ds-spacing-4)',
        }}
      >
        <Flex align="center" justify="space-between" gap="3" wrap="wrap">
          <Flex align="center" gap="3" style={{ minWidth: 0 }}>
            <Button size="sm" variant="ghost" onClick={onBack} aria-label="랜딩으로 돌아가기">
              ← 뒤로
            </Button>
            <Flex align="center" gap="2" style={{ minWidth: 0 }}>
              <div
                aria-hidden="true"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--ds-radius-md)',
                  background: 'var(--ds-color-primary-600)',
                  color: 'var(--ds-color-neutral-0)',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 'var(--ds-font-weight-bold)',
                  fontSize: 'var(--ds-font-size-sm)',
                }}
              >
                R
              </div>
              <div style={{ minWidth: 0 }}>
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
            <div style={{ position: 'relative' }}>
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
                  style={{
                    position: 'absolute',
                    right: 0,
                    marginTop: 'var(--ds-spacing-2)',
                    width: '256px',
                    background: 'var(--ds-color-neutral-0)',
                    border: '1px solid var(--ds-color-neutral-200)',
                    borderRadius: 'var(--ds-radius-lg)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    overflow: 'hidden',
                    zIndex: 'var(--ds-z-dropdown)',
                  }}
                >
                  {presets.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      role="menuitem"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: 'var(--ds-spacing-3) var(--ds-spacing-4)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(event) => {
                        event.currentTarget.style.background = 'var(--ds-color-neutral-100)';
                      }}
                      onMouseLeave={(event) => {
                        event.currentTarget.style.background = 'transparent';
                      }}
                      onClick={() => {
                        onApplyPreset(preset);
                        setPresetOpen(false);
                      }}
                    >
                      <Text weight="medium" size="sm">
                        {preset.label}
                      </Text>
                      <Text size="xs" color="muted" style={{ marginTop: '2px' }}>
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
        <div style={{ padding: '0 var(--ds-spacing-4) var(--ds-spacing-3)' }}>
          <Alert variant={notice.variant}>{notice.message}</Alert>
        </div>
      )}
    </header>
  );
};

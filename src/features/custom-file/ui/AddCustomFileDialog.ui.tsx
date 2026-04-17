import { useEffect, useId, useRef } from 'react';
import { Flex, Heading, Input, Stack, Text } from 'null_ong2-design-system';
import { Button } from '@/shared/ui';

interface AddCustomFileDialogUIProps {
  readonly open: boolean;
  readonly fileName: string;
  readonly title: string;
  readonly description: string;
  readonly error: string | undefined;
  readonly onFileNameChange: (value: string) => void;
  readonly onTitleChange: (value: string) => void;
  readonly onDescriptionChange: (value: string) => void;
  readonly onSubmit: () => void;
  readonly onClose: () => void;
}

export const AddCustomFileDialogUI = ({
  open,
  fileName,
  title,
  description,
  error,
  onFileNameChange,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onClose,
}: AddCustomFileDialogUIProps) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement;
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 grid place-items-center p-4"
      style={{ zIndex: 'var(--ds-z-modal)', backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md"
        style={{
          backgroundColor: 'var(--ds-color-neutral-0)',
          borderRadius: 'var(--ds-radius-xl)',
          border: '1px solid var(--ds-color-neutral-200)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        }}
      >
        <Stack spacing="0">
          <div
            style={{
              padding: 'var(--ds-spacing-lg)',
              borderBottom: '1px solid var(--ds-color-neutral-200)',
            }}
          >
            <Heading id={titleId} as="h2" size="lg">
              사용자 정의 파일 추가
            </Heading>
            <Text size="sm" color="muted" style={{ marginTop: 'var(--ds-spacing-1)' }}>
              팀/프로젝트에 특화된 규칙 파일을 추가합니다.
            </Text>
          </div>

          <div style={{ padding: 'var(--ds-spacing-lg)' }}>
            <Stack spacing="md">
              <Input
                id="custom-filename"
                label="파일명"
                value={fileName}
                onChange={(event) => onFileNameChange(event.target.value)}
                placeholder="my-team-rules.md"
                hint=".md 확장자는 자동으로 붙습니다"
                required
              />
              <Input
                id="custom-title"
                label="제목"
                value={title}
                onChange={(event) => onTitleChange(event.target.value)}
                placeholder="예: 우리 팀 커밋 규칙"
                required
              />
              <Input
                id="custom-description"
                label="설명"
                value={description}
                onChange={(event) => onDescriptionChange(event.target.value)}
                placeholder="간단한 설명 (선택)"
              />
              {error !== undefined && (
                <Text size="sm" color="danger" role="alert">
                  {error}
                </Text>
              )}
            </Stack>
          </div>

          <div
            style={{
              padding: 'var(--ds-spacing-lg)',
              borderTop: '1px solid var(--ds-color-neutral-200)',
            }}
          >
            <Flex justify="flex-end" gap="2">
              <Button variant="ghost" onClick={onClose}>
                취소
              </Button>
              <Button onClick={onSubmit}>추가</Button>
            </Flex>
          </div>
        </Stack>
      </div>
    </div>
  );
};

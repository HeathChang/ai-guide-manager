import { useEffect, useId, useRef } from 'react';
import { Flex, Heading, Input, Stack, Text } from 'null_ong2-design-system';
import { Button, Modal } from '@/shared/ui';

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
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    // Modal이 컨테이너 focus를 잡은 직후 첫 입력 필드로 이동.
    firstFieldRef.current?.focus();
  }, [open]);

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} size="md">
        <Stack spacing="0">
          <div className="border-b border-border-base p-6">
            <Heading id={titleId} as="h2" size="lg">
              사용자 정의 파일 추가
            </Heading>
            <Text size="sm" color="muted" className="mt-1">
              팀/프로젝트에 특화된 규칙 파일을 추가합니다.
            </Text>
          </div>

          <div className="p-6">
            <Stack spacing="md">
              <Input
                ref={firstFieldRef}
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

          <div className="border-t border-border-base p-6">
            <Flex justify="flex-end" gap="2">
              <Button variant="ghost" onClick={onClose}>
                취소
              </Button>
              <Button onClick={onSubmit}>추가</Button>
            </Flex>
          </div>
        </Stack>
    </Modal>
  );
};

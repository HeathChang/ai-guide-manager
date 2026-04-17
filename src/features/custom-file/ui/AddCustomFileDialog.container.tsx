import { useEffect, useState } from 'react';
import type { CustomFileInput } from '@/features/ruler-workspace';
import { AddCustomFileDialogUI } from './AddCustomFileDialog.ui';

interface AddCustomFileDialogProps {
  readonly open: boolean;
  readonly existingFileNames: ReadonlySet<string>;
  readonly onClose: () => void;
  readonly onSubmit: (input: CustomFileInput) => void;
}

const FILE_NAME_PATTERN = /^[a-z0-9][a-z0-9-_]*\.md$/;

const sanitizeFileName = (raw: string): string => {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.endsWith('.md')) return trimmed;
  return `${trimmed}.md`;
};

export const AddCustomFileDialog = ({
  open,
  existingFileNames,
  onClose,
  onSubmit,
}: AddCustomFileDialogProps) => {
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (open) return;
    setFileName('');
    setTitle('');
    setDescription('');
    setError(undefined);
  }, [open]);

  const handleSubmit = () => {
    const normalized = sanitizeFileName(fileName);
    if (!FILE_NAME_PATTERN.test(normalized)) {
      setError('파일명은 영문 소문자/숫자/하이픈/언더스코어만 사용할 수 있고, .md로 끝나야 합니다');
      return;
    }
    if (existingFileNames.has(normalized)) {
      setError('이미 존재하는 파일명입니다');
      return;
    }
    if (title.trim().length === 0) {
      setError('제목을 입력해 주세요');
      return;
    }
    onSubmit({
      fileName: normalized,
      title: title.trim(),
      description: description.trim(),
    });
    onClose();
  };

  return (
    <AddCustomFileDialogUI
      open={open}
      fileName={fileName}
      title={title}
      description={description}
      error={error}
      onFileNameChange={setFileName}
      onTitleChange={setTitle}
      onDescriptionChange={setDescription}
      onSubmit={handleSubmit}
      onClose={onClose}
    />
  );
};

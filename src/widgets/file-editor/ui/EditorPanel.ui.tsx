import { useState } from 'react';
import type { RulerFile } from '@/entities/ruler-file';
import { Button, Tabs } from '@/shared/ui';
import type { TabItem } from '@/shared/ui';
import { MarkdownEditor } from './MarkdownEditor.ui';
import { MarkdownPreview } from './MarkdownPreview.ui';

type ViewMode = 'preview' | 'edit';

const TAB_ITEMS: ReadonlyArray<TabItem<ViewMode>> = [
  { value: 'preview', label: '미리보기' },
  { value: 'edit', label: '편집' },
];

interface EditorPanelProps {
  readonly file: RulerFile | undefined;
  readonly content: string;
  readonly isEdited: boolean;
  readonly onChange: (next: string) => void;
  readonly onReset: () => void;
}

export const EditorPanel = ({
  file,
  content,
  isEdited,
  onChange,
  onReset,
}: EditorPanelProps) => {
  const [mode, setMode] = useState<ViewMode>('preview');

  if (file === undefined) {
    return (
      <div className="flex-1 grid place-items-center text-text-muted">
        왼쪽에서 파일을 선택해 주세요
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-bg-card">
      <header className="px-5 py-3 border-b border-border-base flex items-center justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold truncate">{file.fileName}</span>
            {isEdited && (
              <span className="text-xs text-brand font-medium" aria-label="편집됨">
                편집됨
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted truncate">{file.description}</p>
        </div>
        <div className="flex items-center gap-2">
          {isEdited && (
            <Button size="sm" variant="ghost" onClick={onReset}>
              기본값으로 되돌리기
            </Button>
          )}
          <Tabs items={TAB_ITEMS} value={mode} onChange={setMode} ariaLabel="보기 모드" />
        </div>
      </header>
      <div className="flex-1 min-h-0">
        {mode === 'preview' ? (
          <MarkdownPreview source={content} />
        ) : (
          <MarkdownEditor value={content} onChange={onChange} />
        )}
      </div>
    </section>
  );
};

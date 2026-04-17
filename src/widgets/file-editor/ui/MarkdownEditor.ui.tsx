import Editor from '@monaco-editor/react';
import { useTheme } from '@/shared/lib';

interface MarkdownEditorProps {
  readonly value: string;
  readonly onChange: (value: string) => void;
}

export const MarkdownEditor = ({ value, onChange }: MarkdownEditorProps) => {
  const { theme } = useTheme();
  return (
    <div className="h-full">
      <Editor
        height="100%"
        defaultLanguage="markdown"
        value={value}
        theme={theme === 'dark' ? 'vs-dark' : 'light'}
        onChange={(next) => onChange(next ?? '')}
        options={{
          minimap: { enabled: false },
          wordWrap: 'on',
          fontSize: 14,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          lineNumbers: 'on',
          renderLineHighlight: 'line',
          tabSize: 2,
        }}
      />
    </div>
  );
};

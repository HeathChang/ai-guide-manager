import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  readonly source: string;
}

export const MarkdownPreview = ({ source }: MarkdownPreviewProps) => (
  <div className="markdown-body p-6 overflow-y-auto h-full">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>{source}</ReactMarkdown>
  </div>
);

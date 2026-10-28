import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '../lib/utils';

export default function MarkdownPreview({ content, className = '', emptyLabel = 'Nothing to preview yet. Start writing in the editor.' }) {
  const text = (content || '').trim();

  if (!text) {
    return (
      <div className={cn('flex h-full items-center justify-center p-8 text-center', className)}>
        <p className="text-sm italic text-slate-400">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeSanitize]}
        components={{
          a: ({ node, ...props }) => <a {...props} target="_blank" rel="noreferrer noopener" />,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

import { useMemo, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { languages } from '@codemirror/language-data';
import { EditorView } from '@codemirror/view';
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Strikethrough,
} from 'lucide-react';
import { cn } from '../lib/utils';

const wrapWith = (view, before, after, placeholder) => {
  const { from, to } = view.state.selection.main;
  const selected = view.state.sliceDoc(from, to);
  const text = selected || placeholder;
  view.dispatch({
    changes: { from, to, insert: `${before}${text}${after}` },
    selection: { anchor: from + before.length, head: from + before.length + text.length },
  });
  view.focus();
};

const toggleLinePrefix = (view, prefix) => {
  const { from, to } = view.state.selection.main;
  const doc = view.state.doc;
  const startLine = doc.lineAt(from);
  const endLine = doc.lineAt(to);
  const lines = [];
  for (let number = startLine.number; number <= endLine.number; number += 1) lines.push(doc.line(number));

  const allPrefixed = lines.every((line) => line.text.startsWith(prefix));
  const nextText = lines
    .map((line) => (allPrefixed ? line.text.slice(prefix.length) : `${prefix}${line.text}`))
    .join('\n');

  view.dispatch({
    changes: { from: startLine.from, to: endLine.to, insert: nextText },
    selection: { anchor: startLine.from, head: startLine.from + nextText.length },
  });
  view.focus();
};

const insertBlock = (view, block) => {
  const { from, to } = view.state.selection.main;
  view.dispatch({
    changes: { from, to, insert: block },
    selection: { anchor: from + block.length },
  });
  view.focus();
};

const TOOLS = [
  { key: 'bold', label: 'Bold', icon: Bold, run: (view) => wrapWith(view, '**', '**', 'bold text') },
  { key: 'italic', label: 'Italic', icon: Italic, run: (view) => wrapWith(view, '*', '*', 'italic text') },
  { key: 'strike', label: 'Strikethrough', icon: Strikethrough, run: (view) => wrapWith(view, '~~', '~~', 'strikethrough') },
  { key: 'h1', label: 'Heading 1', icon: Heading1, run: (view) => toggleLinePrefix(view, '# ') },
  { key: 'h2', label: 'Heading 2', icon: Heading2, run: (view) => toggleLinePrefix(view, '## ') },
  { key: 'h3', label: 'Heading 3', icon: Heading3, run: (view) => toggleLinePrefix(view, '### ') },
  { key: 'quote', label: 'Blockquote', icon: Quote, run: (view) => toggleLinePrefix(view, '> ') },
  { key: 'ul', label: 'Bullet list', icon: List, run: (view) => toggleLinePrefix(view, '- ') },
  { key: 'ol', label: 'Ordered list', icon: ListOrdered, run: (view) => toggleLinePrefix(view, '1. ') },
  { key: 'link', label: 'Link', icon: Link2, run: (view) => wrapWith(view, '[', '](https://example.com)', 'link text') },
  { key: 'image', label: 'Image', icon: ImageIcon, run: (view) => wrapWith(view, '![', '](https://example.com/image.png)', 'alt text') },
  { key: 'code', label: 'Code', icon: Code, run: (view) => wrapWith(view, '`', '`', 'code') },
  { key: 'hr', label: 'Horizontal line', icon: Minus, run: (view) => insertBlock(view, '\n\n---\n\n') },
];

export default function MarkdownEditor({
  value,
  onChange,
  onCreateEditor,
  placeholder = 'Start writing your chapter in Markdown...',
  className = '',
}) {
  const viewRef = useRef(null);
  const [selection, setSelection] = useState({ from: 0, to: 0 });

  const extensions = useMemo(
    () => [
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.selectionSet || update.docChanged) {
          const main = update.state.selection.main;
          setSelection({ from: main.from, to: main.to });
        }
      }),
      EditorView.contentAttributes.of({ 'aria-label': 'Chapter content' }),
    ],
    []
  );

  const runTool = (tool) => {
    const view = viewRef.current;
    if (!view) return;
    tool.run(view);
  };

  return (
    <div className={cn('flex h-full flex-col border border-slate-200 bg-white', className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-1.5">
        {TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <span key={tool.key} className="flex items-center">
              <button
                type="button"
                onClick={() => runTool(tool)}
                title={tool.label}
                aria-label={tool.label}
                className="rounded-md p-1.5 text-slate-500 transition hover:bg-white hover:text-primary-600 hover:shadow-sm"
              >
                <Icon size={15} />
              </button>
              {(index === 2 || index === 6 || index === 10) && (
                <span className="mx-1 h-4 w-px bg-slate-200" aria-hidden="true" />
              )}
            </span>
          );
        })}
        <span className="ml-auto hidden pr-1 text-[11px] text-slate-400 sm:block">
          {selection.from === selection.to ? 'Markdown' : `${selection.to - selection.from} selected`}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <CodeMirror
          value={value || ''}
          height="100%"
          theme="light"
          extensions={extensions}
          onChange={onChange}
          onCreateEditor={(view) => {
            viewRef.current = view;
            onCreateEditor?.(view);
          }}
          placeholder={placeholder}
          className="h-full text-[14px]"
          basicSetup={{
            lineNumbers: false,
            foldGutter: false,
            highlightActiveLine: true,
            autocompletion: false,
            bracketMatching: true,
            closeBrackets: true,
          }}
        />
      </div>
    </div>
  );
}

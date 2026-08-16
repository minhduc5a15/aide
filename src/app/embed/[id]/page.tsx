'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Editor, { Monaco } from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import clsx from 'clsx';
import 'highlight.js/styles/github-dark.css';
import { moonlightTheme } from '@/lib/monacoTheme';

export default function EmbedView() {
  const { id } = useParams();
  const [data, setData] = useState<unknown>(null);
  const [activeFile, setActiveFile] = useState(0);

  useEffect(() => {
    fetch(`/api/snippets/${id}`)
      .then((res) => res.json())
      .then((json) => {
        if (json && !json.error) setData(json);
      });
  }, [id]);

  if (!data)
    return (
      <div className="h-screen flex items-center justify-center bg-[#222436] text-[#c8d3f5] text-sm font-sans">
        Loading snippet...
      </div>
    );

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('moonlight', moonlightTheme as Record<string, unknown>);
  };

  const currentFile = (data as { files?: { name: string; content: string }[] }).files?.[activeFile];
  const isMarkdown = currentFile?.name?.toLowerCase().endsWith('.md');

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-gray-100 font-sans border border-gray-700 rounded-lg overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 bg-[#2d2d2d] border-b border-[#404040]">
        <div className="flex gap-2">
          {(data as { files?: { name: string; content: string }[] }).files?.map(
            (file: { name: string; content: string }, idx: number) => (
              <button
                key={idx}
                onClick={() => setActiveFile(idx)}
                className={clsx(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  activeFile === idx
                    ? 'bg-[#3e3e42] text-white'
                    : 'text-gray-400 hover:text-gray-200'
                )}
              >
                {file.name}
              </button>
            )
          )}
        </div>
        <a
          href={`/${(data as { user?: { name?: string } })?.user?.name || 'guest'}/${id}`}
          target="_blank"
          className="text-xs font-semibold text-blue-400 hover:text-blue-300"
        >
          View on AIDE
        </a>
      </header>

      <main className="flex-1 overflow-auto relative bg-[#1e1e1e]">
        {isMarkdown ? (
          <div className="absolute inset-0 overflow-y-auto p-4 prose prose-sm prose-invert max-w-none bg-[#1e1e1e]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {currentFile?.content || ''}
            </ReactMarkdown>
          </div>
        ) : (
          <Editor
            height={`${Math.max(100, (currentFile?.content?.split('\n').length || 1) * 21)}px`}
            theme="moonlight"
            path={currentFile?.name}
            beforeMount={handleEditorWillMount}
            value={currentFile?.content?.trimEnd() || ''}
            onMount={(editor) => {
              editor.updateOptions({ scrollBeyondLastLine: false });
              editor.layout();
              setTimeout(() => {
                editor.updateOptions({ scrollBeyondLastLine: false });
                editor.layout();
              }, 500);
            }}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              lineHeight: 21,
              fontFamily: 'Consolas, "Courier New", monospace',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'off',
              padding: { top: 0, bottom: 0 },
            }}
          />
        )}
      </main>
    </div>
  );
}

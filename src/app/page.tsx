'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  Plus,
  Trash2,
  Code2,
  FileText,
  Copy,
  AlignLeft,
  Lock,
  Globe,
  ChevronRight,
  Home as HomeIcon,
  Zap,
  Keyboard,
  Check,
  Command,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { moonlightTheme } from '@/lib/monacoTheme';
import Link from 'next/link';
import clsx from 'clsx';

const TEMPLATES = [
  {
    name: 'React Component',
    ext: 'tsx',
    code: `import React from 'react';\n\nexport default function Component() {\n  return (\n    <div>\n      <h1>Hello World</h1>\n    </div>\n  );\n}`,
  },
  {
    name: 'Node.js API',
    ext: 'js',
    code: `const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello World' });\n});\n\napp.listen(3000);`,
  },
  {
    name: 'Python Script',
    ext: 'py',
    code: `def main():\n    print("Hello World")\n\nif __name__ == "__main__":\n    main()`,
  },
  {
    name: 'C++ Boilerplate',
    ext: 'cpp',
    code: `#include <iostream>\n\nint main() {\n    std::cout << "Hello World" << std::endl;\n    return 0;\n}`,
  },
];

const getLangColor = (ext: string) => {
  switch (ext.toLowerCase()) {
    case 'js':
    case 'jsx':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
    case 'ts':
    case 'tsx':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case 'py':
      return 'bg-blue-600/10 text-blue-500 border-blue-600/30';
    case 'cpp':
    case 'c':
    case 'cc':
      return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
    case 'html':
      return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
    case 'css':
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    case 'go':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    case 'rs':
      return 'bg-orange-600/10 text-orange-500 border-orange-600/30';
    case 'java':
      return 'bg-red-500/10 text-red-500 border-red-500/30';
    case 'json':
      return 'bg-green-500/10 text-green-500 border-green-500/30';
    case 'md':
      return 'bg-zinc-100/10 text-zinc-100 border-zinc-100/30';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  }
};

const DEFAULT_CODE = `#include <iostream>

int main() {
    std::cout << "Hello world";
    return 0;
}`;

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([
    { name: 'main.cpp', content: DEFAULT_CODE, isUntouched: true },
  ]);
  const [saving, setSaving] = useState(false);

  // Store editor references for format actions
  const editorRefs = useRef<{ [key: number]: unknown }>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (status === 'loading') {
    return (
      <div
        suppressHydrationWarning
        className="min-h-[calc(100vh-64px)] flex justify-center items-center text-zinc-500"
      >
        Loading...
      </div>
    );
  }

  const handleSave = async (isSecret: boolean) => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await fetch('/api/snippets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, isSecret, files }),
      });
      const data = await res.json();
      if (data.id) {
        router.push(`/${data.id}`);
      } else {
        toast.error(data.error || 'Failed to save');
        setSaving(false);
      }
    } catch {
      toast.error('Network error');
      setSaving(false);
    }
  };

  const updateFile = (idx: number, key: 'name' | 'content', val: string) => {
    const newFiles = [...files];
    newFiles[idx] = { ...newFiles[idx], [key]: val };
    if (key === 'content') {
      newFiles[idx].isUntouched = false;
    }
    setFiles(newFiles);
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const applyTemplate = (template: (typeof TEMPLATES)[0]) => {
    if (files.length === 1 && files[0].isUntouched) {
      setFiles([{ name: `main.${template.ext}`, content: template.code, isUntouched: false }]);
    } else {
      setFiles([
        ...files,
        { name: `new.${template.ext}`, content: template.code, isUntouched: false },
      ]);
    }
    toast.success(`Applied ${template.name} template`);
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme('moonlight', moonlightTheme as Record<string, unknown>);
  };

  const handleEditorMount = (
    editor: import('monaco-editor').editor.IStandaloneCodeEditor,
    idx: number
  ) => {
    editorRefs.current[idx] = editor;

    // Listen to focus to remove untouched state
    editor.onDidFocusEditorWidget(() => {
      setFiles((prevFiles) => {
        if (prevFiles[idx].isUntouched) {
          const newFiles = [...prevFiles];
          newFiles[idx] = { ...newFiles[idx], isUntouched: false, content: '' };
          return newFiles;
        }
        return prevFiles;
      });
    });
  };

  const formatCode = (idx: number) => {
    const editor = editorRefs.current[idx] as
      import('monaco-editor').editor.IStandaloneCodeEditor | undefined;
    if (editor) {
      editor?.getAction('editor.action.formatDocument')?.run();
      toast.success('Code formatted');
    }
  };

  const copyCode = (idx: number) => {
    navigator.clipboard.writeText(files[idx].content);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Copied to clipboard');
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
        <Link href="/" className="hover:text-zinc-300 flex items-center gap-1">
          <HomeIcon size={14} /> Home
        </Link>
        <ChevronRight size={14} />
        <span className="text-zinc-200 font-medium">New Snippet</span>
      </div>

      {!session && (
        <div className="mb-6 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50 shadow-sm flex items-start gap-3">
          <User className="text-zinc-400 mt-0.5 shrink-0" size={18} />
          <p className="text-sm text-zinc-400">
            You are not logged in. You can create public or secret snippets anonymously, but they
            will not be saved to your account.
            <Link href="/login" className="text-indigo-400 hover:underline ml-1">
              Sign in
            </Link>{' '}
            to track your snippets.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Editor Area */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Description Input */}
          <div className="flex items-start gap-3 bg-zinc-900/40 p-3 rounded-lg border border-zinc-800/80 shadow-sm focus-within:border-zinc-600 focus-within:bg-zinc-900/80 transition-colors">
            <FileText className="text-zinc-500 mt-1" size={18} />
            <textarea
              placeholder="Snippet description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={1}
              className="w-full bg-transparent text-zinc-100 focus:outline-none placeholder-zinc-600 text-sm resize-none mt-1"
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
          </div>

          {/* Files List */}
          {files.map((file, idx) => {
            const extension = file.name.includes('.') ? file.name.split('.').pop() || '' : '';
            const lineCount = file.content.split('\n').length;
            const charCount = file.content.length;
            const isUntouchedPlaceholder = file.isUntouched && file.name === 'main.cpp';

            return (
              <div
                key={idx}
                className="border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-950 shadow-md flex flex-col relative group"
              >
                {/* File Header */}
                <div className="flex items-center justify-between bg-zinc-900 px-4 py-2 border-b border-zinc-800">
                  <div className="flex items-center flex-1">
                    <div
                      className={clsx(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md border bg-zinc-950/50 shadow-inner focus-within:ring-1 focus-within:ring-indigo-500/50 focus-within:border-indigo-500/50 transition-all w-full max-w-sm',
                        'border-zinc-800'
                      )}
                    >
                      <input
                        type="text"
                        placeholder="Filename including extension..."
                        value={file.name}
                        onChange={(e) => updateFile(idx, 'name', e.target.value)}
                        className="bg-transparent focus:outline-none text-zinc-200 font-mono text-sm placeholder-zinc-600 flex-1 min-w-0"
                      />
                      {extension && (
                        <span
                          className={clsx(
                            'px-1.5 py-0.5 text-[10px] rounded border font-mono uppercase tracking-wider shrink-0',
                            getLangColor(extension)
                          )}
                        >
                          {extension}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {files.length > 1 && (
                      <button
                        onClick={() => removeFile(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Editor Toolbar */}
                <div className="flex items-center justify-between px-4 py-1.5 bg-zinc-900/50 border-b border-zinc-800/50 text-xs text-zinc-500">
                  <div className="flex items-center gap-4 font-mono">
                    <span>{lineCount} lines</span>
                    <span>{charCount} chars</span>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => formatCode(idx)}
                      className="flex items-center gap-1.5 px-2 py-1 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                      title="Format Code"
                    >
                      <AlignLeft size={14} /> Format
                    </button>
                    <button
                      onClick={() => copyCode(idx)}
                      className="flex items-center gap-1.5 px-2 py-1 hover:text-zinc-300 hover:bg-zinc-800 rounded transition-colors"
                    >
                      {copiedIndex === idx ? (
                        <Check size={14} className="text-green-500" />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copiedIndex === idx ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>

                {/* Editor Area */}
                <div className="h-[400px] relative bg-zinc-950">
                  {isUntouchedPlaceholder && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/60 backdrop-blur-[1px] pointer-events-none z-20 transition-opacity">
                      <div className="bg-zinc-900/90 px-6 py-4 rounded-2xl border border-zinc-800 shadow-xl flex flex-col items-center animate-pulse-slow">
                        <Code2 size={32} className="text-indigo-400 mb-3" />
                        <p className="text-zinc-200 font-medium">Click to start coding</p>
                        <p className="text-zinc-500 text-sm mt-1">
                          Or apply a template from the right
                        </p>
                      </div>
                    </div>
                  )}

                  <div
                    className={clsx(
                      'h-full w-full',
                      isUntouchedPlaceholder && 'opacity-40 blur-[1px] grayscale-[0.5]'
                    )}
                  >
                    <Editor
                      height="100%"
                      theme="moonlight"
                      path={file.name}
                      beforeMount={handleEditorWillMount}
                      onMount={(editor) => handleEditorMount(editor, idx)}
                      value={file.content}
                      onChange={(val) => updateFile(idx, 'content', val || '')}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineHeight: 24,
                        fontFamily: 'JetBrains Mono, Consolas, monospace',
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        wordWrap: 'on',
                        padding: { top: 16, bottom: 16 },
                        cursorBlinking: 'smooth',
                        smoothScrolling: true,
                        overviewRulerLanes: 0,
                        renderLineHighlight: 'all',
                        renderLineHighlightOnlyWhenFocus: true,
                      }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setFiles([...files, { name: '', content: '', isUntouched: false }])}
              className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-zinc-900 border border-dashed border-zinc-700 hover:border-zinc-500 rounded-md text-sm font-medium transition-colors text-zinc-400 hover:text-zinc-200"
            >
              <Plus size={16} /> Add file
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                <Lock size={16} className="text-zinc-400" /> Create secret snippet
              </button>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-medium transition-all shadow-md shadow-indigo-900/20 hover:shadow-lg disabled:opacity-50"
              >
                <Globe size={16} className="opacity-80" /> Create public snippet
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Sidebar */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-4">
              <Zap size={18} className="text-yellow-500" />
              Quick Templates
            </div>
            <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
              Start your snippet instantly by applying one of these popular boilerplates.
            </p>
            <div className="flex flex-col gap-2">
              {TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 hover:border-zinc-600 transition-all text-sm group text-left"
                >
                  <span className="text-zinc-300 font-medium group-hover:text-zinc-100 transition-colors">
                    {template.name}
                  </span>
                  <span
                    className={clsx(
                      'px-1.5 py-0.5 text-[10px] rounded font-mono uppercase tracking-wider',
                      getLangColor(template.ext)
                    )}
                  >
                    {template.ext}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold mb-4">
              <Keyboard size={18} className="text-indigo-400" />
              Editor Shortcuts
            </div>
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Format document</span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    Shift
                  </kbd>
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    Alt
                  </kbd>
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    F
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Command Palette</span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    <Command size={10} className="inline" />
                  </kbd>
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    Shift
                  </kbd>
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    P
                  </kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Find & Replace</span>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    <Command size={10} className="inline" />
                  </kbd>
                  <kbd className="px-1.5 py-1 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">
                    F
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

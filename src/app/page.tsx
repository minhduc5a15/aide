'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Editor from '@monaco-editor/react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState([{ name: '', content: '' }]);
  const [saving, setSaving] = useState(false);

  if (status === 'loading') {
    return <div className="min-h-[calc(100vh-64px)] flex justify-center items-center text-zinc-500">Loading...</div>;
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
    } catch (e) {
      toast.error('Network error');
      setSaving(false);
    }
  };

  const updateFile = (idx: number, key: 'name' | 'content', val: string) => {
    const newFiles = [...files];
    newFiles[idx][key] = val;
    setFiles(newFiles);
  };

  const removeFile = (idx: number) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {!session && (
        <div className="mb-6 p-4 border border-zinc-800 rounded-lg bg-zinc-900/50">
          <p className="text-sm text-zinc-400">
            You are not logged in. You can create public or secret snippets anonymously, but they will not be saved to an account.
          </p>
        </div>
      )}

      <div className="mb-6">
        <input
          type="text"
          placeholder="Snippet description..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-transparent border-b border-zinc-800 px-2 py-3 text-zinc-100 focus:outline-none focus:border-zinc-500 placeholder-zinc-500 text-sm transition-colors"
        />
      </div>

      <div className="flex flex-col gap-6">
        {files.map((file, idx) => (
          <div key={idx} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900 shadow-sm">
            <div className="flex items-center justify-between bg-zinc-900 px-4 py-2.5 border-b border-zinc-800">
              <input
                type="text"
                placeholder="Filename including extension..."
                value={file.name}
                onChange={(e) => updateFile(idx, 'name', e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600 text-zinc-200 w-80 font-mono transition-colors placeholder-zinc-600"
              />
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
            <div className="h-[400px]">
              <Editor
                height="100%"
                theme="vs-dark"
                path={file.name}
                value={file.content}
                onChange={(val) => updateFile(idx, 'content', val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: 'JetBrains Mono, Consolas, monospace',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: 'off',
                  padding: { top: 12, bottom: 12 },
                  cursorBlinking: 'smooth',
                  smoothScrolling: true,
                  overviewRulerLanes: 0,
                  renderLineHighlight: 'none',
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={() => setFiles([...files, { name: '', content: '' }])}
          className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-sm font-medium transition-colors text-zinc-300"
        >
          Add file
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
          >
            Create secret snippet
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-md text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
          >
            Create public snippet
          </button>
        </div>
      </div>
    </main>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Editor from '@monaco-editor/react';
import { Copy, Share2, MessageSquare, Check, Download, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import 'highlight.js/styles/github-dark.css';

export default function SnippetView() {
  const { data: session } = useSession();
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  
  // Feedback states
  const [embedCopied, setEmbedCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState<number | null>(null);

  const fetchSnippet = useCallback(async () => {
    try {
      const res = await fetch(`/api/snippets/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSnippet();
  }, [fetchSnippet]);

  useEffect(() => {
    if (data?.files?.[0]?.name) {
      document.title = data.files[0].name;
    }
  }, [data]);

  const handleCopy = (content: string, idx: number) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(idx);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const handleEmbed = () => {
    const embedCode = `<iframe src="${window.location.origin}/embed/${id}" width="100%" height="400" frameborder="0"></iframe>`;
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleDownload = (file: any) => {
    const blob = new Blob([file.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFork = async () => {
    if (!session) {
      toast.error('Please login to clone snippets');
      return router.push('/login');
    }
    const res = await fetch(`/api/snippets/${id}/fork`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (json.id) {
      router.push(`/${json.id}`);
    }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/snippets/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment, guestName: author })
    });
    setComment('');
    fetchSnippet();
  };

  if (loading) return <div className="min-h-[calc(100vh-64px)] flex justify-center items-center text-zinc-500">Loading snippet...</div>;
  if (!data) return <div className="min-h-[calc(100vh-64px)] flex justify-center items-center text-red-400">Snippet not found</div>;

  return (
    <main className="max-w-5xl mx-auto mt-8 px-4 pb-16">
      
      {/* Header Info */}
      <div className="flex items-start justify-between mb-6 border-b border-zinc-800 pb-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 mt-0.5 border border-zinc-700">
            {data.user?.image ? (
              <Image src={data.user.image} alt={data.user?.name || 'User'} width={40} height={40} className="w-full h-full object-cover" />
            ) : (
              <span className="font-semibold text-zinc-200">
                {data.user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-lg text-zinc-100 font-semibold flex items-center gap-2">
              <span className="text-zinc-400 hover:text-zinc-300 hover:underline cursor-pointer">{data.user?.name || 'anonymous'}</span>
              <span className="text-zinc-600">/</span>
              <span className="hover:underline cursor-pointer">{data.files?.[0]?.name || 'snippet'}</span>
            </div>
            <div className="text-sm text-zinc-500 mt-1">
              Created {new Date(data.createdAt).toLocaleDateString()}
              {data.forkedFromId && (
                <span> • Cloned from <Link href={`/${data.forkedFromId}`} className="text-zinc-400 hover:text-zinc-300 hover:underline">{data.forkedFromId}</Link></span>
              )}
              {data.isSecret && <span className="ml-2 px-1.5 py-0.5 rounded-md border border-zinc-800 text-xs font-medium text-zinc-400">Secret</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={handleEmbed} className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 transition-colors">
            {embedCopied ? <Check size={14} className="text-green-400" /> : <Code2 size={14} className="hidden" />}
            {embedCopied ? 'Copied' : 'Embed'}
          </button>
          <button onClick={handleFork} className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 transition-colors">
            <Share2 size={14} /> Clone
          </button>
        </div>
      </div>

      {data.description && (
        <p className="text-zinc-300 text-sm mb-6">
          {data.description}
        </p>
      )}

      {/* Files List */}
      <div className="flex flex-col gap-8">
        {data.files?.map((file: any, idx: number) => {
          const isMarkdown = file.name.toLowerCase().endsWith('.md');
          const linesCount = file.content.split('\n').length;
          const isCopied = copiedFile === idx;

          return (
            <div key={idx} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 border-b border-zinc-800">
                <div className="text-sm font-medium text-zinc-200 font-mono hover:text-zinc-100 cursor-pointer">{file.name}</div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleDownload(file)} className="flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-md transition-colors text-zinc-300" title="Download file">
                    <Download size={14} /> Download
                  </button>
                  <button onClick={() => handleCopy(file.content, idx)} className="flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-md transition-colors text-zinc-300">
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {isCopied ? 'Copied' : 'Copy raw'}
                  </button>
                </div>
              </div>
              <div className="bg-zinc-950">
                {isMarkdown ? (
                  <div className="p-8 prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                      {file.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <Editor
                    height={`${Math.max(100, linesCount * 22)}px`}
                    theme="vs-dark"
                    path={file.name}
                    value={file.content?.trimEnd()}
                    onMount={(editor) => {
                      editor.updateOptions({ scrollBeyondLastLine: false });
                      editor.layout();
                    }}
                    options={{
                      readOnly: true,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineHeight: 22,
                      fontFamily: 'JetBrains Mono, Consolas, monospace',
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      wordWrap: 'off',
                      padding: { top: 12, bottom: 12 },
                      overviewRulerLanes: 0,
                      renderLineHighlight: 'none',
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Section */}
      <div className="mt-16 pt-8 border-t border-zinc-800">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-100">
          <MessageSquare size={18} /> Discussion ({data.comments?.length || 0})
        </h3>
        
        <div className="flex flex-col gap-6 mb-10">
          {data.comments?.map((c: any) => {
            const displayName = c.user?.name || c.guestName || 'Anonymous';
            return (
            <div key={c.id} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden">
              <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-semibold text-zinc-300 text-xs border border-zinc-700 overflow-hidden">
                  {c.user?.image ? (
                    <Image src={c.user.image} alt={displayName} width={28} height={28} className="w-full h-full object-cover" />
                  ) : (
                    displayName.charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <span className="font-semibold text-zinc-200 text-sm">
                    {displayName} {!c.userId && <span className="text-xs font-normal text-zinc-500 ml-1">(Guest)</span>}
                  </span>
                  <span className="text-xs text-zinc-500 ml-2">
                    commented on {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="p-5 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed bg-zinc-950/50">
                {c.content}
              </div>
            </div>
          )})}
        </div>

        <div className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm">
          <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 text-sm font-semibold text-zinc-200">
            Write a comment
          </div>
          <div className="p-4 flex flex-col gap-4 bg-zinc-950/50">
            {!session && (
              <input
                type="text"
                placeholder="Name (Optional)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-md p-2.5 text-sm focus:outline-none focus:border-zinc-500 text-zinc-100 placeholder-zinc-500 transition-colors"
              />
            )}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Leave a comment"
              className="w-full h-28 bg-zinc-950 border border-zinc-800 rounded-md p-3 text-sm focus:outline-none focus:border-zinc-500 text-zinc-100 placeholder-zinc-500 transition-colors resize-y"
            />
            <div className="flex justify-end gap-4 items-center">
              {!session && <span className="text-xs text-zinc-500">Posting as Guest</span>}
              <button
                onClick={submitComment}
                disabled={!comment.trim()}
                className="px-5 py-2 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                Comment
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Editor, { Monaco } from '@monaco-editor/react';
import {
  Copy,
  Share2,
  MessageSquare,
  Check,
  Download,
  Code2,
  ChevronDown,
  ChevronRight,
  Star,
  Trash2,
  Pencil,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import Link from 'next/link';
import Image from 'next/image';
import toast from 'react-hot-toast';
import 'highlight.js/styles/github-dark.css';
import { moonlightTheme } from '@/lib/monacoTheme';

export default function SnippetView() {
  const params = useParams();
  const id = params.id as string;
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Feedback states
  const [embedCopied, setEmbedCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState<number | null>(null);
  const [collapsedFiles, setCollapsedFiles] = useState<Set<number>>(new Set());

  const toggleCollapse = (idx: number) => {
    const newSet = new Set(collapsedFiles);
    if (newSet.has(idx)) {
      newSet.delete(idx);
    } else {
      newSet.add(idx);
    }
    setCollapsedFiles(newSet);
  };

  const fetchSnippet = useCallback(async () => {
    try {
      const res = await fetch(`/api/snippets/${id}`);
      const json = await res.json();
      if (res.ok) {
        setData(json);
      } else {
        toast.error(json.error);
      }
    } catch (e: unknown) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSnippet();
  }, [fetchSnippet]);

  useEffect(() => {
    if ((data as { files?: { name: string }[] })?.files?.[0]?.name) {
      document.title = (data as { files?: { name: string }[] }).files![0].name;
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

  const handleDownload = (file: { name: string; content: string }) => {
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
      headers: { 'Content-Type': 'application/json' },
    });
    const json = await res.json();
    if (json.id) {
      router.push(`/${json.id}`);
    }
  };

  const handleStar = async () => {
    if (!session) {
      toast.error('Please login to star snippets');
      return router.push('/login');
    }
    try {
      const res = await fetch(`/api/snippets/${id}/star`, { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setData((prev: Record<string, unknown>) => ({
          ...(prev as Record<string, unknown>),
          isStarred: json.starred,
          _count: {
            ...(prev as { _count?: { stars: number } })._count,
            stars:
              ((prev as { _count?: { stars: number } })._count?.stars || 0) +
              (json.starred ? 1 : -1),
          },
        }));
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error('Failed to star snippet');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this snippet? This action cannot be undone.'))
      return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/snippets/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Snippet deleted');
        router.push('/');
      } else {
        const json = await res.json();
        toast.error(json.error || 'Failed to delete snippet');
        setIsDeleting(false);
      }
    } catch (e: unknown) {
      console.error(e);
      toast.error('Failed to delete snippet');
      setIsDeleting(false);
    }
  };

  const submitComment = async () => {
    if (!comment.trim()) return;
    await fetch(`/api/snippets/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: comment, guestName: author }),
    });
    setComment('');
    fetchSnippet();
  };

  const handleEditorWillMount = (monaco: Monaco) => {
    monaco.editor.defineTheme(
      'moonlight',
      moonlightTheme as import('monaco-editor').editor.IStandaloneThemeData
    );
  };

  if (loading)
    return (
      <div
        suppressHydrationWarning
        className="min-h-[calc(100vh-64px)] flex justify-center items-center text-zinc-500"
      >
        Loading snippet...
      </div>
    );
  if (!data)
    return (
      <div className="min-h-[calc(100vh-64px)] flex justify-center items-center text-red-400">
        Snippet not found
      </div>
    );

  const d = data as {
    userId?: string;
    isStarred?: boolean;
    description?: string;
    files?: { name: string; content: string }[];
    user?: { name?: string; image?: string };
    createdAt?: string | Date;
    forkedFromId?: string;
    isSecret?: boolean;
    _count?: { stars?: number; comments?: number };
    comments?: {
      id: string;
      content: string;
      createdAt: string | Date;
      userId: string | null;
      guestName: string | null;
      user: { name: string | null; image: string | null } | null;
    }[];
  };

  return (
    <main className="max-w-5xl mx-auto mt-8 px-4 pb-16">
      {/* Header Info */}
      <div className="flex items-start justify-between mb-6 border-b border-zinc-800 pb-6">
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden shrink-0 mt-0.5 border border-zinc-700">
            {(d.user as { image?: string })?.image ? (
              <Image
                src={d.user?.image || ''}
                alt={(d.user as { name?: string })?.name || 'User'}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-semibold text-zinc-200">
                {(d.user as { name?: string })?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <div className="text-lg text-zinc-100 font-semibold flex items-center gap-2">
              <span className="text-zinc-400 hover:text-zinc-300 hover:underline cursor-pointer">
                {(d.user as { name?: string })?.name || 'anonymous'}
              </span>
              <span className="text-zinc-600">/</span>
              <span className="hover:underline cursor-pointer">
                {(d.files as { name: string }[])?.[0]?.name || 'snippet'}
              </span>
            </div>
            <div className="text-sm text-zinc-500 mt-1">
              Created {new Date(String(d.createdAt)).toLocaleDateString()}
              {d.forkedFromId && (
                <span>
                  {' '}
                  • Cloned from{' '}
                  <Link
                    href={`/${String(d.forkedFromId)}`}
                    className="text-zinc-400 hover:text-zinc-300 hover:underline"
                  >
                    {String(d.forkedFromId)}
                  </Link>
                </span>
              )}
              {Boolean(d.isSecret) && (
                <span className="ml-2 px-1.5 py-0.5 rounded-md border border-zinc-800 text-xs font-medium text-zinc-400">
                  Secret
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          {session && session.user && (session.user as { id: string }).id === String(d.userId) && (
            <>
              <Link
                href={`/edit/${id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 transition-colors"
              >
                <Pencil size={14} /> Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-md text-xs font-medium text-red-400 transition-colors"
              >
                <Trash2 size={14} /> {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </>
          )}
          <button
            onClick={handleStar}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 transition-colors"
          >
            <Star
              size={14}
              className={d.isStarred ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-400'}
            />
            Star{' '}
            <span className="ml-1 bg-zinc-800 px-1.5 py-0.5 rounded text-[10px]">
              {d._count?.stars || 0}
            </span>
          </button>
          <button
            onClick={handleEmbed}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 transition-colors"
          >
            {embedCopied ? (
              <Check size={14} className="text-green-400" />
            ) : (
              <Code2 size={14} className="hidden" />
            )}
            {embedCopied ? 'Copied' : 'Embed'}
          </button>
          <button
            onClick={handleFork}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-md text-xs font-medium text-zinc-300 transition-colors"
          >
            <Share2 size={14} /> Clone
          </button>
        </div>
      </div>

      {d.description && <p className="text-zinc-300 text-sm mb-6">{d.description}</p>}

      {/* Files List */}
      <div className="flex flex-col gap-8">
        {d.files?.map((file: { name: string; content: string }, idx: number) => {
          const isMarkdown = file.name.toLowerCase().endsWith('.md');
          const linesCount = file.content.split('\n').length;
          const isCopied = copiedFile === idx;

          return (
            <div
              key={idx}
              className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden shadow-sm"
            >
              <div className="flex items-center justify-between bg-zinc-900 px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleCollapse(idx)}
                    className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  >
                    {collapsedFiles.has(idx) ? (
                      <ChevronRight size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </button>
                  <div
                    className="text-sm font-medium text-zinc-200 font-mono hover:text-zinc-100 cursor-pointer"
                    onClick={() => toggleCollapse(idx)}
                  >
                    {file.name}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono flex items-center gap-2 ml-2">
                    <span>{linesCount} lines</span>
                    <span className="text-zinc-700">•</span>
                    <span>{file.content.length} chars</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-md transition-colors text-zinc-300"
                    title="Download file"
                  >
                    <Download size={14} /> Download
                  </button>
                  <button
                    onClick={() => handleCopy(file.content, idx)}
                    className="flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 border border-zinc-800 bg-zinc-950 hover:bg-zinc-800 rounded-md transition-colors text-zinc-300"
                  >
                    {isCopied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    {isCopied ? 'Copied' : 'Copy raw'}
                  </button>
                </div>
              </div>
              {collapsedFiles.has(idx) ? (
                <div
                  className="bg-zinc-950 p-4 font-mono text-sm text-zinc-400 overflow-hidden relative"
                  style={{ maxHeight: '140px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-zinc-950 pointer-events-none" />
                  <pre className="opacity-60">
                    {file.content.split('\n').slice(0, 5).join('\n')}
                  </pre>
                </div>
              ) : (
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
                      theme="moonlight"
                      path={file.name}
                      beforeMount={handleEditorWillMount}
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
              )}
            </div>
          );
        })}
      </div>

      {/* Comments Section */}
      <div className="mt-16 pt-8 border-t border-zinc-800">
        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-100">
          <MessageSquare size={18} /> Discussion ({d.comments?.length || 0})
        </h3>

        <div className="flex flex-col gap-6 mb-10">
          {d.comments?.map(
            (c: {
              id: string;
              content: string;
              createdAt: string | Date;
              userId: string | null;
              guestName: string | null;
              user: { name: string | null; image: string | null } | null;
            }) => {
              const displayName = c.user?.name || c.guestName || 'Anonymous';
              return (
                <div
                  key={c.id}
                  className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden"
                >
                  <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center font-semibold text-zinc-300 text-xs border border-zinc-700 overflow-hidden">
                      {c.user?.image ? (
                        <Image
                          src={c.user.image}
                          alt={displayName}
                          width={28}
                          height={28}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-zinc-200 text-sm">
                        {displayName}{' '}
                        {!c.userId && (
                          <span className="text-xs font-normal text-zinc-500 ml-1">(Guest)</span>
                        )}
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
              );
            }
          )}
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

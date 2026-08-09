'use client';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { MessageSquare, Code2, Lock } from 'lucide-react';

export default function MySnippets() {
  const { data: session, status } = useSession();
  const [snippets, setSnippets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
      return;
    }
    if (status === 'authenticated') {
      fetch('/api/my-snippets')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setSnippets(data);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status]);

  if (loading || status === 'loading') {
    return <div className="min-h-[calc(100vh-64px)] flex justify-center items-center text-zinc-500">Loading your snippets...</div>;
  }

  return (
    <main className="max-w-5xl mx-auto mt-8 px-4 pb-16">
      <div className="flex items-center gap-5 mb-8 border-b border-zinc-800 pb-8">
        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 shadow-sm">
          {session?.user?.image ? (
            <Image src={session.user.image} alt={session.user?.name || 'User'} width={64} height={64} className="w-full h-full object-cover" />
          ) : (
            <span className="font-semibold text-zinc-200 text-2xl">
              {session?.user?.name?.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100 tracking-tight">{session?.user?.name}</h1>
          <p className="text-zinc-500">{session?.user?.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {snippets.length === 0 ? (
          <div className="text-center py-16 border border-zinc-800 rounded-lg bg-zinc-900/50">
            <p className="text-zinc-400 mb-4">You don&apos;t have any snippets yet.</p>
            <Link href="/" className="text-zinc-100 hover:text-white hover:underline font-medium transition-colors">
              Create one now
            </Link>
          </div>
        ) : (
          snippets.map((snippet) => (
            <div key={snippet.id} className="border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden transition-colors hover:border-zinc-700 shadow-sm group">
              <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-start bg-zinc-900">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Link href={`/${snippet.id}`} className="text-zinc-100 font-medium text-base hover:underline flex items-center gap-2">
                      <Code2 size={16} className="text-zinc-400 group-hover:text-zinc-300 transition-colors" />
                      <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">{snippet.user?.name || session?.user?.name} /</span> {snippet.filename || snippet.id}
                    </Link>
                    {snippet.isSecret && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border border-zinc-700 text-[11px] font-medium text-zinc-400 bg-zinc-800/50 uppercase tracking-wider ml-2">
                        <Lock size={10} /> Secret
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Created {new Date(snippet.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-zinc-500">
                  <div className="flex items-center gap-1.5" title="Comments">
                    <MessageSquare size={14} />
                    {snippet._count?.comments || 0}
                  </div>
                </div>
              </div>
              <div className="p-5 bg-zinc-950 text-sm text-zinc-300 font-mono whitespace-pre-wrap max-h-48 overflow-hidden relative">
                {snippet.preview}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

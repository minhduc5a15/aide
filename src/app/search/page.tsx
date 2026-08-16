import { prisma } from '@/lib/db';
import Link from 'next/link';
import { Code2, GitFork, Star, MessageSquare } from 'lucide-react';

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  
  if (!q) {
    return (
      <main className="w-full min-h-screen bg-zinc-950 px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-zinc-100 mb-4">Search Snippets</h1>
          <p className="text-zinc-400">Please enter a search query in the header.</p>
        </div>
      </main>
    );
  }

  const snippets = await prisma.snippet.findMany({
    where: { 
      isSecret: false, 
      OR: [
        { description: { contains: q, mode: 'insensitive' } },
        { files: { some: { name: { contains: q, mode: 'insensitive' } } } },
      ]
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { name: true } },
      _count: { select: { comments: true, stars: true, forks: true, files: true } },
      files: { select: { name: true, content: true }, take: 1 }
    }
  });

  return (
    <main className="w-full min-h-[calc(100vh-64px)] bg-zinc-950 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 border-b border-zinc-800 pb-6">
          <h1 className="text-2xl font-bold text-zinc-100">
            Search results for "{q}"
          </h1>
          <p className="text-sm text-zinc-400 mt-2">
            Found {snippets.length} snippets
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {snippets.length === 0 ? (
            <div className="text-center py-16 border border-zinc-800 border-dashed rounded-lg bg-zinc-900/30">
              <p className="text-zinc-400">No public snippets found matching "{q}".</p>
            </div>
          ) : (
            snippets.map((snippet) => (
              <div
                key={snippet.id}
                className="border border-zinc-800 rounded-xl bg-zinc-900/60 overflow-hidden hover:border-zinc-600 transition-colors shadow-sm group flex flex-col"
              >
                <div className="px-5 py-4 border-b border-zinc-800/80 bg-zinc-900">
                  <div className="flex justify-between items-start mb-2">
                    <Link
                      href={`/${snippet.user?.name || 'guest'}/${snippet.id}`}
                      className="text-indigo-400 font-semibold text-lg hover:underline truncate mr-2"
                    >
                      {snippet.user?.name || 'guest'} / {snippet.files[0]?.name || snippet.id}
                    </Link>
                  </div>

                  {snippet.description ? (
                    <p className="text-sm text-zinc-400 line-clamp-2 mb-3">
                      {snippet.description}
                    </p>
                  ) : (
                    <p className="text-sm text-zinc-600 italic line-clamp-2 mb-3">
                      No description provided.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-xs font-medium mt-auto">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Star size={14} /> {snippet._count.stars}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <GitFork size={14} /> {snippet._count.forks}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <MessageSquare size={14} /> {snippet._count.comments}
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <Code2 size={14} /> {snippet._count.files || 1}
                    </div>
                    <div className="text-zinc-500 ml-auto">
                      {new Date(snippet.updatedAt).toISOString().split('T')[0]}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950 text-xs text-zinc-300 font-mono whitespace-pre-wrap relative flex-1">
                  <div className="max-h-24 overflow-hidden">
                    {snippet.files[0]?.content
                      ? snippet.files[0].content.split('\n').slice(0, 5).join('\n')
                      : '// Empty file'}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}

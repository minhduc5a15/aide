import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';

export default async function SnippetLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string; id: string }>;
}) {
  const { username, id } = await params;

  const snippet = await prisma.snippet.findUnique({
    where: { id },
    include: {
      user: { select: { name: true } },
    },
  });

  if (snippet) {
    const correctUsername = snippet.user?.name || 'guest';
    if (username !== correctUsername) {
      redirect(`/${correctUsername}/${id}`);
    }
  }

  return <>{children}</>;
}

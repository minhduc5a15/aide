import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/db';

export default async function SnippetRedirect({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username: idOrUsername } = await params;

  const snippet = await prisma.snippet.findUnique({
    where: { id: idOrUsername },
    include: {
      user: { select: { name: true } },
    },
  });

  if (!snippet) {
    notFound();
  }

  const username = snippet.user?.name || 'guest';
  redirect(`/${username}/${idOrUsername}`);
}

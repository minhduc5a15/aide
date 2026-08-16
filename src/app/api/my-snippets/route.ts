import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snippets = await prisma.snippet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { comments: true, forks: true, stars: true, files: true },
        },
        files: {
          select: { name: true, content: true },
          take: 1,
        },
      },
    });

    const snippetsWithPreview = snippets.map((s) => ({
      ...s,
      filesCount: s._count.files,
      forksCount: s._count.forks,
      starsCount: s._count.stars,
    }));

    return NextResponse.json(snippetsWithPreview);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

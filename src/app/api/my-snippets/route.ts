import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GitService } from '@/lib/git';
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
          select: { comments: true },
        },
      },
    });

    const snippetsWithPreview = await Promise.all(
      snippets.map(async (s) => {
        let preview = '';
        let filename = '';
        let filesCount = 0;
        let forksCount = 0;
        try {
          const files = await GitService.getFiles(s.id);
          filesCount = files.length;
          if (files.length > 0) {
            filename = files[0].name;
            preview = files[0].content.substring(0, 500);
          }
          forksCount = await prisma.snippet.count({ where: { forkedFromId: s.id } });
        } catch {
          /* ignore */
        }
        return { ...s, filename, preview, filesCount, forksCount, starsCount: 0 };
      })
    );

    return NextResponse.json(snippetsWithPreview);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

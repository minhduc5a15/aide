import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GitService } from '@/lib/git';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snippets = await prisma.snippet.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { comments: true }
        }
      }
    });

    const snippetsWithPreview = await Promise.all(snippets.map(async (s) => {
      let preview = '';
      let filename = '';
      try {
        const files = await GitService.getFiles(s.id);
        if (files.length > 0) {
          filename = files[0].name;
          preview = files[0].content.substring(0, 500);
        }
      } catch (e) {}
      return { ...s, filename, preview };
    }));

    return NextResponse.json(snippetsWithPreview);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : null;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const existingStar = await prisma.star.findUnique({
      where: {
        userId_snippetId: {
          userId,
          snippetId: id,
        },
      },
    });

    if (existingStar) {
      await prisma.star.delete({
        where: { id: existingStar.id },
      });
      return NextResponse.json({ starred: false });
    } else {
      await prisma.star.create({
        data: {
          userId,
          snippetId: id,
        },
      });
      return NextResponse.json({ starred: true });
    }
  } catch (error) {
    console.error('Error toggling star:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

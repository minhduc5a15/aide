import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    const body = await req.json();
    const { content, guestName } = body;

    if (guestName && (typeof guestName !== 'string' || guestName.length > 50)) {
      return NextResponse.json(
        { error: 'Guest name must be less than 50 characters' },
        { status: 400 }
      );
    }

    if (!content || content.trim() === '') {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (content.length > 5000) {
      return NextResponse.json(
        { error: 'Comment is too long (max 5000 characters)' },
        { status: 400 }
      );
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        snippetId: id,
        userId: session?.user ? (session.user as { id: string }).id : null,
        guestName: session?.user ? null : guestName,
      },
    });

    return NextResponse.json(comment);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

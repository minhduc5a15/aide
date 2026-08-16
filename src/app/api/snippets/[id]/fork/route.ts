import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { customAlphabet } from 'nanoid';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const nanoid = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz', 10);

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const originalSnippet = await prisma.snippet.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!originalSnippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Secret snippets can be forked by anyone with the link

    const newId = nanoid();

    const forkedSnippet = await prisma.snippet.create({
      data: {
        id: newId,
        isSecret: originalSnippet.isSecret,
        description: originalSnippet.description ? `Fork of ${originalSnippet.description}` : '',
        userId: (session.user as { id: string }).id,
        forkedFromId: id,
        files: {
          create: originalSnippet.files.map(f => ({
            name: f.name,
            content: f.content,
          }))
        }
      },
    });

    return NextResponse.json(forkedSnippet);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

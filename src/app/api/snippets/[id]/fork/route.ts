import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import { GitService } from '@/lib/git';
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
    });

    if (!originalSnippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (originalSnippet.isSecret && originalSnippet.userId) {
      if (originalSnippet.userId !== (session.user as { id: string }).id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const newId = nanoid();

    const originalPath = GitService.getRepoPath(id);
    const newPath = GitService.getRepoPath(newId);

    // Create DB record first to reserve the ID and prevent orphaned Git repos if the process crashes
    const forkedSnippet = await prisma.snippet.create({
      data: {
        id: newId,
        isSecret: originalSnippet.isSecret,
        description: originalSnippet.description ? `Fork of ${originalSnippet.description}` : '',
        filename: originalSnippet.filename,
        preview: originalSnippet.preview,
        userId: (session.user as { id: string }).id,
        forkedFromId: id,
      },
    });

    try {
      await fs.cp(originalPath, newPath, { recursive: true });
      return NextResponse.json(forkedSnippet);
    } catch (fsError) {
      // Rollback: delete the DB record if file copy fails
      await prisma.snippet.delete({ where: { id: newId } });
      throw fsError;
    }
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

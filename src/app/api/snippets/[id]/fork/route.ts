import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import fs from 'fs/promises';
import { GitService } from '@/lib/git';
import { customAlphabet } from 'nanoid';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const execAsync = promisify(exec);
const nanoid = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz', 10);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const originalSnippet = await prisma.snippet.findUnique({
      where: { id: params.id }
    });

    if (!originalSnippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (originalSnippet.isSecret && originalSnippet.userId) {
      if (originalSnippet.userId !== (session.user as any).id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const newId = nanoid();
    
    const originalPath = GitService.getRepoPath(params.id);
    const newPath = GitService.getRepoPath(newId);
    
    await fs.cp(originalPath, newPath, { recursive: true });

    const forkedSnippet = await prisma.snippet.create({
      data: {
        id: newId,
        isSecret: originalSnippet.isSecret,
        description: originalSnippet.description ? `Fork of ${originalSnippet.description}` : '',
        userId: (session.user as any).id,
        forkedFromId: params.id,
      }
    });

    return NextResponse.json(forkedSnippet);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

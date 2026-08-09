import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GitService, GitFile } from '@/lib/git';
import { customAlphabet } from 'nanoid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { validateSnippetFiles } from '@/lib/validation';
import fs from 'fs/promises';

const nanoid = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz', 10);
const secretNanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 32);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as any).id : null;

    const body = await req.json();
    const { files, isSecret, description } = body;
    
    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json({ error: 'Description must be less than 1000 characters' }, { status: 400 });
    }

    const validationError = validateSnippetFiles(files);
    if (validationError) return validationError;

    const id = isSecret ? secretNanoid() : nanoid();
    
    await prisma.snippet.create({
      data: {
        id,
        isSecret: !!isSecret,
        description: description || '',
        userId,
      }
    });

    try {
      await GitService.initRepo(id);
      await GitService.commitFiles(id, files as GitFile[], 'Initial commit');
    } catch (gitError: any) {
      // Rollback database record
      await prisma.snippet.delete({ where: { id } });
      
      // Rollback physical folder on disk to prevent inode/disk exhaustion
      await fs.rm(GitService.getRepoPath(id), { recursive: true, force: true });
      
      console.error('Git operation failed, rollback executed:', gitError);
      return NextResponse.json({ error: 'Failed to process snippet files' }, { status: 500 });
    }

    return NextResponse.json({ id, isSecret });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const take = Math.min(parseInt(searchParams.get('take') || '20', 10), 100);
    const skip = parseInt(searchParams.get('skip') || '0', 10);

    const snippets = await prisma.snippet.findMany({
      where: { isSecret: false },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        user: { select: { name: true } },
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

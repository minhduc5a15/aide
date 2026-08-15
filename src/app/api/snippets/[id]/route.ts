import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GitService, GitFile } from '@/lib/git';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateSnippetFiles } from '@/lib/validation';
import fs from 'fs/promises';
import crypto from 'crypto';

const getGravatar = (email?: string) => {
  if (!email) return null;
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true, email: true } } },
        },
        _count: {
          select: { stars: true },
        },
        stars: {
          select: { userId: true },
        },
      },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (snippet.isSecret && snippet.userId) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as { id: string }).id !== snippet.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    let isStarred = false;
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      const userId = (session.user as { id: string }).id;
      isStarred = snippet.stars.some((star) => star.userId === userId);
    }

    const files = await GitService.getFiles(id);
    const history = await GitService.getHistory(id);

    return NextResponse.json({
      ...snippet,
      user: snippet.user
        ? { name: snippet.user.name, image: getGravatar(snippet.user.email) }
        : null,
      comments: snippet.comments.map((c) => ({
        ...c,
        user: c.user ? { name: c.user.name, image: getGravatar(c.user.email) } : null,
      })),
      files,
      history,
      _count: snippet._count,
      isStarred,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const author = {
      name: session.user.name || 'Unknown',
      email: session.user.email || 'unknown@aide.local',
    };

    const body = await req.json();
    const { files, message, description } = body;

    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json(
        { error: 'Description must be less than 1000 characters' },
        { status: 400 }
      );
    }

    const validationError = validateSnippetFiles(files);
    if (validationError) return validationError;

    const snippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (snippet.userId !== (session.user as { id: string }).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await GitService.commitFiles(id, files as GitFile[], message || 'Update snippet', author);

    const previewFile = Array.isArray(files) && files.length > 0 ? files[0] : null;
    const filename = previewFile?.name || null;
    const preview = previewFile?.content ? previewFile.content.substring(0, 500) : null;

    await prisma.snippet.update({
      where: { id },
      data: {
        updatedAt: new Date(),
        description: description ?? snippet.description,
        filename,
        preview,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snippet = await prisma.snippet.findUnique({
      where: { id },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (snippet.userId !== (session.user as { id: string }).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from DB (cascades comments and stars)
    await prisma.snippet.delete({
      where: { id },
    });

    // Delete Git repo
    try {
      const repoPath = GitService.getRepoPath(id);
      await fs.rm(repoPath, { recursive: true, force: true });
    } catch (fsError) {
      console.error('Failed to delete git repo:', fsError);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

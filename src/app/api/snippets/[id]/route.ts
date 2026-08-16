import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateSnippetFiles } from '@/lib/validation';
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
        stars: { select: { userId: true } },
        comments: {
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { name: true, email: true } } },
        },
        files: {
          select: { name: true, content: true },
        },
        _count: {
          select: { stars: true, comments: true },
        },
      },
    });

    let forkedFromUsername: string | null = null;
    if (snippet?.forkedFromId) {
      const original = await prisma.snippet.findUnique({
        where: { id: snippet.forkedFromId },
        select: { user: { select: { name: true } } }
      });
      forkedFromUsername = original?.user?.name || null;
    }

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Secret snippets are accessible to anyone with the link, no authorization required for GET.

    let isStarred = false;
    const session = await getServerSession(authOptions);
    if (session && session.user) {
      const userId = (session.user as { id: string }).id;
      isStarred = snippet.stars.some((star) => star.userId === userId);
    }

    return NextResponse.json({
      ...snippet,
      user: snippet.user
        ? { name: snippet.user.name, image: getGravatar(snippet.user.email) }
        : null,
      comments: snippet.comments.map((c) => ({
        ...c,
        user: c.user ? { name: c.user.name, image: getGravatar(c.user.email) } : null,
      })),
      files: snippet.files,
      _count: snippet._count,
      isStarred,
      forkedFromUsername,
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

    const body = await req.json();
    const { files, description } = body;

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

    // Delete existing files and create new ones
    await prisma.$transaction([
      prisma.file.deleteMany({ where: { snippetId: id } }),
      prisma.snippet.update({
        where: { id },
        data: {
          description,
          files: {
            create: files.map((f: { name: string; content: string }) => ({
              name: f.name,
              content: f.content,
            })),
          },
        },
      }),
    ]);

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
      select: { userId: true },
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Snippet not found' }, { status: 404 });
    }

    if (snippet.userId !== (session.user as { id: string }).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.snippet.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { GitService, GitFile } from '@/lib/git';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { validateSnippetFiles } from '@/lib/validation';
import crypto from 'crypto';

const getGravatar = (email?: string) => {
  if (!email) return null;
  const hash = crypto.createHash('md5').update(email.toLowerCase().trim()).digest('hex');
  return `https://www.gravatar.com/avatar/${hash}?d=identicon`;
};

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id },
      include: {
        user: { select: { name: true, email: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { name: true, email: true } } }
        }
      }
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (snippet.isSecret && snippet.userId) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as any).id !== snippet.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const files = await GitService.getFiles(params.id);
    const history = await GitService.getHistory(params.id);

    return NextResponse.json({
      ...snippet,
      user: snippet.user ? { name: snippet.user.name, image: getGravatar(snippet.user.email) } : null,
      comments: snippet.comments.map(c => ({
        ...c,
        user: c.user ? { name: c.user.name, image: getGravatar(c.user.email) } : null
      })),
      files,
      history,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { files, message } = body;
    
    const validationError = validateSnippetFiles(files);
    if (validationError) return validationError;
    
    const snippet = await prisma.snippet.findUnique({
      where: { id: params.id }
    });

    if (!snippet) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (snippet.userId !== (session.user as any).id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await GitService.commitFiles(params.id, files as GitFile[], message || 'Update snippet');
    
    await prisma.snippet.update({
      where: { id: params.id },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

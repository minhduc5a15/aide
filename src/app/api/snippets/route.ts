import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { customAlphabet } from 'nanoid';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { validateSnippetFiles } from '@/lib/validation';

const nanoid = customAlphabet('346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz', 10);
const secretNanoid = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  32
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : null;

    const body = await req.json();
    const { files, isSecret, description } = body;

    if (description && (typeof description !== 'string' || description.length > 1000)) {
      return NextResponse.json(
        { error: 'Description must be less than 1000 characters' },
        { status: 400 }
      );
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
        files: {
          create: files.map((f: { name: string; content: string }) => ({
            name: f.name,
            content: f.content,
          })),
        },
      },
    });

    return NextResponse.json({ id, isSecret });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let take = parseInt(searchParams.get('take') || '20', 10);
    let skip = parseInt(searchParams.get('skip') || '0', 10);
    
    if (isNaN(take)) take = 20;
    if (isNaN(skip)) skip = 0;
    
    take = Math.min(take, 100);

    const snippets = await prisma.snippet.findMany({
      where: { isSecret: false },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
      include: {
        user: { select: { name: true } },
        files: { select: { name: true, content: true } },
        _count: {
          select: { comments: true, stars: true, forks: true },
        },
      },
    });

    // Directly return snippets from the database with preview field
    return NextResponse.json(snippets);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

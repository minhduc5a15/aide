import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user ? (session.user as { id: string }).id : null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, bio, location, website } = await req.json();

    if (
      !name ||
      typeof name !== 'string' ||
      name.length < 3 ||
      name.length > 20 ||
      !/^[a-zA-Z0-9_]+$/.test(name)
    ) {
      return NextResponse.json(
        {
          error:
            'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        },
        { status: 400 }
      );
    }

    // Check if new name is taken by another user
    const nameExists = await prisma.user.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        NOT: { id: userId },
      },
    });

    if (nameExists) {
      return NextResponse.json({ error: 'Username already in use' }, { status: 400 });
    }

    if (bio && typeof bio === 'string' && bio.length > 500) {
      return NextResponse.json({ error: 'Bio must be less than 500 characters' }, { status: 400 });
    }
    if (location && typeof location === 'string' && location.length > 100) {
      return NextResponse.json(
        { error: 'Location must be less than 100 characters' },
        { status: 400 }
      );
    }
    if (website && typeof website === 'string' && website.length > 100) {
      return NextResponse.json(
        { error: 'Website must be less than 100 characters' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        bio: bio || null,
        location: location || null,
        website: website || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        bio: true,
        location: true,
        website: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

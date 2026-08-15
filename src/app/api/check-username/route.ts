import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');

  if (!username) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findFirst({
      where: {
        name: {
          equals: username,
          mode: 'insensitive',
        },
      },
    });

    return NextResponse.json({ available: !existingUser });
  } catch {
    return NextResponse.json({ available: false }, { status: 500 });
  }
}

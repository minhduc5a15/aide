import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

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

    if (
      !email ||
      typeof email !== 'string' ||
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    if (!password || typeof password !== 'string' || password.length < 8 || password.length > 100) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 100 characters' },
        { status: 400 }
      );
    }

    const emailExists = await prisma.user.findUnique({ where: { email } });
    if (emailExists) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const nameExists = await prisma.user.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } },
    });
    if (nameExists) {
      return NextResponse.json({ error: 'Username already in use' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

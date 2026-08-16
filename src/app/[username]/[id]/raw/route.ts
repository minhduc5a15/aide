import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; id: string }> }
) {
  try {
    const { id } = await params;

    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!snippet) {
      return new NextResponse('Not found', { status: 404 });
    }

    // Secret snippets are accessible via URL

    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('file');

    let fileContent = '';
    
    if (filename) {
      const file = snippet.files.find((f: { name: string; content: string }) => f.name === filename);
      if (file) {
        fileContent = file.content;
      } else {
        return new NextResponse('File not found', { status: 404 });
      }
    } else {
      // Default to first file if no filename provided
      if (snippet.files.length > 0) {
        fileContent = snippet.files[0].content;
      }
    }

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching raw snippet:', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

import { prisma } from '@/lib/db';
import { GitService } from '@/lib/git';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string; id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const fileName = url.searchParams.get('file');

    const snippet = await prisma.snippet.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!snippet) {
      return new Response('Snippet not found', { status: 404 });
    }

    if (snippet.isSecret && snippet.userId) {
      const session = await getServerSession(authOptions);
      if (!session || (session.user as { id: string }).id !== snippet.userId) {
        return new Response('Forbidden', { status: 403 });
      }
    }

    const files = await GitService.getFiles(id);
    if (!files || files.length === 0) {
      return new Response('No files found', { status: 404 });
    }

    let targetFile = files[0];
    if (fileName) {
      const found = files.find((f) => f.name === fileName);
      if (found) {
        targetFile = found;
      } else {
        return new Response('File not found', { status: 404 });
      }
    }

    return new Response(targetFile.content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: unknown) {
    console.error('Error fetching raw snippet:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

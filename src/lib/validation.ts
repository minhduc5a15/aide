import { NextResponse } from 'next/server';

export function validateSnippetFiles(files: any) {
  if (!files || !Array.isArray(files) || files.length === 0) {
    return NextResponse.json({ error: 'Files are required' }, { status: 400 });
  }

  if (files.length > 15) {
    return NextResponse.json({ error: 'Maximum 15 files allowed per snippet' }, { status: 400 });
  }

  for (const file of files) {
    if (!file.name || typeof file.name !== 'string' || file.name.length > 255) {
      return NextResponse.json({ error: 'Invalid file name' }, { status: 400 });
    }
    if (typeof file.content !== 'string' || file.content.length > 100000) {
      return NextResponse.json({ error: `File content for ${file.name} is too large (max 100,000 chars)` }, { status: 400 });
    }
  }

  return null;
}

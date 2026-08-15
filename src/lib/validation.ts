import { NextResponse } from 'next/server';

export function validateSnippetFiles(files: Record<string, unknown>) {
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
    // Prevent Git directory traversal or hijacking
    if (file.name.includes('.git')) {
      return NextResponse.json({ error: 'File names cannot contain .git' }, { status: 400 });
    }
    if (typeof file.content !== 'string' || file.content.length > 100000) {
      return NextResponse.json(
        { error: `File content for ${file.name} is too large (max 100,000 chars)` },
        { status: 400 }
      );
    }
  }

  // Prevent file path conflicts (EISDIR / ENOTDIR)
  for (let i = 0; i < files.length; i++) {
    for (let j = 0; j < files.length; j++) {
      if (i !== j && files[j].name.startsWith(files[i].name + '/')) {
        return NextResponse.json(
          { error: `Path conflict: ${files[i].name} cannot be both a file and a directory` },
          { status: 400 }
        );
      }
    }
  }

  return null;
}

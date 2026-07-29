import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

const ALLOWED_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.pdf', '.mp4', '.webm', '.jfif',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac',
];

const ALLOWED_MIME_TYPES = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml',
  'application/pdf', 'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/ogg', 'audio/vorbis',
  'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/m4a',
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds maximum limit of 25MB' }, { status: 400 });
    }

    const ext = path.extname(file.name).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext) || ext.includes('/') || ext.includes('\\')) {
      return NextResponse.json({ error: `File extension '${ext}' is forbidden for security` }, { status: 400 });
    }

    const fileType = file.type?.toLowerCase() || '';
    const isMimeAllowed = ALLOWED_MIME_TYPES.some((mime) => fileType === mime);
    
    if (!isMimeAllowed) {
      return NextResponse.json({ error: `MIME type '${file.type}' is not allowed for security` }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize category parameter to prevent path traversal
    const safeCategory = category.replace(/[^a-zA-Z0-9_-]/g, '');

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', safeCategory);
    
    // Prevent path traversal
    if (!uploadsDir.startsWith(path.join(process.cwd(), 'public', 'uploads'))) {
      return NextResponse.json({ error: 'Invalid destination directory' }, { status: 400 });
    }

    await mkdir(uploadsDir, { recursive: true });

    // Generate safe randomized filename to prevent overwrites & path traversal
    const randomPrefix = crypto.randomBytes(8).toString('hex');
    const safeBaseName = path.basename(file.name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeName = `${Date.now()}-${randomPrefix}-${safeBaseName}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${category}/${safeName}`;

    // Index file in MediaAsset table
    const mediaAsset = await db.mediaAsset.create({
      data: {
        filename: file.name,
        fileUrl,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        category,
        altText: file.name,
      },
    });

    // Record Audit Log Entry
    await db.auditLog.create({
      data: {
        action: 'UPLOAD_MEDIA',
        actor: session.email,
        details: `Uploaded ${file.name} (${category})`,
      },
    });

    revalidatePath('/', 'layout');
    revalidatePath('/admin/media');

    return NextResponse.json(mediaAsset, {
      status: 201,
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error('Media upload error:', error);
    return NextResponse.json({ error: error.message || 'File upload failed' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const assets = await db.mediaAsset.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(assets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });

    const asset = await db.mediaAsset.findUnique({ where: { id } });
    if (asset) {
      // Physical file unlinking attempt
      try {
        const fullPath = path.join(process.cwd(), 'public', asset.fileUrl);
        const fs = await import('fs/promises');
        await fs.unlink(fullPath).catch(() => null);
      } catch {
        // ignore unlink error
      }
      await db.mediaAsset.delete({ where: { id } });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

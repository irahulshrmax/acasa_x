import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

export const runtime = 'nodejs';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'upload', 'blogs');
const PUBLIC_URL_BASE = '/upload/blogs';
const THUMBNAIL_SIZE = 400;
const OPTIMIZATION_QUALITY = 80;

const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

const FILE_SIGNATURES: Record<string, number[][]> = {
    'image/jpeg': [[0xff, 0xd8, 0xff]],
    'image/png': [[0x89, 0x50, 0x4e, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46, 0x38]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]],
};

function matchesSignature(buffer: Buffer, mimeType: string): boolean {
    const signatures = FILE_SIGNATURES[mimeType];
    if (!signatures) return false;
    return signatures.some((signature) =>
        signature.every((byte, index) => buffer[index] === byte)
    );
}

function checkAdminAuth(request: NextRequest) {
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
        return { success: false, message: 'Unauthorized', status: 401 };
    }

    const payload = verifyToken(token);
    if (!payload) {
        return { success: false, message: 'Invalid token', status: 401 };
    }

    const usertype = payload.usertype?.toLowerCase() || '';
    const isAdmin = usertype === 'admin' || usertype === 'super_admin';
    if (!isAdmin) {
        return { success: false, message: 'Admin access required', status: 403 };
    }

    return { success: true };
}

async function optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    let sharpInstance = sharp(buffer);

    const metadata = await sharpInstance.metadata();
    if (metadata.width && metadata.width > 1200) {
        sharpInstance = sharpInstance.resize(1200, null, { withoutEnlargement: true });
    }

    if (mimeType === 'image/jpeg') {
        sharpInstance = sharpInstance.jpeg({ quality: OPTIMIZATION_QUALITY });
    } else if (mimeType === 'image/webp') {
        sharpInstance = sharpInstance.webp({ quality: OPTIMIZATION_QUALITY });
    } else if (mimeType === 'image/png') {
        sharpInstance = sharpInstance.png({ compressionLevel: 9 });
    }

    return await sharpInstance.toBuffer();
}

async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return await sharp(buffer)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 70 })
        .toBuffer();
}

async function saveFile(dir: string, filename: string, buffer: Buffer): Promise<string> {
    const filePath = path.join(dir, filename);
    await writeFile(filePath, buffer);
    return filePath;
}

async function ensureDirectory(dir: string): Promise<void> {
    if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
    }
}

export async function POST(request: NextRequest) {
    try {
        const auth = checkAdminAuth(request);
        if (!auth.success) {
            return NextResponse.json(
                { success: false, message: auth.message },
                { status: auth.status || 401 }
            );
        }

        const contentType = request.headers.get('content-type') || '';
        if (!contentType.includes('multipart/form-data')) {
            return NextResponse.json(
                { success: false, message: 'Invalid content type' },
                { status: 400 }
            );
        }

        let formData: FormData;
        try {
            formData = await request.formData();
        } catch {
            return NextResponse.json(
                { success: false, message: 'Failed to parse form data' },
                { status: 400 }
            );
        }

        const file = formData.get('image');
        if (!file || !(file instanceof File)) {
            return NextResponse.json(
                { success: false, message: 'No image file provided' },
                { status: 400 }
            );
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                { success: false, message: `Invalid file type: ${file.type}` },
                { status: 400 }
            );
        }

        if (file.size <= 0) {
            return NextResponse.json(
                { success: false, message: 'Empty file' },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { success: false, message: `File too large. Max ${MAX_SIZE_BYTES / (1024 * 1024)}MB` },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (!matchesSignature(buffer, file.type)) {
            return NextResponse.json(
                { success: false, message: 'File content does not match declared type' },
                { status: 400 }
            );
        }

        await ensureDirectory(UPLOAD_DIR);

        const extension = MIME_TO_EXT[file.type];
        const uniqueId = crypto.randomUUID();
        const fileName = `blog-${uniqueId}.${extension}`;
        const thumbnailName = `blog-${uniqueId}-thumb.jpg`;

        const optimizedBuffer = await optimizeImage(buffer, file.type);
        await saveFile(UPLOAD_DIR, fileName, optimizedBuffer);

        const thumbnailBuffer = await generateThumbnail(buffer);
        await saveFile(UPLOAD_DIR, thumbnailName, thumbnailBuffer);

        const publicUrl = `${PUBLIC_URL_BASE}/${fileName}`;
        const thumbnailUrl = `${PUBLIC_URL_BASE}/${thumbnailName}`;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.acasa.ae';

        return NextResponse.json({
            success: true,
            message: 'Image uploaded successfully',
            data: {
                filename: fileName,
                original_name: file.name,
                url: publicUrl,
                thumbnail: thumbnailUrl,
                full_url: `${siteUrl}${publicUrl}`,
                size: file.size,
                size_kb: Math.round(file.size / 1024),
                optimized_size: optimizedBuffer.length,
                optimized_size_kb: Math.round(optimizedBuffer.length / 1024),
                mime_type: file.type,
            },
        }, { status: 201 });

    } catch (error: any) {
        return NextResponse.json(
            { success: false, message: error?.message || 'Upload failed' },
            { status: 500 }
        );
    }
}
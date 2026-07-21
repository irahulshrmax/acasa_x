// app/api/v1/debug/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const runtime = 'nodejs';

// ─── CONSTANTS ──────────────────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

// ✅ REAL BLOG UPLOAD FOLDER - yahi pe save hoga
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'upload', 'blogs');
const PUBLIC_URL_BASE = '/upload/blogs';

console.log('🐛 [DEBUG] Upload directory (BLOG):', UPLOAD_DIR);
console.log('🐛 [DEBUG] Current working directory:', process.cwd());

// ─── GET ──────────────────────────────────────────────────────────────
export async function GET() {
    console.log('🐛 [DEBUG] GET request received');
    return NextResponse.json({
        success: true,
        message: 'Debug upload API is working! (Saving to blog folder)',
        upload_dir: UPLOAD_DIR,
        public_url: PUBLIC_URL_BASE,
        allowed_types: ALLOWED_TYPES,
        max_size_mb: MAX_SIZE_MB,
        cwd: process.cwd(),
    });
}

// ─── POST ──────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
    console.log('🐛 [DEBUG] POST request received');
    console.log('🐛 [DEBUG] Upload directory:', UPLOAD_DIR);

    try {
        // ✅ 1. Parse form data
        console.log('🐛 [DEBUG] Parsing form data...');
        const formData = await request.formData();
        const file = formData.get('image') as File | null;

        console.log('🐛 [DEBUG] File:', {
            name: file?.name,
            type: file?.type,
            size: file?.size,
        });

        if (!file) {
            console.log('🐛 [DEBUG] No file provided');
            return NextResponse.json(
                { success: false, message: 'No file provided' },
                { status: 400 }
            );
        }

        // ✅ 2. Validate
        if (!ALLOWED_TYPES.includes(file.type)) {
            console.log('🐛 [DEBUG] Invalid type:', file.type);
            return NextResponse.json(
                { success: false, message: `Invalid type: ${file.type}` },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE_BYTES) {
            console.log('🐛 [DEBUG] File too large:', file.size);
            return NextResponse.json(
                { success: false, message: `File too large. Max ${MAX_SIZE_MB}MB` },
                { status: 400 }
            );
        }

        // ✅ 3. Ensure directory exists (BLOG FOLDER)
        console.log('🐛 [DEBUG] Checking directory:', UPLOAD_DIR);
        try {
            if (!existsSync(UPLOAD_DIR)) {
                console.log('🐛 [DEBUG] Creating directory...');
                await mkdir(UPLOAD_DIR, { recursive: true });
                console.log('🐛 [DEBUG] Directory created');
            } else {
                console.log('🐛 [DEBUG] Directory already exists');
            }
        } catch (dirError: any) {
            console.error('🐛 [DEBUG] Directory error:', dirError);
            return NextResponse.json(
                { success: false, message: `Directory error: ${dirError.message}` },
                { status: 500 }
            );
        }

        // ✅ 4. Save file
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const cleanName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
        const fileName = `debug-${cleanName}-${timestamp}-${random}.${ext}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        console.log('🐛 [DEBUG] Saving to:', filePath);

        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        console.log('🐛 [DEBUG] File saved successfully');
        console.log('🐛 [DEBUG] File size:', buffer.length);

        // ✅ 5. Check if file exists
        const fileExists = existsSync(filePath);
        console.log('🐛 [DEBUG] File exists after save:', fileExists);

        const publicUrl = `${PUBLIC_URL_BASE}/${fileName}`;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.acasa.ae';

        return NextResponse.json({
            success: true,
            message: 'Upload successful! File saved in blog folder',
            data: {
                filename: fileName,
                url: publicUrl,
                full_url: `${siteUrl}${publicUrl}`,
                size: file.size,
                size_kb: Math.round(file.size / 1024),
                mime_type: file.type,
                upload_path: filePath,
            },
        }, { status: 201 });

    } catch (error: any) {
        console.error('🐛 [DEBUG] Fatal error:', error);
        console.error('🐛 [DEBUG] Stack:', error.stack);
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || 'Internal server error',
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            },
            { status: 500 }
        );
    }
}

// ─── OPTIONS - CORS ─────────────────────────────────────────────────────
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cookie, X-Requested-With',
        },
    });
}
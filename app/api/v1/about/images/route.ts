import { NextResponse } from 'next/server';

// ─── Dedicated Images Endpoint ──────────────────────────────

const ABOUT_IMAGES = [
    { id: 1, url: 'https://www.acasa.ae/upload/about/about.png',  label: 'About Main' },
    { id: 2, url: 'https://www.acasa.ae/upload/about/about2.png', label: 'About 2' },
    { id: 3, url: 'https://www.acasa.ae/upload/about/about3.png', label: 'About 3' },
    { id: 4, url: 'https://www.acasa.ae/upload/about/about4.png', label: 'About 4' },
] as const;

export async function GET() {
    return NextResponse.json({
        success: true,
        data: ABOUT_IMAGES,
        meta: {
            total: ABOUT_IMAGES.length,
            timestamp: new Date().toISOString(),
        },
    });
}
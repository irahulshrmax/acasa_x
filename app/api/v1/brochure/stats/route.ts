// /app/api/v1/brochure/stats/route.ts

import { NextResponse } from "next/server";
import { query } from '@/lib/database';

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const propertyId = url.searchParams.get("propertyId");

        if (!propertyId) {
            return NextResponse.json(
                { success: false, message: "Property ID is required" },
                { status: 400 }
            );
        }

        const [stats]: any = await query(
            `SELECT 
                COUNT(*) as total_downloads,
                COUNT(DISTINCT user_id) as unique_users,
                MAX(downloaded_at) as last_download
            FROM brochure_downloads 
            WHERE property_id = ?`,
            [Number(propertyId)]
        );

        return NextResponse.json({
            success: true,
            data: stats[0] || {
                total_downloads: 0,
                unique_users: 0,
                last_download: null
            }
        });

    } catch (error: any) {
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to get stats" 
            },
            { status: 500 }
        );
    }
}
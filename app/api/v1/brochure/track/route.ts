import { NextResponse } from "next/server";
import { query } from '@/lib/database';

// ============================================================
// TYPES
// ============================================================

interface TrackRequest {
    propertyId: number;
    email: string;
    name: string;
    phone?: string;
    userAgent?: string;
}

// ============================================================
// API ROUTE HANDLER
// ============================================================

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { propertyId, email, name, phone, userAgent } = body as TrackRequest;

        // Validate required fields
        if (!propertyId) {
            return NextResponse.json(
                { success: false, message: "Property ID is required" },
                { status: 400 }
            );
        }

        if (!email) {
            return NextResponse.json(
                { success: false, message: "Email is required" },
                { status: 400 }
            );
        }

        if (!name) {
            return NextResponse.json(
                { success: false, message: "Name is required" },
                { status: 400 }
            );
        }

        // 1. Check if property exists
        const [propertyCheck]: any = await query(
            "SELECT id FROM properties WHERE id = ? LIMIT 1",
            [propertyId]
        );

        if (!propertyCheck || propertyCheck.length === 0) {
            return NextResponse.json(
                { success: false, message: "Property not found" },
                { status: 404 }
            );
        }

        // 2. Insert or update user
        const [userCheck]: any = await query(
            "SELECT id FROM users WHERE email = ? LIMIT 1",
            [email.trim().toLowerCase()]
        );

        let userId: number;
        
        if (userCheck && userCheck.length > 0) {
            userId = userCheck[0].id;
            // Update user info
            await query(
                `UPDATE users SET 
                    name = ?, 
                    phone = COALESCE(?, phone),
                    updated_at = NOW() 
                 WHERE id = ?`,
                [name.trim(), phone || null, userId]
            );
        } else {
            // Create new user
            const [insertResult]: any = await query(
                `INSERT INTO users (name, email, phone, created_at, updated_at) 
                 VALUES (?, ?, ?, NOW(), NOW())`,
                [name.trim(), email.trim().toLowerCase(), phone || null]
            );
            userId = insertResult.insertId;
        }

        // 3. Track brochure download
        await query(
            `INSERT INTO brochure_downloads (
                property_id, 
                user_id, 
                email, 
                name, 
                phone, 
                user_agent,
                ip_address,
                downloaded_at,
                created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                propertyId,
                userId,
                email.trim().toLowerCase(),
                name.trim(),
                phone || null,
                userAgent || null,
                request.headers.get('x-forwarded-for') || 
                request.headers.get('x-real-ip') || 
                'unknown'
            ]
        );

        // 4. Update property download count
        await query(
            `UPDATE properties SET 
                total_downloads = COALESCE(total_downloads, 0) + 1,
                last_download_date = NOW()
             WHERE id = ?`,
            [propertyId]
        );

        // 5. Get updated stats
        const [stats]: any = await query(
            `SELECT 
                COUNT(*) as total_downloads,
                COUNT(DISTINCT user_id) as unique_users,
                MAX(downloaded_at) as last_download
            FROM brochure_downloads 
            WHERE property_id = ?`,
            [propertyId]
        );

        return NextResponse.json({
            success: true,
            message: "Download tracked successfully",
            data: {
                user_id: userId,
                property_id: propertyId,
                stats: stats[0] || {
                    total_downloads: 0,
                    unique_users: 0,
                    last_download: null
                }
            }
        });

    } catch (error: any) {
        console.error("Track error:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to track download" 
            },
            { status: 500 }
        );
    }
}

// ============================================================
// GET STATS
// ============================================================

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
        console.error("Stats error:", error);
        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to get stats" 
            },
            { status: 500 }
        );
    }
}
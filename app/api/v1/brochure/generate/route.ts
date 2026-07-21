import { NextResponse } from "next/server";
import { query } from '@/lib/database';

const IMAGE_BASE_URL = "https://acasa.ae/upload/media";
// ============================================================
// SVG ICON HELPERS
// ============================================================
const Icons = {
    Bed: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9.5C2 8.12 3.12 7 4.5 7h15C20.88 7 22 8.12 22 9.5v7c0 1.38-1.12 2.5-2.5 2.5h-15C3.12 19 2 17.88 2 16.5v-7z"/><line x1="2" y1="14" x2="22" y2="14"/></svg>`,
    Bath: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h16a1 1 0 0 1 1 1v3c0 .6-.4 1-1 1H3a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1z"/><path d="M6 12V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v7"/></svg>`,
    Area: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 3v18"/></svg>`,
    Type: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>`,
    Location: () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    Globe: () => `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    Email: () => `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    Phone: () => `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    Star: () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
    Home: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    Camera: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z"/><circle cx="12" cy="13" r="3"/><path d="m10 10-4 5h8l-2-3-2 3z"/></svg>`,
    Check: () => `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    Building: () => `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01M16 14h.01"/><path d="M8 10h.01M8 14h.01"/></svg>`,
};

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function buildImageUrl(path?: string | null): string {
    if (!path) return "";
    const trimmed = path.trim();
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
    }
    const cleanPath = trimmed
        .replace(/^\/+/, "")
        .replace(/^uploads\//, "")
        .replace(/^media\//, "")
        .replace(/^projects\//, "");
    return `${IMAGE_BASE_URL}/${cleanPath}`;
}

function parseList(value: any, isJson: boolean = true): string[] {
    if (!value) return [];
    try {
        if (typeof value === 'string') {
            if (isJson) {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            }
            return value.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        return Array.isArray(value) ? value : [];
    } catch {
        return typeof value === 'string' 
            ? value.split(',').map((s: string) => s.trim()).filter(Boolean)
            : [];
    }
}

function formatPrice(price: any): string {
    if (!price) return 'Price on Request';
    const num = Number(price);
    if (isNaN(num)) return 'Price on Request';
    return num.toLocaleString();
}

function generateReferenceId(id: number): string {
    return `PRJ-${String(id).padStart(6, '0')}`;
}

// ============================================================
// BROCHURE DATA FETCHER
// ============================================================

interface BrochureData {
    property: any;
    developer: {
        name: string;
        website: string;
        email: string;
        mobile: string;
        description: string;
        logo: string;
    };
    media: any[];
    amenities: string[];
    features: string[];
}

async function fetchBrochureData(propertyId: number): Promise<BrochureData> {
    // 1. Fetch property with developer info
    const propertyRows = await query(
        `SELECT 
            p.*,
            COALESCE(d.name, idev.name) AS developer_name,
            COALESCE(d.website, idev.website) AS developer_website,
            COALESCE(d.email, idev.email) AS developer_email,
            COALESCE(d.mobile, idev.mobile) AS developer_phone,
            COALESCE(d.informations, idev.informations) AS developer_description,
            COALESCE(d.image, idev.image) AS developer_logo
        FROM properties p
        LEFT JOIN developers d ON p.developer_id = d.id
        LEFT JOIN internationaldevelopers idev ON p.developer_id = idev.id
        WHERE p.id = ?
        LIMIT 1`,
        [propertyId]
    );

    if (!propertyRows || propertyRows.length === 0) {
        throw new Error("Property not found");
    }

    const property = propertyRows[0];

    // 2. Build developer object
    const developer = {
        name: property.developer_name || '',
        website: property.developer_website || '',
        email: property.developer_email || '',
        mobile: property.developer_phone || '',
        description: property.developer_description || '',
        logo: property.developer_logo || '',
    };

    // 3. Fetch media images
    let mediaItems: any[] = [];
    if (property.gallery_media_ids) {
        try {
            const ids = property.gallery_media_ids
                .split(",")
                .map((id: string) => parseInt(id.trim()))
                .filter((id: number) => !isNaN(id));

            if (ids.length > 0) {
                const mediaRows = await query(
                    `SELECT path FROM media 
                     WHERE id IN (?) AND path IS NOT NULL AND path != '' AND status = 1 
                     ORDER BY media_order ASC`,
                    [ids]
                );
                mediaItems = mediaRows.map((m: any) => ({
                    path: m.path,
                    url: buildImageUrl(m.path),
                }));
            }
        } catch (error) {
            console.error("Error fetching media:", error);
        }
    }

    // 4. Parse amenities and features
    const amenities = parseList(property.amenities, true);
    const features = parseList(property.property_features, false);

    return {
        property,
        developer,
        media: mediaItems,
        amenities,
        features,
    };
}

// ============================================================
// HTML GENERATOR
// ============================================================

function generateBrochureHTML(data: BrochureData): string {
    const { property, developer, media, amenities, features } = data;

    // Process images
    const images = media.map((m: any) => buildImageUrl(m.path || m.url)).filter(Boolean);
    const firstImage = images.length > 0 ? images[0] : '';
    const galleryImages = images.slice(1, 5);

    const price = formatPrice(property.price);
    const refId = generateReferenceId(property.id);

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${property.property_name} - Brochure</title>
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f5f5f5; color:#192334; line-height:1.6; padding:20px; }
        .brochure { max-width:900px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.1); }
        
        /* HEADER */
        .header { background:linear-gradient(135deg,#192334 0%,#1a2233 100%); color:#fff; padding:50px 40px 40px; position:relative; overflow:hidden; }
        .header::after { content:''; position:absolute; top:-100px; right:-100px; width:400px; height:400px; background:radial-gradient(circle,rgba(91,127,191,0.15) 0%,transparent 70%); border-radius:50%; }
        .header-content { position:relative; z-index:1; }
        .tag { display:inline-block; background:rgba(255,215,0,0.15); color:#FFD700; font-size:10px; font-weight:600; letter-spacing:2px; text-transform:uppercase; padding:6px 16px; border-radius:20px; margin-bottom:16px; }
        .property-name { font-family:'Playfair Display',Georgia,serif; font-size:38px; font-weight:700; line-height:1.2; margin-bottom:10px; }
        .property-location { font-size:14px; opacity:0.8; display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .property-location .sep { opacity:0.5; }
        .header-badges { display:flex; gap:10px; margin-top:16px; flex-wrap:wrap; }
        .badge { background:rgba(255,255,255,0.1); padding:5px 14px; border-radius:20px; font-size:11px; font-weight:500; letter-spacing:0.5px; border:1px solid rgba(255,255,255,0.08); display:inline-flex; align-items:center; gap:6px; }
        .badge svg { width:12px; height:12px; flex-shrink:0; }
        
        /* HERO IMAGE */
        .hero-image { width:100%; height:420px; background:#e8e4df; position:relative; overflow:hidden; }
        .hero-image img { width:100%; height:100%; object-fit:cover; }
        .hero-image .placeholder { display:flex; align-items:center; justify-content:center; height:100%; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#fff; font-size:18px; font-weight:500; gap:10px; }
        .hero-image .placeholder svg { width:32px; height:32px; }
        
        /* GALLERY STRIP */
        .gallery-strip { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; padding:4px; background:#f8f7f5; }
        .gallery-strip .thumb { height:100px; background:#e8e4df; overflow:hidden; position:relative; }
        .gallery-strip .thumb img { width:100%; height:100%; object-fit:cover; }
        .gallery-strip .thumb .placeholder { display:flex; align-items:center; justify-content:center; height:100%; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); color:#fff; font-size:12px; }
        .gallery-strip .thumb .placeholder svg { width:20px; height:20px; }
        
        /* CONTENT */
        .content { padding:40px; }
        
        /* PRICE BOX */
        .price-box { background:#f8f7f5; border-radius:12px; padding:24px 30px; display:flex; justify-content:space-between; align-items:center; margin-bottom:32px; border-left:4px solid #192334; }
        .price-box .label { font-size:11px; text-transform:uppercase; letter-spacing:1.5px; color:#666; font-weight:600; }
        .price-box .value { font-family:'Playfair Display',Georgia,serif; font-size:32px; font-weight:700; color:#192334; }
        
        /* STATS GRID */
        .stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:16px; margin-bottom:32px; }
        .stat-item { text-align:center; padding:16px; background:#f8f7f5; border-radius:8px; }
        .stat-item .icon svg { width:24px; height:24px; color:#192334; }
        .stat-item .stat-label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#888; font-weight:500; display:block; margin-top:6px; }
        .stat-item .stat-value { font-size:18px; font-weight:600; color:#192334; margin-top:4px; }
        
        /* SECTIONS */
        .section { margin-bottom:32px; }
        .section h2 { font-family:'Playfair Display',Georgia,serif; font-size:24px; font-weight:600; margin-bottom:16px; color:#192334; }
        .section p { font-size:14px; line-height:1.8; color:#444; }
        
        /* AMENITIES GRID */
        .amenities-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .amenity-item { display:flex; align-items:center; gap:8px; padding:8px 12px; background:#f8f7f5; border-radius:6px; font-size:13px; color:#333; }
        
        /* DEVELOPER SECTION */
        .developer-section { background:#f8f7f5; border-radius:12px; padding:24px 30px; margin-bottom:32px; }
        .developer-section h2 { font-family:'Playfair Display',Georgia,serif; font-size:20px; font-weight:600; margin-bottom:8px; color:#192334; }
        .developer-section .sub { font-size:13px; color:#666; margin-bottom:12px; }
        .developer-section .contact { display:flex; gap:20px; flex-wrap:wrap; font-size:13px; color:#444; }
        .developer-section .contact a { color:#5B7FBF; text-decoration:none; display:inline-flex; align-items:center; gap:6px; }
        .developer-section .contact a:hover { text-decoration:underline; }
        .developer-section .contact svg { width:14px; height:14px; flex-shrink:0; }
        
        /* FEATURES GRID */
        .features-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:8px; }
        .feature-item { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:13px; color:#444; border-bottom:1px solid #f0f0f0; }
        .feature-item .bullet { color:#5B7FBF; font-weight:700; font-size:18px; line-height:1; flex-shrink:0; }
        
        /* FOOTER */
        .footer { background:#192334; color:#fff; padding:30px 40px; text-align:center; }
        .footer .brand { font-family:'Playfair Display',Georgia,serif; font-size:24px; font-weight:700; letter-spacing:2px; margin-bottom:6px; }
        .footer .brand .star { color:#FFD700; }
        .footer .links { display:flex; justify-content:center; gap:24px; margin:12px 0; flex-wrap:wrap; }
        .footer .links a { color:rgba(255,255,255,0.7); text-decoration:none; font-size:12px; letter-spacing:0.5px; transition:color 0.2s; }
        .footer .links a:hover { color:#fff; }
        .footer .copy { font-size:11px; color:rgba(255,255,255,0.4); margin-top:8px; }
        
        @media (max-width:768px) {
            .stats-grid { grid-template-columns:repeat(2,1fr); }
            .amenities-grid { grid-template-columns:repeat(2,1fr); }
            .features-grid { grid-template-columns:1fr; }
            .gallery-strip { grid-template-columns:repeat(2,1fr); }
            .gallery-strip .thumb { height:80px; }
            .property-name { font-size:28px; }
            .price-box { flex-direction:column; text-align:center; gap:8px; }
            .content { padding:24px; }
            .header { padding:30px 24px; }
            .hero-image { height:280px; }
            .developer-section .contact { flex-direction:column; gap:8px; }
        }
        @media print {
            body { background:#fff; padding:0; }
            .brochure { box-shadow:none; border-radius:0; }
            .hero-image { height:350px; }
        }
    </style>
</head>
<body>
    <div class="brochure">
        <!-- HEADER -->
        <div class="header">
            <div class="header-content">
                <div class="tag">${Icons.Star()} Exclusive Property</div>
                <h1 class="property-name">${property.property_name}</h1>
                <div class="property-location">
                    ${Icons.Location()} ${property.location || 'Dubai, UAE'}
                    <span class="sep">|</span> ${property.listing_type || 'For Sale'}
                    <span class="sep">|</span> ${property.property_type || 'Residential'}
                </div>
                <div class="header-badges">
                    ${property.listing_type ? `<span class="badge">${Icons.Building()} ${property.listing_type}</span>` : ''}
                    ${property.property_type ? `<span class="badge">${Icons.Type()} ${property.property_type}</span>` : ''}
                    ${property.status === 1 ? `<span class="badge" style="background:rgba(16,185,129,0.2);border-color:rgba(16,185,129,0.2);">${Icons.Check()} Active</span>` : ''}
                    ${property.featured_property === '1' ? `<span class="badge" style="background:rgba(255,215,0,0.2);border-color:rgba(255,215,0,0.2);color:#FFD700;">${Icons.Star()} Featured</span>` : ''}
                </div>
            </div>
        </div>

        <!-- HERO IMAGE -->
        <div class="hero-image">
            ${firstImage ? `<img src="${firstImage}" alt="${property.property_name}" />` : 
            `<div class="placeholder">${Icons.Home()} ${property.property_name}</div>`}
        </div>

        <!-- GALLERY STRIP -->
        ${galleryImages.length > 0 ? `
        <div class="gallery-strip">
            ${galleryImages.map((img: string) => `<div class="thumb"><img src="${img}" alt="Gallery" /></div>`).join('')}
            ${galleryImages.length < 4 ? Array(4 - galleryImages.length).fill(0).map(() => 
                `<div class="thumb"><div class="placeholder">${Icons.Camera()} Gallery</div></div>`
            ).join('') : ''}
        </div>` : ''}

        <!-- CONTENT -->
        <div class="content">
            <!-- PRICE -->
            <div class="price-box">
                <div>
                    <div class="label">Property Price</div>
                    <div class="value">AED ${price}</div>
                </div>
                <div style="text-align:right;">
                    <div class="label">Reference</div>
                    <div style="font-size:14px;font-weight:500;color:#192334;">${refId}</div>
                </div>
            </div>

            <!-- STATS -->
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="icon">${Icons.Bed()}</div>
                    <span class="stat-label">Bedrooms</span>
                    <div class="stat-value">${property.bedroom || '—'}</div>
                </div>
                <div class="stat-item">
                    <div class="icon">${Icons.Bath()}</div>
                    <span class="stat-label">Bathrooms</span>
                    <div class="stat-value">${property.bathrooms || '—'}</div>
                </div>
                <div class="stat-item">
                    <div class="icon">${Icons.Area()}</div>
                    <span class="stat-label">Area</span>
                    <div class="stat-value">${property.area || '—'} ${property.area_size || 'sqft'}</div>
                </div>
                <div class="stat-item">
                    <div class="icon">${Icons.Type()}</div>
                    <span class="stat-label">Type</span>
                    <div class="stat-value">${property.property_type || 'Residential'}</div>
                </div>
            </div>

            <!-- DESCRIPTION -->
            ${property.description ? `
            <div class="section">
                <h2>About This Property</h2>
                <p>${property.description.replace(/<[^>]*>/g, '').substring(0, 600)}${property.description.length > 600 ? '...' : ''}</p>
            </div>` : ''}

            <!-- AMENITIES -->
            ${amenities.length > 0 ? `
            <div class="section">
                <h2>Amenities & Features</h2>
                <div class="amenities-grid">
                    ${amenities.slice(0, 15).map((a: string) => 
                        `<div class="amenity-item">${Icons.Check()} ${a}</div>`
                    ).join('')}
                </div>
            </div>` : ''}

            <!-- DEVELOPER -->
            ${developer.name ? `
            <div class="developer-section">
                <h2>${Icons.Building()} ${developer.name}</h2>
                <div class="sub">${developer.description ? developer.description.replace(/<[^>]*>/g, '').substring(0, 200) + (developer.description.length > 200 ? '...' : '') : 'Premium Developer'}</div>
                <div class="contact">
                    ${developer.website ? `<div>${Icons.Globe()} <a href="${developer.website}" target="_blank">${developer.website}</a></div>` : ''}
                    ${developer.email ? `<div>${Icons.Email()} <a href="mailto:${developer.email}">${developer.email}</a></div>` : ''}
                    ${developer.mobile ? `<div>${Icons.Phone()} ${developer.mobile}</div>` : ''}
                </div>
            </div>` : ''}

            <!-- FEATURES -->
            ${features.length > 0 ? `
            <div class="section">
                <h2>Property Features</h2>
                <div class="features-grid">
                    ${features.slice(0, 10).map((f: string) => 
                        `<div class="feature-item"><span class="bullet">•</span> ${f}</div>`
                    ).join('')}
                </div>
            </div>` : ''}
        </div>

        <!-- FOOTER -->
        <div class="footer">
            <div class="brand">ACASA <span class="star">${Icons.Star()}</span></div>
            <div class="links">
                <a href="https://acasa.ae">${Icons.Home()} Website</a>
                <a href="https://acasa.ae/properties/${property.property_slug}">View Online</a>
                <a href="https://acasa.ae/contact">${Icons.Phone()} Contact Us</a>
            </div>
            <div class="copy">
                Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} &bull; © ${new Date().getFullYear()} ACASA Real Estate
            </div>
        </div>
    </div>
</body>
</html>`;
}

// ============================================================
// API ROUTE HANDLER
// ============================================================

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { propertyId, format = 'html' } = body;

        // Validation
        if (!propertyId) {
            return NextResponse.json(
                { success: false, message: "Property ID is required" },
                { status: 400 }
            );
        }

        if (isNaN(Number(propertyId))) {
            return NextResponse.json(
                { success: false, message: "Invalid Property ID" },
                { status: 400 }
            );
        }

        // Fetch data
        const data = await fetchBrochureData(Number(propertyId));

        // Generate HTML
        const html = generateBrochureHTML(data);

        // Return response
        return NextResponse.json({
            success: true,
            data: {
                html,
                property_name: data.property.property_name,
                property_slug: data.property.property_slug,
                property_id: data.property.id,
                format,
                generated_at: new Date().toISOString(),
            }
        });

    } catch (error: any) {
        console.error("Brochure generation error:", error);

        // Handle specific errors
        if (error.message === "Property not found") {
            return NextResponse.json(
                { success: false, message: "Property not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { 
                success: false, 
                message: error.message || "Failed to generate brochure" 
            },
            { status: 500 }
        );
    }
}
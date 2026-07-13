// app/api/v1/documents/route.ts
import { NextResponse } from 'next/server';
import { query } from '@/lib/database';

const IMAGE_BASE_URL = 'https://acasa.ae/upload/media';

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function buildFileUrl(path?: string | null): string {
  if (!path) return '';
  const trimmed = path.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  const cleanPath = trimmed
    .replace(/^\/+/, '')
    .replace(/^media\//, '')
    .replace(/^uploads\//, '');
  return `${IMAGE_BASE_URL}/${cleanPath}`;
}

function getFileType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() || '';
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)) return 'image';
  if (['doc', 'docx'].includes(ext)) return 'word';
  if (['xls', 'xlsx'].includes(ext)) return 'excel';
  if (['ppt', 'pptx'].includes(ext)) return 'powerpoint';
  if (['txt', 'rtf'].includes(ext)) return 'text';
  return 'other';
}

function isImageFile(path: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(
    path.split('.').pop()?.toLowerCase() || ''
  );
}

function isDocumentFile(path: string): boolean {
  return ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'rtf'].includes(
    path.split('.').pop()?.toLowerCase() || ''
  );
}

// ════════════════════════════════════════════════════════════════
//  GET
// ════════════════════════════════════════════════════════════════

export async function GET(request: Request) {
  try {
    const url        = new URL(request.url);
    const moduleId   = url.searchParams.get('module_id');
    const moduleType = url.searchParams.get('module_type') || 'document';
    const limit      = Math.min(100, parseInt(url.searchParams.get('limit')  || '20'));
    const offset     =              parseInt(url.searchParams.get('offset') || '0');

    // ── Build query ───────────────────────────────────────────
    let sql = `
      SELECT
        m.id,
        m.module_id,
        m.module_type,
        m.module_sub_type,
        m.featured,
        m.path,
        m.title,
        m.sub_title,
        m.description,
        m.media_order,
        m.status,
        m.update_date,
        p.property_name,
        pl.ProjectName AS project_name
      FROM media m
      LEFT JOIN properties p
        ON m.module_id = p.id AND m.module_type = 'property'
      LEFT JOIN project_listing pl
        ON m.module_id = pl.id AND m.module_type = 'project'
      WHERE m.module_type = ?
    `;
    const params: any[] = [moduleType];

    if (moduleId) {
      sql += ' AND m.module_id = ?';
      params.push(parseInt(moduleId));
    }

    sql += ' ORDER BY m.media_order ASC, m.id DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    // ── Count query ───────────────────────────────────────────
    let countSql    = 'SELECT COUNT(*) as total FROM media WHERE module_type = ?';
    const countParams: any[] = [moduleType];
    if (moduleId) {
      countSql += ' AND module_id = ?';
      countParams.push(parseInt(moduleId));
    }

    const [rows, countResult] = await Promise.all([
      query<any[]>(sql, params),
      query<any[]>(countSql, countParams),
    ]);

    const total = countResult[0]?.total || 0;

    const processedData = rows.map((row: any) => ({
      id              : row.id,
      module_id       : row.module_id,
      module_type     : row.module_type,
      module_sub_type : row.module_sub_type,
      featured        : row.featured === 1,
      path            : row.path,
      file_url        : buildFileUrl(row.path),
      title           : row.title || 'Document',
      sub_title       : row.sub_title,
      description     : row.description,
      media_order     : row.media_order || 0,
      status          : row.status,
      property_name   : row.property_name,
      project_name    : row.project_name,
      created_at      : row.update_date,
      file_type       : row.path ? getFileType(row.path)    : 'unknown',
      is_pdf          : row.path ? row.path.toLowerCase().includes('.pdf') : false,
      is_image        : row.path ? isImageFile(row.path)    : false,
      is_document     : row.path ? isDocumentFile(row.path) : false,
    }));

    return NextResponse.json({
      success    : true,
      data       : processedData,
      pagination : {
        limit,
        offset,
        total,
        hasMore: offset + limit < total,
      },
      meta: {
        fileBaseUrl : IMAGE_BASE_URL,
        total       : processedData.length,
      },
    });

  } catch (error: any) {
    console.error('❌ Error fetching documents:', error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
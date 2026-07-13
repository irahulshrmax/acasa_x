// lib/auth/session.ts
import { query } from '@/lib/database';

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function generateSessionId(): string {
  return crypto.randomUUID();
}

// ════════════════════════════════════════════════════════════════
//  CREATE SESSION
// ════════════════════════════════════════════════════════════════

export async function createSession(
  userId      : number,
  token       : string,
  refreshToken: string,
  userAgent   : string,
  ipAddress   : string
): Promise<string> {
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await query(
    `INSERT INTO sessions
       (id, user_id, token, refresh_token, user_agent, ip_address, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sessionId, userId, token, refreshToken, userAgent, ipAddress, expiresAt]
  );

  return sessionId;
}

// ════════════════════════════════════════════════════════════════
//  VALIDATE SESSION
// ════════════════════════════════════════════════════════════════

export async function validateSession(token: string): Promise<number | null> {
  const rows = await query<any[]>(
    `SELECT user_id
     FROM sessions
     WHERE token = ? AND expires_at > NOW()
     LIMIT 1`,
    [token]
  );

  if (rows.length === 0) return null;
  return rows[0].user_id;
}

// ════════════════════════════════════════════════════════════════
//  REVOKE SESSION
// ════════════════════════════════════════════════════════════════

export async function revokeSession(token: string): Promise<void> {
  await query(
    `DELETE FROM sessions WHERE token = ?`,
    [token]
  );
}

// ════════════════════════════════════════════════════════════════
//  REVOKE ALL USER SESSIONS
// ════════════════════════════════════════════════════════════════

export async function revokeAllUserSessions(userId: number): Promise<void> {
  await query(
    `DELETE FROM sessions WHERE user_id = ?`,
    [userId]
  );
}
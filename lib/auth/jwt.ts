// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret-key';

export interface TokenPayload {
    id: number;
    email: string;
    usertype: string;
    name?: string;
    fullName?: string;
    iat?: number;
    exp?: number;
}

// ─── VERIFY TOKEN ──────────────────────────────────────────────────────
export function verifyToken(token: string): TokenPayload | null {
    try {
        if (!token) return null;
        
        const cleanToken = token.trim().replace(/^["']|["']$/g, '');
        const decoded = jwt.verify(cleanToken, JWT_SECRET, {
            algorithms: ['HS256'],
        }) as TokenPayload;

        if (!decoded.id || !decoded.email) {
            console.error('[JWT] Missing required fields');
            return null;
        }

        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            console.error('[JWT] Token expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.error('[JWT] Invalid token:', error.message);
        } else {
            console.error('[JWT] Verification error:', error.message);
        }
        return null;
    }
}

// ─── GENERATE TOKEN ────────────────────────────────────────────────────
export function generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
    const expiresIn = rememberMe ? '30d' : '7d';
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn,
        algorithm: 'HS256',
    });
}

// ─── GENERATE TOKEN PAIR (Access + Refresh) ──────────────────────────
export function generateTokenPair(payload: TokenPayload): { accessToken: string; refreshToken: string } {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
        expiresIn: '15m',
        algorithm: 'HS256',
    });
    
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
        expiresIn: '7d',
        algorithm: 'HS256',
    });
    
    return { accessToken, refreshToken };
}

// ─── VERIFY REFRESH TOKEN ─────────────────────────────────────────────
export function verifyRefreshToken(token: string): TokenPayload | null {
    try {
        if (!token) return null;
        
        const cleanToken = token.trim().replace(/^["']|["']$/g, '');
        const decoded = jwt.verify(cleanToken, REFRESH_SECRET, {
            algorithms: ['HS256'],
        }) as TokenPayload;
        
        if (!decoded.id || !decoded.email) {
            console.error('[JWT] Missing required fields in refresh token');
            return null;
        }
        
        return decoded;
    } catch (error: any) {
        if (error.name === 'TokenExpiredError') {
            console.error('[JWT] Refresh token expired');
        } else if (error.name === 'JsonWebTokenError') {
            console.error('[JWT] Invalid refresh token:', error.message);
        } else {
            console.error('[JWT] Refresh token verification error:', error.message);
        }
        return null;
    }
}

// ─── DECODE TOKEN (Without Verification) ──────────────────────────────
export function decodeToken(token: string): TokenPayload | null {
    try {
        return jwt.decode(token) as TokenPayload;
    } catch {
        return null;
    }
}

// ─── EXPORTS ────────────────────────────────────────────────────────────
export default {
    verifyToken,
    generateToken,
    generateTokenPair,
    verifyRefreshToken,
    decodeToken,
};
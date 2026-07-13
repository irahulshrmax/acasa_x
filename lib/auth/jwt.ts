import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-do-not-use-in-production';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  id: number;
  email: string;
  usertype: string;
  name: string;
  fullName: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? '30d' : '7d';
  // @ts-ignore
  return jwt.sign(payload, SECRET, { expiresIn });
}

export function generateAccessToken(payload: TokenPayload): string {
  // @ts-ignore
  return jwt.sign(payload, SECRET, { expiresIn: ACCESS_EXPIRY });
}

export function generateRefreshToken(userId: number): string {
  // @ts-ignore
  return jwt.sign({ id: userId, type: 'refresh' }, SECRET, { expiresIn: REFRESH_EXPIRY });
}

export function generateTokenPair(payload: TokenPayload): TokenPair {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload.id)
  };
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { id: number } | null {
  try {
    const decoded = jwt.verify(token, SECRET) as { id: number; type: string };
    if (decoded.type !== 'refresh') return null;
    return { id: decoded.id };
  } catch {
    return null;
  }
}

export function decodeToken(token: string): TokenPayload | null {
  try {
    return jwt.decode(token) as TokenPayload;
  } catch {
    return null;
  }
}
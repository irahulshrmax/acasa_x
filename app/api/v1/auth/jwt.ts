// lib/auth/jwt.ts
import jwt, { JwtPayload } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  usertype: string;
  name: string;
  fullName: string;
  isAdmin: boolean;
}

export function generateToken(payload: TokenPayload, rememberMe: boolean = false): string {
  const expiresIn = rememberMe ? '30d' : '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
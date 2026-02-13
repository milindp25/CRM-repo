import jwt from 'jsonwebtoken';
import { AuthenticationError } from './errors';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = '7d';
const REFRESH_TOKEN_EXPIRES_IN = '30d';

export interface JWTPayload {
  userId: string;
  email: string;
  companyId: string;
  role: string;
  permissions: string[];
}

export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: 'refresh' }, JWT_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN
  });
}

export function verifyAccessToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

export function verifyRefreshToken(token: string): { userId: string } {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as any;
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }
    return { userId: payload.userId };
  } catch (error) {
    throw new AuthenticationError('Invalid or expired refresh token');
  }
}

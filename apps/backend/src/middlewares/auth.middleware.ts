import { Request, Response, NextFunction } from 'express';
import { verifyJwt } from '../utils/jwt';
import { fetchUserData } from '../repositories/user.repository';
import { UserStatus } from '../entities/user';

export const authMiddleware = async (request: any, response: any, next: any) => {
    // Read Authorization from multiple sources and case variants
    const headerToken: string | undefined =
        (typeof request?.get === 'function' ? (request.get('Authorization') || request.get('authorization')) : undefined) ||
        (request?.headers?.authorization as any) ||
        (request?.headers as any)?.Authorization;

    const altHeaderToken: string | undefined = (request?.headers?.['x-access-token'] as any) || undefined;
    const cookieToken: string | undefined = request?.cookies?.token || request?.cookies?.authorization;
    const queryToken: string | undefined = request?.query?.access_token || request?.query?.token;

    const token = normalizeToken(headerToken) ||
                  normalizeToken(altHeaderToken) ||
                  normalizeToken(cookieToken) ||
                  normalizeToken(queryToken);

    if (!token) {
        return response.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const payload: any = verifyJwt(token);
        if (!payload) {
            return response.status(403).json({ message: 'Forbidden' });
        }
        request.userId = payload.sub;
        // Load user from DB
        try {
            const user = await fetchUserData(payload.sub);
            if (user) {
                request.user = user;
                if (user.status !== UserStatus.Active) {
                    return response.status(403).json({ message: 'User is not active' });
                }
            }
        } catch (_) {
            // ignore loading errors
        }
        next();
    } catch (error) {
        response.status(403).json({ message: 'Forbidden' });
    }
};

function normalizeToken(input?: string | string[]): string | null {
  if (!input) return null;
  const raw = Array.isArray(input) ? input[0] : input;
  let header = String(raw).trim();
  // Remove possible enclosing quotes added by some clients
  if (header.startsWith('"') && header.endsWith('"')) header = header.slice(1, -1);
  if (header.toLowerCase().startsWith('bearer ')) header = header.slice(7).trim();
  // Handle accidental double 'Bearer'
  if (header.toLowerCase().startsWith('bearer ')) header = header.slice(7).trim();
  // Remove leftover quotes again
  if (header.startsWith('"') && header.endsWith('"')) header = header.slice(1, -1);
  return header || null;
}

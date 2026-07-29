import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../constants/enums.js';
import { sendError } from '../utils/responseHandler.js';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    organizationId?: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 401, 'Unauthorized: Missing or malformed token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as {
      userId: string;
      role: UserRole;
      organizationId?: string;
    };

    req.user = decoded;
    next();
  } catch (err) {
    return sendError(res, 403, 'Forbidden: Invalid or expired access token');
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return sendError(res, 403, `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]`);
    }
    next();
  };
};
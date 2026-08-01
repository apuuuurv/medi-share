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

  console.log('--- AUTHENTICATE JWT DEBUG ---');
  console.log('Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ Auth header missing or invalid format');
    return sendError(res, 401, 'Unauthorized: Missing or malformed token');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'secret') as {
      userId: string;
      role: UserRole;
      organizationId?: string;
    };

    console.log('✅ Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (err: any) {
    console.log('❌ Token verification failed:', err.message);
    return sendError(res, 401, 'Unauthorized: Invalid or expired access token');
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log('--- AUTHORIZE ROLES DEBUG ---');
    console.log('User Role from Token:', req.user?.role);
    console.log('Allowed Roles for Route:', allowedRoles);

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      console.log('❌ Role authorization failed!');
      return sendError(res, 403, `Forbidden: Access restricted to roles [${allowedRoles.join(', ')}]`);
    }
    console.log('✅ Role authorized successfully');
    next();
  };
};
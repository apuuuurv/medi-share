// authController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.js';
import { UserRole } from '../constants/enums.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role, address, organizationId } = req.body;

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      return sendError(res, 400, 'User already exists with this email address.');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await UserModel.create({
      email,
      passwordHash,
      firstName,
      lastName,
      phone,
      role: role || UserRole.DONOR,
      address,
      organizationId: organizationId || null,
    });

    return sendSuccess(res, 201, 'User registered successfully', {
      userId: newUser._id,
      role: newUser.role,
    });
  } catch (error) {
    return sendError(res, 500, 'Internal Server Error', error);
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await UserModel.findOne({ email });
    if (!user) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid credentials');
    }

    const tokenPayload = {
      userId: user._id,
      role: user.role,
      organizationId: user.organizationId,
    };

    const signOptions: jwt.SignOptions = {
      expiresIn: (process.env.JWT_ACCESS_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'],
    };
    const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET || 'secret', signOptions);

    return sendSuccess(res, 200, 'Login successful', {
      accessToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });
  } catch (error) {
    return sendError(res, 500, 'Internal Server Error', error);
  }
};

export const getCurrentUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) return sendError(res, 401, 'Unauthorized');
    const user = await UserModel.findById(userId).select('-passwordHash');
    if (!user) return sendError(res, 404, 'User not found');
    return sendSuccess(res, 200, 'Current user retrieved successfully', user);
  } catch (error) {
    return sendError(res, 500, 'In  ternal Server Error', error);
  }
};
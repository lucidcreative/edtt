import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import jwt from "jsonwebtoken";

interface AuthenticatedRequest extends Request {
  user: any;
}

// SECURITY: Proper JWT secret management for classroom data protection
const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-bizcoin-2024-secure' : 
   (() => { throw new Error('JWT_SECRET environment variable is required for security'); })());

// Authentication middleware
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};
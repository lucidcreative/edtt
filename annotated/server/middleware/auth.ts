// Authentication middleware for Express routes - handles JWT token verification and user loading
import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include authenticated user data
interface AuthenticatedRequest extends Request {
  user: any;
}

// SECURITY: Proper JWT secret management for classroom data protection
// Use environment variable in production, fallback for development, throw error if missing in production
const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-bizcoin-2024-secure' : 
   (() => { throw new Error('JWT_SECRET environment variable is required for security'); })());

// Authentication middleware function - verifies JWT tokens and loads user data
export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Extract Bearer token from Authorization header
    const token = req.headers.authorization?.replace('Bearer ', '');
    // Return 401 if no token provided
    if (!token) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Verify JWT token with secret and extract payload
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Load user from storage using decoded user ID
    const user = await storage.getUser(decoded.userId);
    // Return 401 if user not found (token refers to deleted user)
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Attach user object to request for downstream middleware/routes
    req.user = user;
    // Continue to next middleware/route handler
    next();
  } catch (error) {
    // Return 401 for any JWT verification errors (expired, invalid, etc.)
    return res.status(401).json({ message: "Invalid token" });
  }
};
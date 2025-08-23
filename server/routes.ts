import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertClassroomSchema, insertAssignmentSchema, insertSubmissionSchema, insertStoreItemSchema, users, insertAssignmentAdvancedSchema, insertAssignmentSubmissionSchema, insertAssignmentFeedbackSchema, insertAssignmentTemplateSchema, insertMarketplaceSellerSchema, insertMarketplaceListingSchema, insertMarketplaceTransactionSchema, insertMarketplaceReviewSchema, insertMarketplaceWishlistSchema, insertMarketplaceMessageSchema, type User } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user: User;
}

// SECURITY: Proper JWT secret management for classroom data protection
const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-bizcoin-2024-secure' : 
   (() => { throw new Error('JWT_SECRET environment variable is required for security'); })());
const JWT_EXPIRES_IN = "8h";

// Authentication middleware
const authenticate = async (req: AuthenticatedRequest, res: Response, next: any) => {
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

// Generate classroom code
function generateClassroomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Demo data seeding function
async function ensureDemoData() {
  try {
    // Check if demo teacher exists
    let demoTeacher = await storage.getUserByEmail('demo@teacher.com');
    if (!demoTeacher) {
      const hashedPassword = await bcrypt.hash('demo123', 12);
      demoTeacher = await storage.createUser({
        email: 'demo@teacher.com',
        passwordHash: hashedPassword,
        role: 'teacher' as const,
        firstName: 'Demo',
        lastName: 'Teacher',
        emailVerified: true,
        accountApproved: true
      });
    }

    // Check if demo classroom exists
    let demoClassroom = await storage.getClassroomByCode('DEMO01');
    if (!demoClassroom) {
      demoClassroom = await storage.createClassroom({
        name: 'Demo Classroom',
        description: 'A classroom for testing BizCoin features',
        code: 'DEMO01',
        joinCode: 'DEMO01',
        teacherId: demoTeacher.id
      });
    }

    // Check if demo student exists
    let demoStudent = await storage.getUserByNickname('DemoStudent', demoClassroom.id);
    if (!demoStudent) {
      const hashedPin = await bcrypt.hash('1234', 12);
      demoStudent = await storage.createUser({
        nickname: 'DemoStudent',
        pinHash: hashedPin,
        role: 'student' as const,
        tokens: 150,
        level: 2,
        totalEarnings: 200,
        isActive: true
      });
      await storage.joinClassroom(demoStudent.id, demoClassroom.id);
    }
    
    console.log('Demo data ensured');
  } catch (error) {
    console.error('Error ensuring demo data:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure demo data on startup
  // await ensureDemoData(); // Temporarily disabled until schema migration is complete
  
  // Authentication routes
  app.post('/api/auth/register/teacher', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create teacher
      const user = await storage.createUser({
        email,
        passwordHash,
        role: 'teacher',
        firstName,
        lastName,
        emailVerified: true,
        accountApproved: true
      });

      res.status(201).json({ message: "Teacher registered successfully", userId: user.id });
    } catch (error) {
      console.error("Teacher registration error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/login/teacher', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find teacher
      const user = await storage.getUserByEmail(email);
      if (!user || user.role !== 'teacher' || !user.passwordHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Update last login
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          profileImageUrl: user.profileImageUrl
        }
      });
    } catch (error) {
      console.error("Teacher login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/login/student', async (req, res) => {
    try {
      const { nickname, pin, classroomCode } = req.body;

      if (!nickname || !pin || !classroomCode) {
        return res.status(400).json({ message: "Nickname, PIN, and classroom code are required" });
      }

      // Find classroom
      const classroom = await storage.getClassroomByCode(classroomCode);
      if (!classroom) {
        return res.status(401).json({ message: "Invalid classroom code" });
      }

      // Find student in this classroom
      const user = await storage.getUserByNickname(nickname, classroom.id);
      if (!user || user.role !== 'student' || !user.pinHash) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(pin, user.pinHash);
      if (!isValidPin) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Update last login
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

      res.json({
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          role: user.role,
          tokens: user.tokens,
          level: user.level,
          profileImageUrl: user.profileImageUrl
        },
        classroom: {
          id: classroom.id,
          name: classroom.name,
          code: classroom.code
        }
      });
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/auth/join-classroom', async (req, res) => {
    try {
      const { nickname, pin, classroomCode } = req.body;

      if (!nickname || !pin || !classroomCode) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Find classroom
      const classroom = await storage.getClassroomByCode(classroomCode);
      if (!classroom) {
        return res.status(400).json({ message: "Invalid classroom code" });
      }

      // Check if nickname is already taken in this classroom
      const existingStudent = await storage.getUserByNickname(nickname, classroom.id);
      if (existingStudent) {
        return res.status(400).json({ message: "Nickname already taken in this classroom" });
      }

      // Hash PIN
      const pinHash = await bcrypt.hash(pin, 12);

      // Create student
      const user = await storage.createUser({
        nickname,
        pinHash,
        role: 'student',
        isActive: true
      });

      // Join classroom
      await storage.joinClassroom(user.id, classroom.id);

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      res.status(201).json({
        token,
        user: {
          id: user.id,
          nickname: user.nickname,
          role: user.role,
          tokens: user.tokens,
          level: user.level
        },
        classroom: {
          id: classroom.id,
          name: classroom.name,
          code: classroom.code
        }
      });
    } catch (error) {
      console.error("Student join error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/auth/me', authenticate, async (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        nickname: req.user.nickname,
        firstName: req.user.firstName,
        lastName: req.user.lastName,
        role: req.user.role,
        tokens: req.user.tokens,
        level: req.user.level,
        profileImageUrl: req.user.profileImageUrl
      }
    });
  });

  // Classroom routes
  app.post('/api/classrooms', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create classrooms" });
      }

      const { name, description } = req.body;
      if (!name) {
        return res.status(400).json({ message: "Classroom name is required" });
      }

      let code;
      let attempts = 0;
      do {
        code = generateClassroomCode();
        const existing = await storage.getClassroomByCode(code);
        if (!existing) break;
        attempts++;
      } while (attempts < 10);

      if (attempts >= 10) {
        return res.status(500).json({ message: "Unable to generate unique classroom code" });
      }

      const classroom = await storage.createClassroom({
        name,
        description,
        code,
        joinCode: code,
        teacherId: req.user.id
      });

      res.status(201).json(classroom);
    } catch (error) {
      console.error("Create classroom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/classrooms', authenticate, async (req: any, res) => {
    try {
      if (req.user.role === 'teacher') {
        const classrooms = await storage.getClassroomsByTeacher(req.user.id);
        res.json(classrooms);
      } else if (req.user.role === 'student') {
        const classrooms = await storage.getStudentClassrooms(req.user.id);
        res.json(classrooms);
      } else {
        res.status(403).json({ message: "Access denied" });
      }
    } catch (error) {
      console.error("Get classrooms error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/classrooms/:id', authenticate, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroom(req.params.id);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      // Check access
      if (req.user.role === 'teacher' && classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(classroom);
    } catch (error) {
      console.error("Get classroom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/classrooms/:id/students', authenticate, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroom(req.params.id);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      // Check access
      if (req.user.role === 'teacher' && classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const students = await storage.getClassroomStudents(req.params.id);
      
      // SECURITY: FERPA Compliance - Student data must be private, never public cache
      res.set('Cache-Control', 'private, max-age=120'); // 2 minutes private cache only
      
      // SECURITY: Data minimization - Only return essential student info
      const minimalStudents = students.map(student => ({
        id: student.id,
        nickname: student.nickname || `${student.firstName} ${student.lastName}`.trim(),
        firstName: student.firstName,
        lastName: student.lastName,
        tokens: student.tokens,
        level: student.level,
        joinedAt: student.joinedAt,
        profileImageUrl: student.profileImageUrl
      }));
      
      res.json(minimalStudents);
    } catch (error) {
      console.error("Get classroom students error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/classrooms/:id/stats', authenticate, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroom(req.params.id);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      // Check access
      if (req.user.role === 'teacher' && classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      const stats = await storage.getClassroomStats(req.params.id);
      
      // SECURITY: FERPA Compliance - Classroom stats contain student data, must be private
      res.set('Cache-Control', 'private, max-age=60'); // 1 minute private cache
      res.json(stats);
    } catch (error) {
      console.error("Get classroom stats error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/classrooms/:id/leaderboard', authenticate, async (req: any, res) => {
    try {
      const classroom = await storage.getClassroom(req.params.id);
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const leaderboard = await storage.getLeaderboard(req.params.id, limit);
      
      // SECURITY: FERPA Compliance - Leaderboard contains student performance data
      res.set('Cache-Control', 'private, max-age=30'); // 30 seconds private cache
      
      // SECURITY: Data minimization - Only show essential leaderboard info
      const minimalLeaderboard = leaderboard.map(student => ({
        id: student.id,
        nickname: student.nickname || `${student.firstName} ${student.lastName}`.trim(),
        tokens: student.tokens,
        level: student.level,
        profileImageUrl: student.profileImageUrl
      }));
      
      res.json(minimalLeaderboard);
    } catch (error) {
      console.error("Get leaderboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Assignment routes
  app.get('/api/classrooms/:id/assignments', authenticate, async (req: any, res) => {
    try {
      const assignments = await storage.getAssignmentsByClassroom(req.params.id);
      res.json(assignments);
    } catch (error) {
      console.error("Get assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/assignments', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create assignments" });
      }

      const assignment = await storage.createAssignment({
        ...req.body,
        teacherId: req.user.id
      });

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Create assignment error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Time tracking routes
  app.get('/api/classrooms/:id/time-settings', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      // Check access
      if (req.user.role === 'teacher' && classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const settings = await storage.getTimeTrackingSettings(classroomId);
      res.json(settings);
    } catch (error) {
      console.error("Get time settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/classrooms/:id/time-settings', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      // Only teachers can update settings
      if (req.user.role !== 'teacher' || classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Only classroom teachers can update time tracking settings" });
      }
      
      const settings = await storage.updateTimeTrackingSettings(classroomId, req.body);
      res.json(settings);
    } catch (error) {
      console.error("Update time settings error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/classrooms/:id/clock-in', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      // Only students can clock in
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can clock in" });
      }
      
      // Check if time tracking is enabled
      const settings = await storage.getTimeTrackingSettings(classroomId);
      if (!settings?.timeTrackingEnabled) {
        return res.status(400).json({ message: "Time tracking is not enabled for this classroom" });
      }
      
      // Check if student already has an active session
      const activeEntry = await storage.getActiveTimeEntry(req.user.id, classroomId);
      if (activeEntry) {
        return res.status(400).json({ message: "You already have an active time session" });
      }
      
      // Check daily hour limit
      const todayHours = await storage.getTodayTimeHours(req.user.id, classroomId);
      const maxHours = parseFloat(settings.maxDailyHours || '8');
      if (todayHours >= maxHours) {
        return res.status(400).json({ message: `You've reached your daily limit of ${maxHours} hours` });
      }
      
      // Create time entry
      const timeEntry = await storage.createTimeEntry({
        studentId: req.user.id,
        classroomId,
        clockInTime: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress
      });
      
      res.json(timeEntry);
    } catch (error) {
      console.error("Clock in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/classrooms/:id/clock-out', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      // Only students can clock out
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can clock out" });
      }
      
      // Get active time entry
      const activeEntry = await storage.getActiveTimeEntry(req.user.id, classroomId);
      if (!activeEntry) {
        return res.status(400).json({ message: "No active time session found" });
      }
      
      const settings = await storage.getTimeTrackingSettings(classroomId);
      const clockOutTime = new Date();
      const totalMinutes = Math.floor((clockOutTime.getTime() - new Date(activeEntry.clockInTime).getTime()) / (1000 * 60));
      
      // Check minimum duration
      const minDuration = settings?.minClockInDuration || 15;
      if (totalMinutes < minDuration) {
        return res.status(400).json({ message: `Minimum session duration is ${minDuration} minutes` });
      }
      
      // Calculate tokens
      const tokensPerHour = settings?.tokensPerHour || 5;
      const tokensEarned = Math.floor((totalMinutes / 60) * tokensPerHour);
      
      // Update time entry
      const updatedEntry = await storage.updateTimeEntry(activeEntry.id, {
        clockOutTime,
        totalMinutes,
        tokensEarned,
        status: 'completed'
      });
      
      // Add tokens to student
      const updatedUser = await storage.updateUserTokens(req.user.id, req.user.tokens + tokensEarned);
      
      res.json({ ...updatedEntry, tokensEarned });
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/time-entries/active/:classroomId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.classroomId;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can view active time entries" });
      }
      
      const entry = await storage.getActiveTimeEntry(req.user.id, classroomId);
      res.json(entry);
    } catch (error) {
      console.error("Get active entry error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/time-entries/today/:classroomId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.classroomId;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: "Only students can view today's hours" });
      }
      
      const hours = await storage.getTodayTimeHours(req.user.id, classroomId);
      res.json(hours);
    } catch (error) {
      console.error("Get today hours error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/time-entries/:classroomId', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.classroomId;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      // Check access
      if (req.user.role === 'teacher' && classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const studentId = req.user.role === 'student' ? req.user.id : undefined;
      const entries = await storage.getTimeEntries(classroomId, studentId);
      res.json(entries);
    } catch (error) {
      console.error("Get time entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Store routes
  app.get('/api/classrooms/:id/store', authenticate, async (req: any, res) => {
    try {
      const items = await storage.getStoreItemsByClassroom(req.params.id);
      
      // PERFORMANCE: Cache store items for 10 minutes (relatively static)
      res.set('Cache-Control', 'public, max-age=600, s-maxage=600'); // 10 minutes
      res.json(items);
    } catch (error) {
      console.error("Get store items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/store-items', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can create store items" });
      }

      const item = await storage.createStoreItem(req.body);
      res.status(201).json(item);
    } catch (error) {
      console.error("Create store item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch('/api/store-items/:id', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can update store items" });
      }

      const item = await storage.updateStoreItem(req.params.id, req.body);
      res.json(item);
    } catch (error) {
      console.error("Update store item error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Badge routes
  app.get('/api/classrooms/:id/badges', authenticate, async (req: any, res) => {
    try {
      const badges = await storage.getBadgesByClassroom(req.params.id);
      res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:id/badges', authenticate, async (req: any, res) => {
    try {
      const badges = await storage.getStudentBadges(req.params.id);
      res.json(badges);
    } catch (error) {
      console.error("Get student badges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Challenge routes
  app.get('/api/classrooms/:id/challenges', authenticate, async (req: any, res) => {
    try {
      const challenges = await storage.getChallengesByClassroom(req.params.id);
      res.json(challenges);
    } catch (error) {
      console.error("Get challenges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/challenges/:classroomId', authenticate, async (req: any, res) => {
    try {
      const progress = await storage.getStudentChallengeProgress(req.params.studentId, req.params.classroomId);
      res.json(progress);
    } catch (error) {
      console.error("Get student challenges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Enhanced Classroom Management Endpoints (Phase 1B)
  app.post('/api/classrooms/enhanced', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can create classrooms' });
      }

      const { name, subject, gradeLevel, academicYear, description, autoApproveStudents } = req.body;
      
      if (!name) {
        return res.status(400).json({ message: 'Classroom name is required' });
      }

      // Generate unique join code
      let joinCode;
      let existing;
      do {
        joinCode = storage.generateJoinCode();
        existing = await storage.getClassroomByJoinCode(joinCode);
      } while (existing);

      const classroom = await storage.createClassroom({
        name,
        subject,
        gradeLevel,
        academicYear,
        code: joinCode, // Set both code and joinCode for backwards compatibility
        joinCode,
        teacherId: req.user.id,
        description,
        autoApproveStudents: autoApproveStudents ?? true,
        baseTokenRate: 1
      });

      res.status(201).json(classroom);
    } catch (error) {
      console.error('Error creating enhanced classroom:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/classrooms/:id/roster', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view roster' });
      }

      const classroom = await storage.getClassroom(req.params.id);
      if (!classroom || classroom.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Classroom not found or access denied' });
      }

      const enrollments = await storage.getClassroomEnrollments(req.params.id);
      res.json(enrollments);
    } catch (error) {
      console.error('Error fetching classroom roster:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student Enrollment Management Endpoints (Phase 1B)
  app.post('/api/classrooms/join', authenticate, async (req: any, res) => {
    try {
      const { joinCode } = req.body;
      
      if (!joinCode) {
        return res.status(400).json({ message: 'Join code is required' });
      }

      const classroom = await storage.getClassroomByJoinCode(joinCode);
      if (!classroom) {
        return res.status(404).json({ message: 'Invalid join code' });
      }

      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can join classrooms' });
      }

      // Check if already enrolled
      const existingEnrollments = await storage.getStudentEnrollments(req.user.id);
      const alreadyEnrolled = existingEnrollments.find(e => e.classroomId === classroom.id);
      if (alreadyEnrolled) {
        return res.status(400).json({ message: 'Already enrolled in this classroom' });
      }

      const enrollment = await storage.createEnrollment({
        studentId: req.user.id,
        classroomId: classroom.id,
        enrollmentStatus: classroom.autoApproveStudents ? 'approved' : 'pending'
      });

      res.status(201).json({ 
        enrollment,
        classroom: {
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject,
          gradeLevel: classroom.gradeLevel
        }
      });
    } catch (error) {
      console.error('Error joining classroom:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/students/:studentId/enrollments', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      res.json(enrollments);
    } catch (error) {
      console.error('Error fetching student enrollments:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/enrollments/:enrollmentId/approve', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can approve enrollments' });
      }

      const enrollment = await storage.approveEnrollment(req.params.enrollmentId, req.user.id);
      res.json(enrollment);
    } catch (error) {
      console.error('Error approving enrollment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.put('/api/enrollments/:enrollmentId/deny', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can deny enrollments' });
      }

      const enrollment = await storage.denyEnrollment(req.params.enrollmentId, req.user.id);
      res.json(enrollment);
    } catch (error) {
      console.error('Error denying enrollment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Announcement System Endpoints (Phase 1B)
  app.post('/api/announcements', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can create announcements' });
      }

      const { classroomId, title, content, priority, category, scheduledFor } = req.body;
      
      if (!classroomId || !title || !content) {
        return res.status(400).json({ message: 'Classroom ID, title, and content are required' });
      }

      // Verify teacher owns the classroom
      const classroom = await storage.getClassroom(classroomId);
      if (!classroom || classroom.teacherId !== req.user.id) {
        return res.status(404).json({ message: 'Classroom not found or access denied' });
      }

      const announcement = await storage.createAnnouncement({
        classroomId,
        authorId: req.user.id,
        title,
        content,
        priority: priority || 'normal',
        category: category || 'general',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
        published: true
      });

      res.status(201).json(announcement);
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/announcements/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const announcements = await storage.getAnnouncementsByClassroom(req.params.classroomId, limit);
      
      // If student, also mark announcements they haven't read and get read status
      if (req.user.role === 'student') {
        const unreadAnnouncements = await storage.getUnreadAnnouncements(req.params.classroomId, req.user.id);
        const unreadIds = new Set(unreadAnnouncements.map(a => a.id));
        
        const announcementsWithReadStatus = announcements.map(announcement => ({
          ...announcement,
          isUnread: unreadIds.has(announcement.id)
        }));
        
        res.json(announcementsWithReadStatus);
      } else {
        res.json(announcements);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/announcements/:announcementId/read', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can mark announcements as read' });
      }

      const announcementRead = await storage.markAnnouncementAsRead(req.params.announcementId, req.user.id);
      res.json(announcementRead);
    } catch (error) {
      console.error('Error marking announcement as read:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/announcements/:announcementId/reads', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view read status' });
      }

      const reads = await storage.getAnnouncementReads(req.params.announcementId);
      res.json(reads);
    } catch (error) {
      console.error('Error fetching announcement reads:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // PHASE 1C: TOKEN ECONOMY API ENDPOINTS
  
  // Get student wallet data
  app.get('/api/wallets/student/:studentId/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { studentId, classroomId } = req.params;
      
      // Get or create wallet
      let wallet = await storage.getStudentWallet(studentId, classroomId);
      if (!wallet) {
        wallet = await storage.createStudentWallet({
          studentId,
          classroomId,
          currentBalance: "0.00",
          totalEarned: "0.00",
          totalSpent: "0.00"
        });
      }
      
      // Get recent transactions
      const transactions = await storage.getStudentTransactions(studentId, classroomId, 20);
      
      res.json({
        currentBalance: parseFloat(wallet.currentBalance),
        totalEarned: parseFloat(wallet.totalEarned),
        totalSpent: parseFloat(wallet.totalSpent),
        transactions: transactions.map(t => ({
          id: t.id,
          amount: parseFloat(t.amount),
          transactionType: t.transactionType,
          category: t.category,
          description: t.description,
          transactionDate: t.transactionDate,
          balanceAfter: parseFloat(t.balanceAfter)
        }))
      });
    } catch (error) {
      console.error('Error fetching wallet data:', error);
      res.status(500).json({ error: 'Failed to fetch wallet data' });
    }
  });
  
  // Get student milestones
  app.get('/api/milestones/student/:studentId/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { studentId, classroomId } = req.params;
      const milestones = await storage.getStudentMilestones(studentId, classroomId);
      res.json(milestones);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      res.status(500).json({ error: 'Failed to fetch milestones' });
    }
  });
  
  // Award tokens to students
  app.post('/api/tokens/award', authenticate, async (req: any, res) => {
    try {
      const { studentIds, amount, category, description, referenceType, referenceId, classroomId } = req.body;
      const createdBy = req.user?.id;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can award tokens' });
      }
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: 'Student IDs are required' });
      }
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }
      
      if (!category || !description || !classroomId) {
        return res.status(400).json({ error: 'Category, description, and classroom ID are required' });
      }
      
      const result = await storage.awardTokens({
        studentIds,
        amount: parseFloat(amount.toString()),
        category,
        description,
        referenceType,
        referenceId,
        createdBy,
        classroomId
      });
      
      res.json({
        success: true,
        message: `Awarded ${amount} tokens to ${studentIds.length} student(s)`,
        transactions: result.transactions.length,
        updatedWallets: result.updatedWallets.length
      });
    } catch (error) {
      console.error('Error awarding tokens:', error);
      res.status(500).json({ error: 'Failed to award tokens' });
    }
  });
  
  // Get token categories for a classroom
  app.get('/api/tokens/categories/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      let categories = await storage.getTokenCategories(classroomId);
      
      // Create default categories if none exist
      if (categories.length === 0) {
        const defaultCategories = [
          { name: 'Assignment Completion', description: 'Completing assignments on time', defaultAmount: "10", colorCode: '#10B981', iconName: 'BookOpen' },
          { name: 'Participation', description: 'Active class participation', defaultAmount: "5", colorCode: '#3B82F6', iconName: 'MessageSquare' },
          { name: 'Helping Others', description: 'Assisting classmates', defaultAmount: "8", colorCode: '#8B5CF6', iconName: 'Users' },
          { name: 'Extra Credit', description: 'Going above and beyond', defaultAmount: "15", colorCode: '#F59E0B', iconName: 'Star' },
          { name: 'Behavior', description: 'Positive classroom behavior', defaultAmount: "3", colorCode: '#EF4444', iconName: 'Heart' }
        ];
        
        for (const cat of defaultCategories) {
          await storage.createTokenCategory({
            classroomId,
            ...cat
          });
        }
        
        categories = await storage.getTokenCategories(classroomId);
      }
      
      res.json(categories);
    } catch (error) {
      console.error('Error fetching token categories:', error);
      res.status(500).json({ error: 'Failed to fetch token categories' });
    }
  });
  
  // Get teacher award presets
  app.get('/api/tokens/presets/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const teacherId = req.user?.id;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can access presets' });
      }
      
      let presets = await storage.getTeacherPresets(teacherId, classroomId);
      
      // Create default presets if none exist
      if (presets.length === 0) {
        const defaultPresets = [
          { presetName: 'Perfect Assignment', amount: "25", descriptionTemplate: 'Excellent work on assignment completion!', categoryId: null },
          { presetName: 'Great Participation', amount: "10", descriptionTemplate: 'Outstanding class participation today!', categoryId: null },
          { presetName: 'Helping Friend', amount: "15", descriptionTemplate: 'Thank you for helping a classmate!', categoryId: null },
          { presetName: 'Quick Bonus', amount: "5", descriptionTemplate: 'Small bonus for good behavior!', categoryId: null }
        ];
        
        for (const preset of defaultPresets) {
          await storage.createAwardPreset({
            teacherId,
            classroomId,
            ...preset
          });
        }
        
        presets = await storage.getTeacherPresets(teacherId, classroomId);
      }
      
      res.json(presets);
    } catch (error) {
      console.error('Error fetching teacher presets:', error);
      res.status(500).json({ error: 'Failed to fetch teacher presets' });
    }
  });
  
  // Award tokens using preset
  app.post('/api/tokens/award/preset', authenticate, async (req: any, res) => {
    try {
      const { presetId, studentIds, customDescription } = req.body;
      const teacherId = req.user?.id;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can award tokens' });
      }
      
      // Get preset details
      const presets = await storage.getTeacherPresets(teacherId, '');
      const preset = presets.find(p => p.id === presetId);
      
      if (!preset) {
        return res.status(404).json({ error: 'Preset not found' });
      }
      
      // Award tokens using preset
      const result = await storage.awardTokens({
        studentIds,
        amount: parseFloat(preset.amount),
        category: 'Preset Award',
        description: customDescription || preset.descriptionTemplate || 'Token award from preset',
        referenceType: 'teacher_preset',
        referenceId: presetId,
        createdBy: teacherId,
        classroomId: preset.classroomId
      });
      
      // Update preset usage
      await storage.updatePresetUsage(presetId);
      
      res.json({
        success: true,
        message: `Awarded ${preset.amount} tokens using preset: ${preset.presetName}`,
        transactions: result.transactions.length
      });
    } catch (error) {
      console.error('Error awarding tokens with preset:', error);
      res.status(500).json({ error: 'Failed to award tokens with preset' });
    }
  });

  // PHASE 1D: DIGITAL STORE API ENDPOINTS
  
  // Get store item templates for teachers
  app.get('/api/store/templates', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can access templates' });
      }
      
      const templates = await storage.getStoreItemTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching store templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });
  
  // Get store items for a classroom
  app.get('/api/store/items/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const items = await storage.getStoreItems(classroomId);
      res.json(items);
    } catch (error) {
      console.error('Error fetching store items:', error);
      res.status(500).json({ error: 'Failed to fetch store items' });
    }
  });
  
  // Create store item from template
  app.post('/api/store/items', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can create store items' });
      }
      
      const { classroomId, title, description, basePrice, currentPrice, itemType, category, icon, inventoryType, totalQuantity, maxPerStudent, tags } = req.body;
      
      if (!classroomId || !title || !description || !basePrice || !itemType || !category) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      const newItem = await storage.createStoreItem({
        classroomId,
        title,
        description,
        basePrice: basePrice.toString(),
        currentPrice: (currentPrice || basePrice).toString(),
        itemType,
        category,
        inventoryType: inventoryType || 'unlimited',
        totalQuantity,
        availableQuantity: totalQuantity,
        maxPerStudent: maxPerStudent || 1,
        isRecurring: false,
        featured: false,
        activeStatus: true,
        tags: tags || [],
        metadata: { icon },
        createdBy: req.user.id
      });
      
      res.status(201).json(newItem);
    } catch (error) {
      console.error('Error creating store item:', error);
      res.status(500).json({ error: 'Failed to create store item' });
    }
  });
  
  // Update store item
  app.put('/api/store/items/:itemId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can update store items' });
      }
      
      const { itemId } = req.params;
      const updates = req.body;
      
      const updatedItem = await storage.updateStoreItem(itemId, updates);
      res.json(updatedItem);
    } catch (error) {
      console.error('Error updating store item:', error);
      res.status(500).json({ error: 'Failed to update store item' });
    }
  });
  
  // Delete store item
  app.delete('/api/store/items/:itemId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can delete store items' });
      }
      
      const { itemId } = req.params;
      await storage.deleteStoreItem(itemId);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting store item:', error);
      res.status(500).json({ error: 'Failed to delete store item' });
    }
  });

  // PHASE 2A: ASSIGNMENT MANAGEMENT SYSTEM
  
  // Assignment Management for Teachers
  app.post('/api/assignments', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can create assignments' });
      }
      
      const assignmentData = insertAssignmentAdvancedSchema.parse(req.body);
      const assignment = await storage.createAssignment({
        ...assignmentData,
        createdBy: req.user.id,
        classroomId: req.body.classroomId
      });
      res.json({ assignment });
    } catch (error) {
      console.error('Create assignment error:', error);
      res.status(400).json({ message: 'Failed to create assignment' });
    }
  });

  app.get('/api/assignments/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const { status, category, visibleToStudents } = req.query;
      
      const filters = {
        status: status as string | undefined,
        category: category as string | undefined,
        visibleToStudents: visibleToStudents === 'true' ? true : visibleToStudents === 'false' ? false : undefined
      };
      
      const assignments = await storage.getAssignments(classroomId, filters);
      res.json({ assignments });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  });

  app.get('/api/assignments/details/:assignmentId', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      res.json({ assignment });
    } catch (error) {
      console.error('Get assignment error:', error);
      res.status(500).json({ message: 'Failed to fetch assignment' });
    }
  });

  app.put('/api/assignments/:assignmentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can update assignments' });
      }
      
      const { assignmentId } = req.params;
      const updates = insertAssignmentAdvancedSchema.partial().parse(req.body);
      
      const assignment = await storage.updateAssignment(assignmentId, updates);
      res.json({ assignment });
    } catch (error) {
      console.error('Update assignment error:', error);
      res.status(400).json({ message: 'Failed to update assignment' });
    }
  });

  app.delete('/api/assignments/:assignmentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can delete assignments' });
      }
      
      const { assignmentId } = req.params;
      await storage.deleteAssignment(assignmentId);
      res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
      console.error('Delete assignment error:', error);
      res.status(500).json({ message: 'Failed to delete assignment' });
    }
  });

  // Student Assignment View
  app.get('/api/student-assignments/:classroomId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can view this endpoint' });
      }
      
      const { classroomId } = req.params;
      const studentId = req.user.id;
      
      const assignments = await storage.getStudentAssignments(studentId, classroomId);
      res.json({ assignments });
    } catch (error) {
      console.error('Get student assignments error:', error);
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  });

  // Assignment Submission System
  app.post('/api/submissions', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit assignments' });
      }
      
      const submissionData = insertAssignmentSubmissionSchema.parse(req.body);
      
      if (!submissionData.assignmentId) {
        return res.status(400).json({ message: 'Assignment ID is required' });
      }
      
      // Check if assignment exists and is available
      const assignment = await storage.getAssignment(submissionData.assignmentId);
      if (!assignment || !assignment.visibleToStudents || assignment.status !== 'published') {
        return res.status(400).json({ message: 'Assignment not available for submission' });
      }
      
      // Check deadline
      const isLate = new Date() > new Date(assignment.dueDate);
      if (isLate && !assignment.lateSubmissionAllowed) {
        return res.status(400).json({ message: 'Assignment deadline has passed and late submissions are not allowed' });
      }
      
      const submission = await storage.createSubmission({
        ...submissionData,
        studentId: req.user.id,
        isLateSubmission: isLate
      });
      
      res.json({ submission });
    } catch (error) {
      console.error('Create submission error:', error);
      res.status(400).json({ message: 'Failed to submit assignment' });
    }
  });

  app.get('/api/submissions/assignment/:assignmentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view assignment submissions' });
      }
      
      const { assignmentId } = req.params;
      const submissions = await storage.getAssignmentSubmissions(assignmentId);
      res.json({ submissions });
    } catch (error) {
      console.error('Get assignment submissions error:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  app.get('/api/submissions/student/:classroomId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can view their own submissions' });
      }
      
      const { classroomId } = req.params;
      const studentId = req.user.id;
      
      const submissions = await storage.getStudentSubmissions(studentId, classroomId);
      res.json({ submissions });
    } catch (error) {
      console.error('Get student submissions error:', error);
      res.status(500).json({ message: 'Failed to fetch submissions' });
    }
  });

  app.put('/api/submissions/:submissionId/review', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can review submissions' });
      }
      
      const { submissionId } = req.params;
      const { 
        reviewStatus, 
        tokensAwarded, 
        teacherFeedback, 
        deadlinessScore, 
        instructionFollowingScore, 
        communicationScore, 
        presentationScore,
        overallProfessionalScore 
      } = req.body;
      
      const submission = await storage.updateSubmission(submissionId, {
        reviewStatus,
        tokensAwarded,
        teacherFeedback,
        deadlinessScore,
        instructionFollowingScore,
        communicationScore,
        presentationScore,
        overallProfessionalScore,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      });
      
      // Award tokens to student if approved
      if (reviewStatus === 'completed' && tokensAwarded && parseFloat(tokensAwarded) > 0 && submission.studentId && submission.classroomId) {
        await storage.awardTokens({
          studentIds: [submission.studentId],
          amount: parseFloat(tokensAwarded),
          category: 'Assignment Completion',
          description: `Assignment submission reviewed: ${submission.id}`,
          referenceType: 'assignment_submission',
          referenceId: submissionId,
          createdBy: req.user.id,
          classroomId: submission.classroomId
        });
      }
      
      res.json({ submission });
    } catch (error) {
      console.error('Review submission error:', error);
      res.status(500).json({ message: 'Failed to review submission' });
    }
  });

  // Assignment Feedback System
  app.post('/api/assignment-feedback', authenticate, async (req: any, res) => {
    try {
      const feedbackData = insertAssignmentFeedbackSchema.parse(req.body);
      const feedback = await storage.createAssignmentFeedback({
        ...feedbackData,
        fromUserId: req.user.id
      });
      res.json({ feedback });
    } catch (error) {
      console.error('Create feedback error:', error);
      res.status(400).json({ message: 'Failed to create feedback' });
    }
  });

  app.get('/api/assignment-feedback/:submissionId', authenticate, async (req: any, res) => {
    try {
      const { submissionId } = req.params;
      const feedback = await storage.getAssignmentFeedback(submissionId);
      res.json({ feedback });
    } catch (error) {
      console.error('Get feedback error:', error);
      res.status(500).json({ message: 'Failed to fetch feedback' });
    }
  });

  // Assignment Templates
  app.get('/api/assignment-templates', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can access templates' });
      }
      
      const templates = await storage.getAssignmentTemplates(req.user.id);
      res.json({ templates });
    } catch (error) {
      console.error('Get templates error:', error);
      res.status(500).json({ message: 'Failed to fetch templates' });
    }
  });

  app.post('/api/assignment-templates', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can create templates' });
      }
      
      const templateData = insertAssignmentTemplateSchema.parse(req.body);
      const template = await storage.createAssignmentTemplate({
        ...templateData,
        createdBy: req.user.id
      });
      res.json({ template });
    } catch (error) {
      console.error('Create template error:', error);
      res.status(400).json({ message: 'Failed to create template' });
    }
  });

  // Assignment Analytics
  app.get('/api/assignment-analytics/:classroomId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view analytics' });
      }
      
      const { classroomId } = req.params;
      const { assignmentId } = req.query;
      
      const analytics = await storage.getAssignmentAnalytics(classroomId, assignmentId as string);
      res.json({ analytics });
    } catch (error) {
      console.error('Get assignment analytics error:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // PHASE 2B: MARKETPLACE & PEER-TO-PEER COMMERCE ROUTES

  // ===================
  // SELLER MANAGEMENT
  // ===================

  // Create seller profile
  app.post('/api/marketplace/sellers', authenticate, async (req, res) => {
    try {
      const sellerData = insertMarketplaceSellerSchema.parse(req.body);
      
      // Check if user is a student and in the classroom
      const user = req.user;
      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can become sellers' });
      }

      // Check if seller already exists for this student in this classroom
      const existingSeller = await storage.getSellerByStudent(user.id, sellerData.classroomId);
      if (existingSeller) {
        return res.status(400).json({ message: 'Seller profile already exists for this classroom' });
      }

      const seller = await storage.createSeller({
        ...sellerData,
        studentId: user.id
      });
      
      res.json(seller);
    } catch (error: any) {
      console.error('Error creating seller:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid seller data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create seller profile' });
    }
  });

  // Get seller profile by student
  app.get('/api/marketplace/sellers/me/:classroomId', authenticate, async (req, res) => {
    try {
      const { classroomId } = req.params;
      const user = req.user;
      
      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can have seller profiles' });
      }

      const seller = await storage.getSellerByStudent(user.id, classroomId);
      if (!seller) {
        return res.status(404).json({ message: 'Seller profile not found' });
      }
      
      res.json(seller);
    } catch (error) {
      console.error('Error fetching seller profile:', error);
      res.status(500).json({ message: 'Failed to fetch seller profile' });
    }
  });

  // Get classroom sellers (teacher view)
  app.get('/api/marketplace/sellers/classroom/:classroomId', authenticate, async (req, res) => {
    try {
      const { classroomId } = req.params;
      const { status } = req.query;
      const user = req.user;

      // Verify teacher has access to this classroom
      if (user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view all sellers' });
      }

      const classroom = await storage.getClassroom(classroomId);
      if (!classroom || classroom.teacherId !== user.id) {
        return res.status(403).json({ message: 'Access denied to classroom' });
      }

      const sellers = await storage.getClassroomSellers(classroomId, status as string);
      res.json(sellers);
    } catch (error) {
      console.error('Error fetching classroom sellers:', error);
      res.status(500).json({ message: 'Failed to fetch sellers' });
    }
  });

  // Approve seller
  app.put('/api/marketplace/sellers/:sellerId/approve', authenticate, async (req, res) => {
    try {
      const { sellerId } = req.params;
      const user = req.user;

      if (user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can approve sellers' });
      }

      // Verify teacher has access to this seller's classroom
      const seller = await storage.getSeller(sellerId);
      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
      }

      const classroom = await storage.getClassroom(seller.classroomId);
      if (!classroom || classroom.teacherId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedSeller = await storage.approveSeller(sellerId, user.id);
      res.json(updatedSeller);
    } catch (error) {
      console.error('Error approving seller:', error);
      res.status(500).json({ message: 'Failed to approve seller' });
    }
  });

  // Update seller profile
  app.put('/api/marketplace/sellers/:sellerId', authenticate, async (req, res) => {
    try {
      const { sellerId } = req.params;
      const updates = req.body;
      const user = req.user;

      // Get seller to verify ownership or teacher access
      const seller = await storage.getSeller(sellerId);
      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
      }

      // Check permissions
      if (user.role === 'student' && seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (user.role === 'teacher') {
        const classroom = await storage.getClassroom(seller.classroomId);
        if (!classroom || classroom.teacherId !== user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const updatedSeller = await storage.updateSeller(sellerId, updates);
      res.json(updatedSeller);
    } catch (error) {
      console.error('Error updating seller:', error);
      res.status(500).json({ message: 'Failed to update seller profile' });
    }
  });

  // ===================
  // LISTING MANAGEMENT
  // ===================

  // Create listing
  app.post('/api/marketplace/listings', authenticate, async (req, res) => {
    try {
      const listingData = insertMarketplaceListingSchema.parse(req.body);
      const user = req.user;

      // Verify user owns this seller profile
      const seller = await storage.getSeller(listingData.sellerId);
      if (!seller || seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied to seller profile' });
      }

      // Check if seller is approved
      if (seller.sellerStatus !== 'approved' && seller.sellerStatus !== 'active') {
        return res.status(403).json({ message: 'Seller must be approved to create listings' });
      }

      const listing = await storage.createListing(listingData);
      res.json(listing);
    } catch (error: any) {
      console.error('Error creating listing:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid listing data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create listing' });
    }
  });

  // Get marketplace listings (browse)
  app.get('/api/marketplace/listings/classroom/:classroomId', async (req, res) => {
    try {
      const { classroomId } = req.params;
      const { category, status = 'active', minPrice, maxPrice, tags, sellerId } = req.query;

      const filters: any = { status };
      if (category) filters.category = category;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);
      if (tags) filters.tags = (tags as string).split(',');
      if (sellerId) filters.sellerId = sellerId;

      const listings = await storage.searchListings(classroomId, filters);
      res.json(listings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      res.status(500).json({ message: 'Failed to fetch listings' });
    }
  });

  // Get featured listings
  app.get('/api/marketplace/listings/featured/:classroomId', async (req, res) => {
    try {
      const { classroomId } = req.params;
      const { limit = 6 } = req.query;

      const listings = await storage.getFeaturedListings(classroomId, parseInt(limit as string));
      res.json(listings);
    } catch (error) {
      console.error('Error fetching featured listings:', error);
      res.status(500).json({ message: 'Failed to fetch featured listings' });
    }
  });

  // Get single listing with details
  app.get('/api/marketplace/listings/:listingId', async (req, res) => {
    try {
      const { listingId } = req.params;

      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Update view count
      await storage.updateListingViews(listingId);

      res.json(listing);
    } catch (error) {
      console.error('Error fetching listing:', error);
      res.status(500).json({ message: 'Failed to fetch listing' });
    }
  });

  // Get seller's listings
  app.get('/api/marketplace/sellers/:sellerId/listings', authenticate, async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { status } = req.query;
      const user = req.user;

      // Verify access to seller
      const seller = await storage.getSeller(sellerId);
      if (!seller) {
        return res.status(404).json({ message: 'Seller not found' });
      }

      // Check permissions
      if (user.role === 'student' && seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (user.role === 'teacher') {
        const classroom = await storage.getClassroom(seller.classroomId);
        if (!classroom || classroom.teacherId !== user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const listings = await storage.getSellerListings(sellerId, status as string);
      res.json(listings);
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      res.status(500).json({ message: 'Failed to fetch listings' });
    }
  });

  // Update listing
  app.put('/api/marketplace/listings/:listingId', authenticate, async (req, res) => {
    try {
      const { listingId } = req.params;
      const updates = req.body;
      const user = req.user;

      // Get listing to verify ownership
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Check permissions
      if (user.role === 'student' && listing.seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (user.role === 'teacher') {
        const classroom = await storage.getClassroom(listing.seller.classroomId);
        if (!classroom || classroom.teacherId !== user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      const updatedListing = await storage.updateListing(listingId, updates);
      res.json(updatedListing);
    } catch (error) {
      console.error('Error updating listing:', error);
      res.status(500).json({ message: 'Failed to update listing' });
    }
  });

  // Delete listing
  app.delete('/api/marketplace/listings/:listingId', authenticate, async (req, res) => {
    try {
      const { listingId } = req.params;
      const user = req.user;

      // Get listing to verify ownership
      const listing = await storage.getListing(listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      // Check permissions
      if (user.role === 'student' && listing.seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      if (user.role === 'teacher') {
        const classroom = await storage.getClassroom(listing.seller.classroomId);
        if (!classroom || classroom.teacherId !== user.id) {
          return res.status(403).json({ message: 'Access denied' });
        }
      }

      await storage.deleteListing(listingId);
      res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
      console.error('Error deleting listing:', error);
      res.status(500).json({ message: 'Failed to delete listing' });
    }
  });

  // ===================
  // TRANSACTION PROCESSING
  // ===================

  // Create transaction (purchase)
  app.post('/api/marketplace/transactions', authenticate, async (req, res) => {
    try {
      const transactionData = insertMarketplaceTransactionSchema.parse(req.body);
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can make purchases' });
      }

      // Verify listing exists and is available
      const listing = await storage.getListing(transactionData.listingId);
      if (!listing) {
        return res.status(404).json({ message: 'Listing not found' });
      }

      if (listing.status !== 'active') {
        return res.status(400).json({ message: 'Listing is not available for purchase' });
      }

      // Check if student has enough tokens
      if (user.tokens < parseFloat(transactionData.totalAmount)) {
        return res.status(400).json({ message: 'Insufficient tokens' });
      }

      // Prevent self-purchase
      if (listing.seller.studentId === user.id) {
        return res.status(400).json({ message: 'Cannot purchase your own listing' });
      }

      const transaction = await storage.createTransaction({
        ...transactionData,
        buyerId: user.id
      });

      res.json(transaction);
    } catch (error: any) {
      console.error('Error creating transaction:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid transaction data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create transaction' });
    }
  });

  // Get seller transactions (orders)
  app.get('/api/marketplace/sellers/:sellerId/transactions', authenticate, async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { status } = req.query;
      const user = req.user;

      // Verify access to seller
      const seller = await storage.getSeller(sellerId);
      if (!seller || seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const transactions = await storage.getSellerTransactions(sellerId, status as string);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching seller transactions:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  // Get buyer transactions (purchases)
  app.get('/api/marketplace/transactions/my-purchases', authenticate, async (req, res) => {
    try {
      const { status } = req.query;
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can have purchases' });
      }

      const transactions = await storage.getBuyerTransactions(user.id, status as string);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching buyer transactions:', error);
      res.status(500).json({ message: 'Failed to fetch purchases' });
    }
  });

  // Update transaction status
  app.put('/api/marketplace/transactions/:transactionId', authenticate, async (req, res) => {
    try {
      const { transactionId } = req.params;
      const updates = req.body;
      const user = req.user;

      // Get transaction to verify access
      const transaction = await storage.getTransaction(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      // Check permissions (seller can update, buyer can confirm delivery)
      const canUpdate = 
        (user.role === 'student' && transaction.seller.studentId === user.id) ||
        (user.role === 'student' && transaction.buyer.id === user.id && updates.deliveryConfirmation !== undefined) ||
        user.role === 'teacher';

      if (!canUpdate) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const updatedTransaction = await storage.updateTransaction(transactionId, updates);
      res.json(updatedTransaction);
    } catch (error) {
      console.error('Error updating transaction:', error);
      res.status(500).json({ message: 'Failed to update transaction' });
    }
  });

  // ===================
  // REVIEWS & RATINGS
  // ===================

  // Create review
  app.post('/api/marketplace/reviews', authenticate, async (req, res) => {
    try {
      const reviewData = insertMarketplaceReviewSchema.parse(req.body);
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can leave reviews' });
      }

      // Verify transaction exists and user is the buyer
      const transaction = await storage.getTransaction(reviewData.transactionId);
      if (!transaction || transaction.buyer.id !== user.id) {
        return res.status(403).json({ message: 'Access denied to review this transaction' });
      }

      // Check if transaction is completed
      if (transaction.orderStatus !== 'completed') {
        return res.status(400).json({ message: 'Can only review completed transactions' });
      }

      const review = await storage.createReview({
        ...reviewData,
        reviewerId: user.id
      });

      res.json(review);
    } catch (error: any) {
      console.error('Error creating review:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid review data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create review' });
    }
  });

  // Get seller reviews
  app.get('/api/marketplace/sellers/:sellerId/reviews', async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { status = 'published' } = req.query;

      const reviews = await storage.getSellerReviews(sellerId, status as string);
      res.json(reviews);
    } catch (error) {
      console.error('Error fetching seller reviews:', error);
      res.status(500).json({ message: 'Failed to fetch reviews' });
    }
  });

  // ===================
  // WISHLIST MANAGEMENT
  // ===================

  // Add to wishlist
  app.post('/api/marketplace/wishlist', authenticate, async (req, res) => {
    try {
      const wishlistData = insertMarketplaceWishlistSchema.parse(req.body);
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can have wishlists' });
      }

      const wishlist = await storage.addToWishlist({
        ...wishlistData,
        studentId: user.id
      });

      res.json(wishlist);
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid wishlist data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to add to wishlist' });
    }
  });

  // Remove from wishlist
  app.delete('/api/marketplace/wishlist/:listingId', authenticate, async (req, res) => {
    try {
      const { listingId } = req.params;
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can have wishlists' });
      }

      await storage.removeFromWishlist(user.id, listingId);
      res.json({ message: 'Removed from wishlist' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      res.status(500).json({ message: 'Failed to remove from wishlist' });
    }
  });

  // Get student wishlist
  app.get('/api/marketplace/wishlist/me', authenticate, async (req, res) => {
    try {
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can have wishlists' });
      }

      const wishlist = await storage.getStudentWishlist(user.id);
      res.json(wishlist);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      res.status(500).json({ message: 'Failed to fetch wishlist' });
    }
  });

  // ===================
  // ANALYTICS & INSIGHTS
  // ===================

  // Get seller analytics
  app.get('/api/marketplace/sellers/:sellerId/analytics', authenticate, async (req, res) => {
    try {
      const { sellerId } = req.params;
      const { timeframe = '30d' } = req.query;
      const user = req.user;

      // Verify access to seller
      const seller = await storage.getSeller(sellerId);
      if (!seller || seller.studentId !== user.id) {
        return res.status(403).json({ message: 'Access denied' });
      }

      const analytics = await storage.getSellerAnalytics(sellerId, timeframe as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching seller analytics:', error);
      res.status(500).json({ message: 'Failed to fetch analytics' });
    }
  });

  // Get marketplace analytics (teacher view)
  app.get('/api/marketplace/analytics/:classroomId', authenticate, async (req, res) => {
    try {
      const { classroomId } = req.params;
      const { timeframe = '30d' } = req.query;
      const user = req.user;

      if (user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view marketplace analytics' });
      }

      // Verify teacher has access to classroom
      const classroom = await storage.getClassroom(classroomId);
      if (!classroom || classroom.teacherId !== user.id) {
        return res.status(403).json({ message: 'Access denied to classroom' });
      }

      const analytics = await storage.getMarketplaceAnalytics(classroomId, timeframe as string);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching marketplace analytics:', error);
      res.status(500).json({ message: 'Failed to fetch marketplace analytics' });
    }
  });

  // ===================
  // MESSAGING SYSTEM
  // ===================

  // Create message
  app.post('/api/marketplace/messages', authenticate, async (req, res) => {
    try {
      const messageData = insertMarketplaceMessageSchema.parse(req.body);
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can send marketplace messages' });
      }

      const message = await storage.createMessage({
        ...messageData,
        senderId: user.id
      });

      res.json(message);
    } catch (error: any) {
      console.error('Error creating message:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid message data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to send message' });
    }
  });

  // Get messages for user
  app.get('/api/marketplace/messages', authenticate, async (req, res) => {
    try {
      const { transactionId, listingId, conversationWith } = req.query;
      const user = req.user;

      if (user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can access marketplace messages' });
      }

      const filters: any = {};
      if (transactionId) filters.transactionId = transactionId as string;
      if (listingId) filters.listingId = listingId as string;
      if (conversationWith) filters.conversationWith = conversationWith as string;

      const messages = await storage.getMessages(user.id, filters);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      res.status(500).json({ message: 'Failed to fetch messages' });
    }
  });

  // Mark message as read
  app.put('/api/marketplace/messages/:messageId/read', authenticate, async (req, res) => {
    try {
      const { messageId } = req.params;
      const user = req.user;

      const message = await storage.markMessageAsRead(messageId);
      res.json(message);
    } catch (error) {
      console.error('Error marking message as read:', error);
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

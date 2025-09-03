import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertClassroomSchema, 
  insertAssignmentSchema, 
  insertAssignmentAdvancedSchema,
  insertSubmissionSchema, 
  insertStoreItemSchema, 
  insertAssignmentResourceSchema,
  insertProposalSchema,
  insertProposalFeedbackSchema,
  insertProposalNotificationSchema,
  users,
  classrooms,
  enrollments,
  type User 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";

// Import RBAC middleware
import { authenticate } from "./middleware/auth";
import analyticsRoutes from "./routes/analytics";
import timeTrackingRoutes from "./routes/timeTracking";
import { 
  requireRole, 
  requireAnyRole, 
  requireClassroomOwnership, 
  requireClassroomAccess,
  requireAssignmentOwnership,
  requireAssignmentAccess,
  requireSubmissionAccess,
  requireTokenAuthority
} from "./middleware/rbac";

// Extend Express Request type to include user property
interface AuthenticatedRequest extends Request {
  user: User;
}

const JWT_SECRET = process.env.JWT_SECRET || 
  (process.env.NODE_ENV === 'development' ? 'dev-jwt-secret-bizcoin-2024-secure' : 
   (() => { throw new Error('JWT_SECRET environment variable is required for security'); })());
const JWT_EXPIRES_IN = "8h";

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
  
  // Mount modular route handlers
  app.use('/api/analytics', authenticate, requireClassroomAccess, analyticsRoutes);
  app.use('/api/time-tracking', authenticate, timeTrackingRoutes);
  
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
      const { username, pin } = req.body;

      if (!username || !pin) {
        return res.status(400).json({ message: "Username and PIN are required" });
      }

      // Find student by username (across all classrooms)
      const user = await storage.getUserByUsername(username);
      if (!user || user.role !== 'student' || !user.pinHash) {
        return res.status(401).json({ message: "Invalid username or PIN" });
      }

      // Verify PIN
      const isValidPin = await bcrypt.compare(pin, user.pinHash);
      if (!isValidPin) {
        return res.status(401).json({ message: "Invalid username or PIN" });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      // Update last login
      await db.update(users).set({ lastLogin: new Date() }).where(eq(users.id, user.id));

      res.json({
        token,
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          name: user.name,
          tokens: user.tokens,
          level: user.level,
          profileImageUrl: user.profileImageUrl
        },
        requiresPinChange: user.requiresPinChange || false
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

  // PIN change endpoint
  app.post('/api/auth/change-pin', authenticate, async (req: any, res) => {
    try {
      const { newPin } = req.body;
      
      if (!newPin || newPin.length < 4) {
        return res.status(400).json({ message: "PIN must be at least 4 digits" });
      }

      // Hash new PIN
      const pinHash = await bcrypt.hash(newPin, 12);

      // Update user
      await db.update(users).set({ 
        pinHash,
        requiresPinChange: false 
      }).where(eq(users.id, req.user.id));

      res.json({ success: true, message: "PIN updated successfully" });
    } catch (error) {
      console.error("Change PIN error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update user profile
  app.patch('/api/users/profile', authenticate, async (req: any, res) => {
    try {
      const { nickname, profileImageUrl } = req.body;
      const userId = req.user.id;
      
      // Validate inputs
      if (nickname && nickname.trim().length === 0) {
        return res.status(400).json({ message: "Nickname cannot be empty" });
      }
      
      if (nickname && nickname.trim().length > 50) {
        return res.status(400).json({ message: "Nickname cannot exceed 50 characters" });
      }
      
      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (nickname !== undefined) updateData.nickname = nickname.trim();
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      
      // Update user
      const [updatedUser] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        success: true, 
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          nickname: updatedUser.nickname,
          profileImageUrl: updatedUser.profileImageUrl,
          role: updatedUser.role
        }
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add individual student to classroom
  app.post('/api/classrooms/:classroomId/students', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can add students' });
      }

      const { username, name, tempPin, requiresPinChange = true } = req.body;
      const classroomId = req.params.classroomId;
      
      if (!username || !name || !tempPin) {
        return res.status(400).json({ message: "Username, name, and temporary PIN are required" });
      }

      // Check if username already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Hash temporary PIN
      const pinHash = await bcrypt.hash(tempPin, 12);

      // Create student
      const studentResult = await db.insert(users).values({
        username,
        name,
        pinHash,
        role: 'student',
        requiresPinChange,
        isActive: true,
        tokens: 0,
        level: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      const student = studentResult[0];

      // Enroll student in classroom
      await db.insert(enrollments).values({
        studentId: student.id,
        classroomId,
        enrollmentStatus: 'approved',
        enrolledAt: new Date()
      });

      res.json({ success: true, student });
    } catch (error) {
      console.error("Add student error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Bulk add students via CSV
  app.post('/api/classrooms/:classroomId/students/bulk', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can add students' });
      }

      const { students } = req.body;
      const classroomId = req.params.classroomId;
      
      if (!students || !Array.isArray(students)) {
        return res.status(400).json({ message: "Students array is required" });
      }

      const results = [];
      const errors = [];

      for (let i = 0; i < students.length; i++) {
        const { username, name, tempPin, requiresPinChange = true } = students[i];
        
        try {
          // Check if username already exists
          const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
          if (existingUser.length > 0) {
            errors.push(`Row ${i + 1}: Username '${username}' already exists`);
            continue;
          }

          // Hash temporary PIN
          const pinHash = await bcrypt.hash(tempPin, 12);

          // Create student
          const studentResult = await db.insert(users).values({
            username,
            name,
            pinHash,
            role: 'student',
            requiresPinChange,
            isActive: true,
            tokens: 0,
            level: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();

          const student = studentResult[0];

          // Enroll student in classroom
          await db.insert(enrollments).values({
            studentId: student.id,
            classroomId,
            enrollmentStatus: 'approved',
            enrolledAt: new Date()
          });

          results.push(student);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      res.json({ 
        success: true, 
        added: results.length,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (error) {
      console.error("Bulk add students error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Remove student from classroom
  app.delete('/api/classrooms/:classroomId/students/:studentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can remove students' });
      }

      const { classroomId, studentId } = req.params;
      
      // Verify the teacher owns this classroom
      const classroom = await db.select().from(classrooms).where(eq(classrooms.id, classroomId)).limit(1);
      if (classroom.length === 0 || classroom[0].teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this classroom.' });
      }

      // Remove enrollment
      const deletedEnrollment = await db.delete(enrollments)
        .where(and(eq(enrollments.classroomId, classroomId), eq(enrollments.studentId, studentId)))
        .returning();

      if (deletedEnrollment.length === 0) {
        return res.status(404).json({ message: 'Student not found in this classroom' });
      }

      res.json({ success: true, message: 'Student removed from classroom successfully' });
    } catch (error) {
      console.error('Remove student error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Edit student information
  app.put('/api/students/:studentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can edit students' });
      }

      const { studentId } = req.params;
      const { username, tokens, requiresPinChange, resetPin } = req.body;
      
      // Verify the student exists and the teacher has access
      const studentEnrollments = await db.select({
        enrollment: enrollments,
        classroom: classrooms
      })
      .from(enrollments)
      .innerJoin(classrooms, eq(enrollments.classroomId, classrooms.id))
      .where(and(eq(enrollments.studentId, studentId), eq(classrooms.teacherId, req.user.id)))
      .limit(1);

      if (studentEnrollments.length === 0) {
        return res.status(403).json({ message: 'Access denied or student not found' });
      }

      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (username !== undefined) {
        // Check if username already exists (excluding current student)
        const existingUser = await db.select().from(users)
          .where(and(eq(users.username, username), ne(users.id, studentId)))
          .limit(1);
        if (existingUser.length > 0) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        updateData.username = username;
      }
      if (tokens !== undefined) updateData.tokens = tokens;
      if (requiresPinChange !== undefined) updateData.requiresPinChange = requiresPinChange;
      if (resetPin) {
        // Reset PIN to 0000
        const defaultPinHash = await bcrypt.hash('0000', 12);
        updateData.pinHash = defaultPinHash;
        updateData.requiresPinChange = true;
      }
      
      // Update student
      const [updatedStudent] = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, studentId))
        .returning();
      
      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Student updated successfully',
        student: {
          id: updatedStudent.id,
          username: updatedStudent.username,
          name: updatedStudent.name,
          tokens: updatedStudent.tokens,
          requiresPinChange: updatedStudent.requiresPinChange
        }
      });
    } catch (error) {
      console.error('Edit student error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Update classroom settings
  // General classroom update endpoint
  app.put('/api/classrooms/:classroomId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can update classroom settings' });
      }

      const { classroomId } = req.params;
      const { startingTokens, recurringPayEnabled, recurringPayAmount, recurringPayFrequency } = req.body;
      
      // Verify the teacher owns this classroom
      const classroom = await db.select().from(classrooms).where(eq(classrooms.id, classroomId)).limit(1);
      if (classroom.length === 0 || classroom[0].teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this classroom.' });
      }

      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (startingTokens !== undefined) updateData.startingTokens = startingTokens;
      if (recurringPayEnabled !== undefined) updateData.recurringPayEnabled = recurringPayEnabled;
      if (recurringPayAmount !== undefined) updateData.recurringPayAmount = recurringPayAmount;
      if (recurringPayFrequency !== undefined) updateData.recurringPayFrequency = recurringPayFrequency;

      const [updatedClassroom] = await db
        .update(classrooms)
        .set(updateData)
        .where(eq(classrooms.id, classroomId))
        .returning();

      res.json(updatedClassroom);
    } catch (error) {
      console.error('Update classroom error:', error);
      res.status(500).json({ message: 'Failed to update classroom settings' });
    }
  });

  app.put('/api/classrooms/:classroomId/settings', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can update classroom settings' });
      }

      const { classroomId } = req.params;
      const { tokensPerHour, maxDailyHours, timeTrackingEnabled } = req.body;
      
      // Verify the teacher owns this classroom
      const classroom = await db.select().from(classrooms).where(eq(classrooms.id, classroomId)).limit(1);
      if (classroom.length === 0 || classroom[0].teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this classroom.' });
      }

      // Prepare update data
      const updateData: any = { updatedAt: new Date() };
      if (tokensPerHour !== undefined) updateData.tokensPerHour = tokensPerHour;
      if (maxDailyHours !== undefined) updateData.maxDailyHours = maxDailyHours;
      if (timeTrackingEnabled !== undefined) updateData.timeTrackingEnabled = timeTrackingEnabled;
      
      // Update classroom
      const [updatedClassroom] = await db
        .update(classrooms)
        .set(updateData)
        .where(eq(classrooms.id, classroomId))
        .returning();
      
      if (!updatedClassroom) {
        return res.status(404).json({ message: 'Classroom not found' });
      }
      
      res.json({ 
        success: true, 
        message: 'Classroom settings updated successfully',
        classroom: updatedClassroom
      });
    } catch (error) {
      console.error('Update classroom settings error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
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

  app.get('/api/classrooms', authenticate, requireRole('teacher'), async (req: any, res) => {
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

      const { 
        title, 
        description, 
        category, 
        dueDate, 
        tokenReward, 
        link, 
        classroomId, 
        isRFP, 
        instructions, 
        visibility,
        launchType,
        scheduledUnlockDate,
        selectedStudents
      } = req.body;
      
      // Validate required fields
      if (!title || !classroomId) {
        return res.status(400).json({ message: "Title and classroom are required" });
      }

      // Verify the teacher owns this classroom
      const classroom = await db.select().from(classrooms).where(eq(classrooms.id, classroomId)).limit(1);
      if (classroom.length === 0 || classroom[0].teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this classroom.' });
      }

      const assignmentData = {
        id: nanoid(),
        title: title.trim(),
        description: description?.trim() || '',
        category: category || 'project',
        tokenReward: tokenReward || 10,
        classroomId,
        teacherId: req.user.id,
        dueDate: dueDate ? new Date(dueDate) : null,
        resourceUrl: link?.trim() || null,
        isActive: launchType !== 'manual',
        isRFP: isRFP || false,
        instructions: instructions?.trim() || null,
        visibility: visibility || 'public',
        launchType: launchType || 'immediate',
        scheduledUnlockDate: scheduledUnlockDate ? new Date(scheduledUnlockDate) : null,
        selectedStudents: selectedStudents || [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const assignment = await storage.createAssignment(assignmentData);

      res.status(201).json(assignment);
    } catch (error) {
      console.error("Create assignment error:", error);
      res.status(500).json({ message: "Failed to create assignment. Please check all required fields." });
    }
  });

  // Update assignment (PUT)
  app.put('/api/assignments/:assignmentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can update assignments" });
      }

      const { assignmentId } = req.params;
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Verify the teacher owns this assignment
      if (assignment.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this assignment.' });
      }

      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const updatedAssignment = await storage.updateAssignment(assignmentId, updateData);
      res.json(updatedAssignment);
    } catch (error) {
      console.error("Update assignment error:", error);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  // Delete assignment (DELETE)
  app.delete('/api/assignments/:assignmentId', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can delete assignments" });
      }

      const { assignmentId } = req.params;
      const assignment = await storage.getAssignment(assignmentId);
      
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      // Verify the teacher owns this assignment
      if (assignment.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this assignment.' });
      }

      await storage.deleteAssignment(assignmentId);
      res.json({ message: "Assignment deleted successfully" });
    } catch (error) {
      console.error("Delete assignment error:", error);
      res.status(500).json({ message: "Failed to delete assignment" });
    }
  });

  // Assignment Resource Management Routes
  
  // Get all resources for an assignment
  app.get('/api/assignments/:assignmentId/resources', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      
      // Verify assignment exists and user has access
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      // Check access based on role
      if (req.user.role === 'teacher' && assignment.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      } else if (req.user.role === 'student') {
        // Verify student is enrolled in the classroom
        const enrollments = await storage.getStudentEnrollments(req.user.id);
        const hasAccess = enrollments.some(e => 
          e.classroomId === assignment.classroomId && 
          e.enrollmentStatus === 'approved'
        );
        if (!hasAccess) {
          return res.status(403).json({ message: "Access denied" });
        }
      }
      
      const resources = await storage.getAssignmentResources(assignmentId);
      res.json(resources);
    } catch (error) {
      console.error("Get assignment resources error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new resource for an assignment
  app.post('/api/assignments/:assignmentId/resources', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can add assignment resources" });
      }
      
      // Verify assignment exists and teacher owns it
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      if (assignment.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const resourceData = insertAssignmentResourceSchema.parse({
        ...req.body,
        assignmentId,
        classroomId: assignment.classroomId,
        createdBy: req.user.id
      });
      
      const resource = await storage.createAssignmentResource(resourceData);
      res.status(201).json(resource);
    } catch (error) {
      console.error("Create assignment resource error:", error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid resource data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update an assignment resource
  app.put('/api/assignment-resources/:resourceId', authenticate, async (req: any, res) => {
    try {
      const { resourceId } = req.params;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can update assignment resources" });
      }
      
      // Verify resource exists and teacher owns it
      const resource = await storage.getAssignmentResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      if (resource.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedResource = await storage.updateAssignmentResource(resourceId, req.body);
      res.json(updatedResource);
    } catch (error) {
      console.error("Update assignment resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete an assignment resource
  app.delete('/api/assignment-resources/:resourceId', authenticate, async (req: any, res) => {
    try {
      const { resourceId } = req.params;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can delete assignment resources" });
      }
      
      // Verify resource exists and teacher owns it
      const resource = await storage.getAssignmentResource(resourceId);
      if (!resource) {
        return res.status(404).json({ message: "Resource not found" });
      }
      
      if (resource.createdBy !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteAssignmentResource(resourceId);
      res.json({ message: "Resource deleted successfully" });
    } catch (error) {
      console.error("Delete assignment resource error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update resource display order (for drag-and-drop reordering)
  app.put('/api/assignment-resources/reorder', authenticate, async (req: any, res) => {
    try {
      const { resources } = req.body; // Array of { id, displayOrder }
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: "Only teachers can reorder assignment resources" });
      }
      
      // Verify all resources belong to teacher
      for (const resourceUpdate of resources) {
        const resource = await storage.getAssignmentResource(resourceUpdate.id);
        if (!resource || resource.createdBy !== req.user.id) {
          return res.status(403).json({ message: "Access denied to one or more resources" });
        }
      }
      
      // Update display orders
      const promises = resources.map(update => 
        storage.updateAssignmentResource(update.id, { displayOrder: update.displayOrder })
      );
      
      await Promise.all(promises);
      res.json({ message: "Resource order updated successfully" });
    } catch (error) {
      console.error("Reorder assignment resources error:", error);
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

  // Badge routes
  app.get('/api/classrooms/:id/badges', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const badges = await storage.getBadgesByClassroom(classroomId);
      res.json(badges);
    } catch (error) {
      console.error("Get badges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/classrooms/:id/badges', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      if (req.user.role !== 'teacher' || classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Only classroom teachers can create badges" });
      }
      
      const badge = await storage.createBadge({ ...req.body, classroomId });
      res.status(201).json(badge);
    } catch (error) {
      console.error("Create badge error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Award badge to students
  app.post('/api/badges/:id/award', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const badgeId = req.params.id;
      const { studentIds } = req.body;
      
      if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ message: "Student IDs are required" });
      }
      
      // Verify badge exists
      const badge = await storage.getBadge(badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      // Award badges to students
      const results = await Promise.all(
        studentIds.map(studentId => 
          storage.awardBadgeToStudent(badgeId, studentId, req.user.id)
        )
      );
      
      res.json({ success: true, awarded: results.length });
    } catch (error) {
      console.error('Error awarding badge:', error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // Get badge analytics for classroom
  app.get('/api/classrooms/:id/badge-analytics', authenticate, requireClassroomAccess, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const analytics = await storage.getBadgeAnalytics(classroomId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching badge analytics:', error);
      res.status(500).json({ message: "Failed to fetch badge analytics" });
    }
  });

  // Challenge management routes
  app.get('/api/classrooms/:id/challenges', authenticate, requireClassroomAccess, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const challenges = await storage.getChallengesByClassroom(classroomId);
      res.json(challenges);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      res.status(500).json({ message: "Failed to fetch challenges" });
    }
  });

  app.post('/api/classrooms/:id/challenges', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      if (classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Only classroom teachers can create challenges" });
      }
      
      const challenge = await storage.createChallenge({ ...req.body, classroomId });
      res.status(201).json(challenge);
    } catch (error) {
      console.error('Error creating challenge:', error);
      res.status(500).json({ message: "Failed to create challenge" });
    }
  });

  app.patch('/api/challenges/:id/toggle', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = req.params.id;
      const { isActive } = req.body;
      
      const challenge = await storage.updateChallenge(challengeId, { isActive });
      res.json(challenge);
    } catch (error) {
      console.error('Error toggling challenge:', error);
      res.status(500).json({ message: "Failed to toggle challenge" });
    }
  });

  app.get('/api/classrooms/:id/challenge-analytics', authenticate, requireClassroomAccess, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const analytics = await storage.getChallengeAnalytics(classroomId);
      res.json(analytics);
    } catch (error) {
      console.error('Error fetching challenge analytics:', error);
      res.status(500).json({ message: "Failed to fetch challenge analytics" });
    }
  });

  // Student management and awarding routes
  app.post('/api/students/:id/award-tokens', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.params.id;
      const { amount, reason } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid token amount is required" });
      }

      const student = await storage.getUser(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ message: "Student not found" });
      }

      const updatedStudent = await storage.updateUserTokens(studentId, (student.tokens || 0) + amount);
      
      // Log the award (could be extended with audit trail)
      console.log(`Teacher ${req.user.id} awarded ${amount} tokens to student ${studentId}. Reason: ${reason}`);

      res.json({
        success: true,
        student: updatedStudent,
        awarded: amount,
        reason
      });
    } catch (error) {
      console.error('Error awarding tokens:', error);
      res.status(500).json({ message: "Failed to award tokens" });
    }
  });

  app.post('/api/students/:id/award-badge', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const studentId = req.params.id;
      const { badgeId, reason } = req.body;

      if (!badgeId) {
        return res.status(400).json({ message: "Badge ID is required" });
      }

      const student = await storage.getUser(studentId);
      if (!student || student.role !== 'student') {
        return res.status(404).json({ message: "Student not found" });
      }

      const badge = await storage.getBadge(badgeId);
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }

      await storage.awardBadgeToStudent({
        studentId,
        badgeId,
        awardedBy: req.user.id,
        reason
      });

      console.log(`Teacher ${req.user.id} awarded badge ${badgeId} to student ${studentId}. Reason: ${reason}`);

      res.json({
        success: true,
        badgeId,
        reason
      });
    } catch (error) {
      console.error('Error awarding badge:', error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  app.put('/api/badges/:id', authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const badgeId = req.params.id;
      const badge = await storage.getBadge(badgeId);
      
      if (!badge) {
        return res.status(404).json({ message: "Badge not found" });
      }
      
      const classroom = await storage.getClassroom(badge.classroomId!);
      if (req.user.role !== 'teacher' || classroom?.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Only classroom teachers can edit badges" });
      }
      
      const updated = await storage.updateBadge(badgeId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update badge error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Challenge routes
  app.get('/api/classrooms/:id/challenges', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const challenges = await storage.getChallengesByClassroom(classroomId);
      res.json(challenges);
    } catch (error) {
      console.error("Get challenges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/classrooms/:id/challenges', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const classroomId = req.params.id;
      const classroom = await storage.getClassroom(classroomId);
      
      if (!classroom) {
        return res.status(404).json({ message: "Classroom not found" });
      }
      
      if (req.user.role !== 'teacher' || classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Only classroom teachers can create challenges" });
      }
      
      const challenge = await storage.createChallenge({ ...req.body, classroomId });
      res.status(201).json(challenge);
    } catch (error) {
      console.error("Create challenge error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put('/api/challenges/:id', authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const challengeId = req.params.id;
      const challenge = await storage.getChallenge(challengeId);
      
      if (!challenge) {
        return res.status(404).json({ message: "Challenge not found" });
      }
      
      const classroom = await storage.getClassroom(challenge.classroomId);
      if (req.user.role !== 'teacher' || classroom?.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Only classroom teachers can edit challenges" });
      }
      
      const updated = await storage.updateChallenge(challengeId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Update challenge error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Badge and Challenge template routes
  app.get('/api/badge-templates', authenticate, async (req: AuthenticatedRequest, res) => {
    const templates = [
      {
        id: 'perfect_attendance',
        name: 'Perfect Attendance',
        description: 'Awarded for excellent attendance',
        icon: 'fas fa-calendar-check',
        color: '#10b981',
        category: 'attendance'
      },
      {
        id: 'top_performer',
        name: 'Top Performer',
        description: 'Recognize outstanding academic achievement',
        icon: 'fas fa-trophy',
        color: '#f59e0b',
        category: 'academic'
      },
      {
        id: 'helper',
        name: 'Helper',
        description: 'Given to students who help others',
        icon: 'fas fa-heart',
        color: '#ef4444',
        category: 'behavior'
      },
      {
        id: 'creative_thinker',
        name: 'Creative Thinker',
        description: 'For innovative and creative work',
        icon: 'fas fa-lightbulb',
        color: '#8b5cf6',
        category: 'creativity'
      },
      {
        id: 'team_player',
        name: 'Team Player',
        description: 'Excellent collaboration skills',
        icon: 'fas fa-users',
        color: '#06b6d4',
        category: 'collaboration'
      },
      {
        id: 'problem_solver',
        name: 'Problem Solver',
        description: 'Tackles challenges with determination',
        icon: 'fas fa-puzzle-piece',
        color: '#84cc16',
        category: 'academic'
      }
    ];
    res.json(templates);
  });

  app.get('/api/challenge-templates', authenticate, async (req: AuthenticatedRequest, res) => {
    const templates = [
      {
        id: 'reading_marathon',
        name: 'Reading Marathon',
        description: 'Read multiple books in a set timeframe',
        icon: 'fas fa-book',
        color: '#10b981',
        targetValue: 10,
        tokenReward: 50,
        category: 'reading'
      },
      {
        id: 'homework_heroes',
        name: 'Homework Heroes',
        description: 'Complete assignments consistently',
        icon: 'fas fa-pencil-alt',
        color: '#3b82f6',
        targetValue: 15,
        tokenReward: 30,
        category: 'academic'
      },
      {
        id: 'math_master',
        name: 'Math Master',
        description: 'Excel in mathematics assignments',
        icon: 'fas fa-calculator',
        color: '#f59e0b',
        targetValue: 20,
        tokenReward: 40,
        category: 'math'
      },
      {
        id: 'science_explorer',
        name: 'Science Explorer',
        description: 'Conduct experiments and investigations',
        icon: 'fas fa-flask',
        color: '#8b5cf6',
        targetValue: 8,
        tokenReward: 35,
        category: 'science'
      },
      {
        id: 'participation_champion',
        name: 'Participation Champion',
        description: 'Active participation in class discussions',
        icon: 'fas fa-hand-paper',
        color: '#ef4444',
        targetValue: 25,
        tokenReward: 25,
        category: 'participation'
      },
      {
        id: 'token_saver',
        name: 'Token Saver',
        description: 'Save up a certain amount of tokens',
        icon: 'fas fa-piggy-bank',
        color: '#06b6d4',
        targetValue: 100,
        tokenReward: 20,
        category: 'economy'
      }
    ];
    res.json(templates);
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
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      res.json(enrollments);
    } catch (error) {
      console.error("Get student enrollments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Student-specific endpoints that pull from classroom data
  app.get('/api/students/:studentId/store-items', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get student's approved enrollments
      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      const approvedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'approved');
      
      if (approvedEnrollments.length === 0) {
        return res.json([]);
      }
      
      // For now, use the first classroom (could be expanded to support multiple later)
      const classroomId = approvedEnrollments[0].classroomId;
      const items = await storage.getStoreItemsByClassroom(classroomId);
      
      // Convert database items to client format and ensure isAvailable field
      const clientItems = items.map(item => ({
        id: item.id,
        name: item.name,
        title: item.name,
        description: item.description,
        category: item.category,
        cost: item.cost,
        imageUrl: item.imageUrl,
        isAvailable: item.isActive === true, // Convert database field to client field
        quantity: item.inventory || -1,
        inventory: item.inventory || -1
      }));
      
      res.json(clientItems);
    } catch (error) {
      console.error("Get student store items error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/assignments', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get student's approved enrollments
      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      const approvedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'approved');
      
      if (approvedEnrollments.length === 0) {
        return res.json([]);
      }
      
      // For now, use the first classroom
      const classroomId = approvedEnrollments[0].classroomId;
      const assignments = await storage.getAssignmentsByClassroom(classroomId);
      
      // Get student's submissions for these assignments
      const studentSubmissions = await storage.getSubmissionsByStudent(req.params.studentId);
      
      // Transform to simplified status workflow: assigned -> pending_approval -> completed
      const clientAssignments = assignments.map(assignment => {
        const submission = studentSubmissions.find(s => s.assignmentId === assignment.id);
        
        // Determine simple status based on submission
        let status: 'assigned' | 'pending_approval' | 'completed';
        if (!submission) {
          status = 'assigned'; // No submission yet - student needs to mark as complete
        } else if (submission.status === 'pending') {
          status = 'pending_approval'; // Waiting for teacher approval
        } else if (submission.status === 'approved') {
          status = 'completed'; // Teacher approved and tokens awarded
        } else {
          status = 'assigned'; // Any other state - treat as incomplete
        }
        
        return {
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          category: assignment.category,
          tokenReward: assignment.tokenReward || 0,
          dueDate: assignment.dueDate?.toISOString(),
          status,
          resources: assignment.resources || [],
          submittedAt: submission?.submittedAt?.toISOString(),
          feedback: submission?.feedback
        };
      });
      
      res.json(clientAssignments);
    } catch (error) {
      console.error("Get student assignments error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // SIMPLIFIED WORKFLOW: Student marks assignment as complete (no submission needed)
  app.post('/api/assignments/:assignmentId/mark-complete', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can mark assignments as complete' });
      }
      
      // Get assignment details using basic assignment table  
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // Verify student enrollment in this classroom
      const enrollments = await storage.getStudentEnrollments(userId);
      const hasAccess = enrollments.some(e => 
        e.classroomId === assignment.classroomId && 
        e.enrollmentStatus === 'approved'
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this assignment' });
      }
      
      // Check if assignment is active
      if (!assignment.isActive) {
        return res.status(400).json({ message: 'Assignment not available for completion' });
      }
      
      // Check if student already has a submission
      const existingSubmissions = await storage.getSubmissionsByStudent(userId);
      const existingSubmission = existingSubmissions.find(s => s.assignmentId === assignmentId);
      
      if (existingSubmission && existingSubmission.status === 'pending') {
        return res.status(400).json({ message: 'Assignment is already awaiting teacher approval' });
      }
      
      if (existingSubmission && existingSubmission.status === 'approved') {
        return res.status(400).json({ message: 'Assignment is already completed' });
      }
      
      // Create or update submission with pending status for teacher approval
      if (existingSubmission) {
        await storage.updateSubmission(existingSubmission.id, {
          status: 'pending',
          submissionText: 'Student marked assignment as complete'
        });
      } else {
        await storage.createSubmission({
          assignmentId,
          studentId: userId,
          status: 'pending',
          submissionText: 'Student marked assignment as complete'
        });
      }
      
      res.json({
        message: 'Assignment marked as complete and sent to teacher for approval'
      });
    } catch (error) {
      console.error('Error marking assignment complete:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // UNMARK ASSIGNMENT AS COMPLETE
  app.post('/api/assignments/:assignmentId/unmark-complete', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can unmark assignments' });
      }
      
      // Get assignment details
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // Verify student enrollment in this classroom
      const enrollments = await storage.getStudentEnrollments(userId);
      const hasAccess = enrollments.some(e => 
        e.classroomId === assignment.classroomId && 
        e.enrollmentStatus === 'approved'
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this assignment' });
      }
      
      // Check if there's a pending submission to remove
      const submissions = await storage.getSubmissionsByStudent(userId);
      const existingSubmission = submissions.find(s => s.assignmentId === assignmentId && s.status === 'pending');
      
      if (existingSubmission) {
        // Remove the pending submission
        await storage.updateSubmission(existingSubmission.id, {
          status: 'rejected' // Mark as rejected to remove from pending queue
        });
      }
      
      res.json({
        message: 'Assignment unmarked successfully. You can now rework and resubmit.'
      });
    } catch (error) {
      console.error('Error unmarking assignment:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Enhanced Proposals Portal Routes - Comprehensive Special Projects Management
  
  // Get all proposals for a classroom (Teacher dashboard)
  app.get("/api/proposals/classroom/:classroomId", authenticate, requireClassroomAccess, async (req: AuthenticatedRequest, res) => {
    try {
      const { classroomId } = req.params;
      const { status, priority } = req.query;
      
      let proposals = await storage.getProposalsByClassroom(classroomId);
      
      // Filter by status if provided
      if (status && typeof status === 'string') {
        proposals = proposals.filter(p => p.status === status);
      }
      
      // Filter by priority if provided
      if (priority && typeof priority === 'string') {
        proposals = proposals.filter(p => p.priority === priority);
      }
      
      res.json(proposals);
    } catch (error) {
      console.error('Error fetching classroom proposals:', error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });
  
  // Get detailed proposal with feedback and notifications
  app.get("/api/proposals/:proposalId/details", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const { proposalId } = req.params;
      
      const [proposal, feedback, notifications] = await Promise.all([
        storage.getProposal(proposalId),
        storage.getProposalFeedback(proposalId),
        storage.getProposalNotifications(req.user.id)
      ]);
      
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      // Check access permissions
      const canAccess = req.user.role === 'teacher' || proposal.studentId === req.user.id;
      if (!canAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json({
        proposal,
        feedback,
        notifications: notifications.filter(n => n.proposalId === proposalId)
      });
    } catch (error) {
      console.error('Error fetching proposal details:', error);
      res.status(500).json({ message: "Failed to fetch proposal details" });
    }
  });
  
  // Teacher review actions (Approve, Reject, Request Revision)
  app.post("/api/proposals/:proposalId/review", authenticate, requireRole('teacher'), async (req: AuthenticatedRequest, res) => {
    try {
      const { proposalId } = req.params;
      const { action, feedback, internalNotes, grade, tokensAwarded } = req.body;
      
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      let updatedProposal;
      
      switch (action) {
        case 'approve':
          updatedProposal = await storage.updateProposalStatus(proposalId, 'approved', { teacherFeedback: feedback, internalNotes });
          
          // Award tokens to student if specified
          if (tokensAwarded && tokensAwarded > 0) {
            await storage.updateUserTokens(proposal.studentId, tokensAwarded);
          }
          break;
        case 'reject':
          updatedProposal = await storage.updateProposalStatus(proposalId, 'rejected', { teacherFeedback: feedback, internalNotes });
          break;
        case 'request_revision':
          updatedProposal = await storage.updateProposalStatus(proposalId, 'needs_revision', { teacherFeedback: feedback, internalNotes });
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }
      
      // Create feedback entry
      if (feedback) {
        await storage.createProposalFeedback({
          proposalId: proposal.id,
          fromUserId: req.user.id,
          toUserId: proposal.studentId,
          feedbackType: action === 'approve' ? 'approval' : action === 'reject' ? 'rejection' : 'revision_request',
          feedbackContent: feedback,
          isPublic: true
        });
      }
      
      res.json(updatedProposal);
    } catch (error) {
      console.error('Error reviewing proposal:', error);
      res.status(500).json({ message: "Failed to review proposal" });
    }
  });

  // Update proposal progress (For approved/in-progress proposals)
  app.patch("/api/proposals/:proposalId/progress", authenticate, requireRole('student'), async (req: AuthenticatedRequest, res) => {
    try {
      const { proposalId } = req.params;
      const { progressPercentage, completedMilestones } = req.body;
      
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) {
        return res.status(404).json({ message: "Proposal not found" });
      }
      
      if (proposal.studentId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!['approved', 'in_progress'].includes(proposal.status)) {
        return res.status(400).json({ message: "Can only update progress for approved proposals" });
      }
      
      const updatedProposal = await storage.updateProposalProgress(proposalId, progressPercentage, completedMilestones);
      
      res.json(updatedProposal);
    } catch (error) {
      console.error('Error updating proposal progress:', error);
      res.status(500).json({ message: "Failed to update proposal progress" });
    }
  });


  // RFP PROPOSAL ROUTES
  
  // Create a new proposal for an RFP assignment
  app.post('/api/proposals', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can submit proposals' });
      }
      
      const { assignmentId, content } = req.body;
      const studentId = req.user.id;
      
      if (!assignmentId || !content) {
        return res.status(400).json({ message: 'Assignment ID and content are required' });
      }
      
      // Verify assignment exists and is an RFP
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      if (!assignment.isRFP) {
        return res.status(400).json({ message: 'This assignment is not an RFP' });
      }
      
      if (!assignment.isActive) {
        return res.status(400).json({ message: 'Assignment is not active' });
      }
      
      // Check if student is enrolled in the classroom
      const enrollments = await storage.getStudentEnrollments(studentId);
      const hasAccess = enrollments.some(e => 
        e.classroomId === assignment.classroomId && 
        e.enrollmentStatus === 'approved'
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this assignment' });
      }
      
      // Create the proposal
      const proposal = await storage.createProposal({
        assignmentId,
        studentId,
        content
      });
      
      res.json({ proposal });
    } catch (error) {
      console.error('Create proposal error:', error);
      if (error.message && error.message.includes('duplicate')) {
        res.status(400).json({ message: 'You have already submitted a proposal for this assignment' });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
  
  // Get all proposals for an assignment (teachers only)
  app.get('/api/assignments/:assignmentId/proposals', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view assignment proposals' });
      }
      
      const { assignmentId } = req.params;
      
      // Verify assignment exists and belongs to this teacher
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      if (assignment.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied to this assignment' });
      }
      
      const proposals = await storage.getProposalsByAssignment(assignmentId);
      res.json({ proposals });
    } catch (error) {
      console.error('Get assignment proposals error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Get proposals by student
  app.get('/api/students/:studentId/proposals', authenticate, async (req: any, res) => {
    try {
      const { studentId } = req.params;
      
      // Students can only view their own proposals, teachers can view any student's proposals
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const proposals = await storage.getProposalsByStudent(studentId);
      res.json({ proposals });
    } catch (error) {
      console.error('Get student proposals error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  // Approve a proposal (teachers only)
  app.post('/api/proposals/:proposalId/approve', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can approve proposals' });
      }
      
      const { proposalId } = req.params;
      
      // Get proposal and verify access
      const proposals = await storage.getProposalsByStudent(''); // This will get all, we'll filter
      const proposal = proposals.find(p => p.id === proposalId);
      
      if (!proposal) {
        return res.status(404).json({ message: 'Proposal not found' });
      }
      
      // Verify teacher owns the assignment
      const assignment = await storage.getAssignment(proposal.assignmentId);
      if (!assignment || assignment.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'Access denied to this proposal' });
      }
      
      if (proposal.status !== 'pending') {
        return res.status(400).json({ message: 'Proposal has already been reviewed' });
      }
      
      // Approve the proposal (this will also mark others as not_selected)
      await storage.approveProposal(proposalId);
      
      res.json({ message: 'Proposal approved successfully' });
    } catch (error) {
      console.error('Approve proposal error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Student requests completion approval (no tokens yet)
  app.post('/api/assignments/:assignmentId/request-completion', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      const userId = req.user.id;
      
      if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can request completion' });
      }
      
      // Get assignment details
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // SECURITY: Verify student owns this assignment
      if (assignment.studentId !== userId) {
        return res.status(403).json({ message: 'You can only request completion for your own assignments' });
      }
      
      // Check if assignment is graded and ready for completion request
      if (assignment.status !== 'graded') {
        return res.status(400).json({ message: 'Assignment must be graded before requesting completion' });
      }
      
      // Verify student enrollment in this classroom
      const enrollments = await storage.getStudentEnrollments(userId);
      const hasAccess = enrollments.some(e => 
        e.classroomId === assignment.classroomId && 
        e.enrollmentStatus === 'approved'
      );
      
      if (!hasAccess) {
        return res.status(403).json({ message: 'Access denied to this assignment' });
      }
      
      // Mark assignment as pending approval
      await storage.updateAssignment(assignmentId, { status: 'pending_approval' });
      
      res.json({
        message: 'Completion request submitted successfully'
      });
    } catch (error) {
      console.error('Error requesting completion:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Teacher approves completion and awards tokens
  app.post('/api/assignments/:assignmentId/approve-completion', authenticate, async (req: any, res) => {
    try {
      const { assignmentId } = req.params;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can approve completions' });
      }
      
      // Get assignment details
      const assignment = await storage.getAssignment(assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: 'Assignment not found' });
      }
      
      // SECURITY: Verify teacher owns this classroom
      const classroom = await storage.getClassroom(assignment.classroomId);
      if (!classroom || classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'You can only approve assignments from your own classroom' });
      }
      
      // Check if assignment is pending approval
      if (assignment.status !== 'pending_approval') {
        return res.status(400).json({ message: 'Assignment is not pending approval' });
      }
      
      // TRANSACTION: Atomic completion and token award
      try {
        // Mark assignment as completed with conditional update
        const updateResult = await storage.updateAssignmentWithCondition(
          assignmentId, 
          { status: 'completed' },
          { status: 'pending_approval' }
        );
        
        if (!updateResult) {
          return res.status(409).json({ message: 'Assignment has already been processed' });
        }
        
        // Award tokens to the student
        const result = await storage.awardTokens({
          studentIds: [assignment.studentId],
          amount: assignment.tokenReward,
          category: 'Assignment Completion',
          description: `Completed assignment: ${assignment.title}`,
          referenceType: 'assignment',
          referenceId: assignmentId,
          createdBy: req.user.id, // Teacher approved it
          classroomId: assignment.classroomId
        });
        
        res.json({
          message: 'Assignment completion approved and tokens awarded',
          tokensAwarded: assignment.tokenReward,
          transaction: result.transactions[0]
        });
      } catch (transactionError) {
        console.error('Transaction error during approval:', transactionError);
        res.status(500).json({ message: 'Failed to complete approval process' });
      }
    } catch (error) {
      console.error('Error approving completion:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get assignments pending approval for a classroom
  app.get('/api/classrooms/:classroomId/assignments/pending-approval', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Only teachers can view pending approvals' });
      }
      
      // SECURITY: Verify teacher owns this classroom
      const classroom = await storage.getClassroom(classroomId);
      if (!classroom || classroom.teacherId !== req.user.id) {
        return res.status(403).json({ message: 'You can only view pending approvals from your own classroom' });
      }
      
      // Get all assignments for this classroom with pending_approval status, including student info
      const assignments = await storage.getAssignmentsWithStudentInfo(classroomId, { status: 'pending_approval' });
      
      res.json(assignments);
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.get('/api/students/:studentId/announcements', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get student's approved enrollments
      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      const approvedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'approved');
      
      if (approvedEnrollments.length === 0) {
        return res.json([]);
      }
      
      // For now, use the first classroom
      const classroomId = approvedEnrollments[0].classroomId;
      const announcements = await storage.getAnnouncementsByClassroom(classroomId);
      res.json(announcements);
    } catch (error) {
      console.error("Get student announcements error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/challenges', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get student's approved enrollments
      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      const approvedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'approved');
      
      if (approvedEnrollments.length === 0) {
        return res.json([]);
      }
      
      // For now, use the first classroom
      const classroomId = approvedEnrollments[0].classroomId;
      const challenges = await storage.getChallengesByClassroom(classroomId);
      res.json(challenges);
    } catch (error) {
      console.error("Get student challenges error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/progress', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get student's approved enrollments
      const enrollments = await storage.getStudentEnrollments(req.params.studentId);
      const approvedEnrollments = enrollments.filter(e => e.enrollmentStatus === 'approved');
      
      if (approvedEnrollments.length === 0) {
        return res.json({ totalTokens: 0, level: 1, assignmentsCompleted: 0, badgesEarned: 0 });
      }
      
      // Calculate progress across all classrooms (or primary classroom)
      const student = await storage.getUser(req.params.studentId);
      const progress = {
        totalTokens: student?.tokens || 0,
        level: student?.level || 1,
        assignmentsCompleted: 0, // TODO: Calculate from assignments
        badgesEarned: 0 // TODO: Calculate from badges
      };
      
      res.json(progress);
    } catch (error) {
      console.error("Get student progress error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/purchases', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // TODO: Implement purchase history from marketplace transactions
      res.json([]);
    } catch (error) {
      console.error("Get student purchases error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/badge-progress', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // TODO: Implement badge progress tracking
      res.json({});
    } catch (error) {
      console.error("Get student badge progress error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Time tracking endpoints
  app.get('/api/students/:studentId/time-entries', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get user's current classroom (simplified approach)
      const userEnrollments = await storage.getStudentEnrollments(req.params.studentId);
      const currentClassroom = userEnrollments[0]; // Use first classroom for now
      
      if (!currentClassroom) {
        return res.json([]);
      }
      
      // Fetch time entries for this student in their classroom
      const timeEntries = await storage.getTimeEntries(currentClassroom.classroomId, req.params.studentId);
      res.json(timeEntries);
    } catch (error) {
      console.error("Get student time entries error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/active-session', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const activeSession = await storage.getActiveTimeSession(req.params.studentId);
      res.json(activeSession);
    } catch (error) {
      console.error("Get student active session error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/time-tracking/clock-in', authenticate, async (req: any, res) => {
    try {
      console.log('Clock in attempt by user:', req.user.id);
      
      // Check if user already has an active session
      const activeSession = await storage.getActiveTimeSession(req.user.id);
      if (activeSession) {
        return res.status(400).json({ message: "You already have an active session. Please clock out first." });
      }
      
      const clockInTime = new Date();
      
      // Get user's current classroom (simplified approach)
      const userEnrollments = await storage.getStudentEnrollments(req.user.id);
      const currentClassroom = userEnrollments[0]; // Use first classroom for now
      
      if (!currentClassroom) {
        return res.status(400).json({ message: "You must be enrolled in a classroom to track time." });
      }

      // Create a time entry in the database
      const timeEntry = await storage.createTimeEntry({
        studentId: req.user.id,
        classroomId: currentClassroom.classroomId,
        clockInTime: clockInTime,
        ipAddress: req.ip || req.connection.remoteAddress || '127.0.0.1',
        status: 'active'
      });
      
      res.json({ 
        success: true, 
        clockInTime: clockInTime.toISOString(),
        sessionId: timeEntry.id
      });
    } catch (error) {
      console.error("Clock in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });


  app.post('/api/time-tracking/clock-out', authenticate, async (req: any, res) => {
    try {
      console.log('Clock out attempt by user:', req.user.id);
      
      // Get the active session for this user (simplified approach)
      const activeSession = await storage.getActiveTimeSession(req.user.id);
      
      if (!activeSession) {
        return res.status(400).json({ message: "No active session found" });
      }
      
      const clockOutTime = new Date();
      const clockInTime = new Date(activeSession.clockInTime);
      const durationMinutes = Math.floor((clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60));
      
      // Calculate tokens: 1 token per 15 minutes (standard rate)
      const tokensEarned = Math.max(1, Math.floor(durationMinutes / 15)); // 1 token per 15 minutes, minimum 1
      
      // Update user's token balance
      await storage.updateUserTokens(req.user.id, tokensEarned);
      
      // End the session by updating the time entry with clock out details
      await storage.endTimeSession(activeSession.id, durationMinutes, tokensEarned);
      
      res.json({ 
        success: true, 
        clockOutTime: clockOutTime.toISOString(),
        duration: durationMinutes,
        tokensEarned: tokensEarned
      });
    } catch (error) {
      console.error("Clock out error:", error);
      res.status(500).json({ message: "Failed to clock out. Please try again." });
    }
  });

  // Classroom joining endpoint for existing students
  app.post('/api/classrooms/join', authenticate, async (req: any, res) => {
    try {
      const { classroomCode } = req.body;
      
      if (!classroomCode) {
        return res.status(400).json({ message: "Classroom code is required" });
      }

      // Find classroom by join code
      const classroom = await storage.getClassroomByJoinCode(classroomCode);
      if (!classroom) {
        return res.status(400).json({ message: "Invalid classroom code" });
      }

      // Check if already enrolled
      const existingEnrollment = await storage.getStudentEnrollments(req.user.id);
      const alreadyEnrolled = existingEnrollment.some(e => e.classroomId === classroom.id);
      
      if (alreadyEnrolled) {
        return res.status(400).json({ message: "Already enrolled in this classroom" });
      }

      // Create enrollment (auto-approve for now)
      const enrollment = await storage.createEnrollment({
        studentId: req.user.id,
        classroomId: classroom.id,
        enrollmentStatus: classroom.autoApproveStudents ? 'approved' : 'pending'
      });

      res.json({
        success: true,
        enrollment,
        classroom: {
          id: classroom.id,
          name: classroom.name,
          subject: classroom.subject
        }
      });
    } catch (error) {
      console.error("Join classroom error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/students/:studentId/enrollments_old', authenticate, async (req: any, res) => {
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

  // Student purchase endpoint
  app.post('/api/store/:itemId/purchase', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can make purchases' });
      }
      
      const { itemId } = req.params;
      const studentId = req.user.id;
      
      // Get student's approved enrollments to determine classroom
      const studentEnrollments = await storage.getStudentEnrollments(studentId);
      const approvedEnrollments = studentEnrollments.filter(e => e.enrollmentStatus === 'approved');
      
      if (approvedEnrollments.length === 0) {
        return res.status(400).json({ error: 'Student not enrolled in any classroom' });
      }
      
      const classroomId = approvedEnrollments[0].classroomId;
      
      // Get the store item
      const storeItems = await storage.getStoreItemsByClassroom(classroomId);
      const item = storeItems.find(i => i.id === itemId);
      
      if (!item) {
        return res.status(404).json({ error: 'Store item not found' });
      }
      
      // Check if item is available
      if (!item.isActive) {
        return res.status(400).json({ error: 'Item is not available for purchase' });
      }
      
      // Get student's current token balance
      const student = await storage.getUser(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found' });
      }
      
      // Check if student has enough tokens
      if (student.tokens < item.cost) {
        return res.status(400).json({ error: 'Not enough tokens to purchase this item' });
      }
      
      // Deduct tokens from student
      const newTokenBalance = student.tokens - item.cost;
      await storage.updateUserTokens(studentId, newTokenBalance);
      
      // Create purchase record
      const purchase = await storage.createPurchase({
        studentId,
        storeItemId: itemId,
        tokensSpent: item.cost,
        status: 'fulfilled'
      });
      
      // Create inventory entry for the purchased item
      await storage.createInventoryItem({
        studentId,
        classroomId,
        storeItemId: itemId,
        purchaseId: purchase.id,
        status: 'owned',
        condition: 'new'
      });
      
      res.json({ 
        success: true, 
        purchase,
        newTokenBalance,
        message: 'Purchase successful'
      });
    } catch (error) {
      console.error('Error processing purchase:', error);
      res.status(500).json({ error: 'Failed to process purchase' });
    }
  });

  // ECONOMY & MARKETPLACE API ENDPOINTS

  // Student Inventory Management
  app.get('/api/inventory/:studentId/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { studentId, classroomId } = req.params;
      
      // Verify access - students can only see their own inventory
      if (req.user.role === 'student' && req.user.id !== studentId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      const inventory = await storage.getStudentInventory(studentId, classroomId);
      res.json(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  // Trading System Endpoints
  
  // Create a new trade offer
  app.post('/api/trades/offers', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can create trade offers' });
      }

      const offerData = insertTradeOfferSchema.parse(req.body);
      
      // Verify the student owns the offered inventory item
      const inventoryItem = await storage.getInventoryItem(offerData.offeredInventoryId);
      if (!inventoryItem || inventoryItem.studentId !== req.user.id) {
        return res.status(403).json({ error: 'You do not own this item' });
      }

      // Check if item is already being traded
      if (inventoryItem.status !== 'owned') {
        return res.status(400).json({ error: 'Item is not available for trading' });
      }

      const offer = await storage.createTradeOffer({
        ...offerData,
        offeringStudentId: req.user.id,
        status: 'open'
      });

      // Mark inventory item as being traded
      await storage.updateInventoryItem(offerData.offeredInventoryId, { status: 'trading' });

      res.json(offer);
    } catch (error: any) {
      console.error('Error creating trade offer:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid trade offer data', errors: error.errors });
      }
      res.status(500).json({ error: 'Failed to create trade offer' });
    }
  });

  // Get trade offers for a classroom
  app.get('/api/trades/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const { status = 'open' } = req.query;
      
      const offers = await storage.getTradeOffersByClassroom(classroomId, status);
      res.json(offers);
    } catch (error) {
      console.error('Error fetching trade offers:', error);
      res.status(500).json({ error: 'Failed to fetch trade offers' });
    }
  });

  // Get student's own trade offers
  app.get('/api/trades/my-offers', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can view trade offers' });
      }

      const offers = await storage.getMyTradeOffers(req.user.id);
      res.json(offers);
    } catch (error) {
      console.error('Error fetching my trade offers:', error);
      res.status(500).json({ error: 'Failed to fetch your trade offers' });
    }
  });

  // Respond to a trade offer
  app.post('/api/trades/offers/:offerId/respond', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can respond to trade offers' });
      }

      const { offerId } = req.params;
      const responseData = insertTradeResponseSchema.parse(req.body);

      // Get the trade offer
      const offer = await storage.getTradeOffer(offerId);
      if (!offer) {
        return res.status(404).json({ error: 'Trade offer not found' });
      }

      if (offer.status !== 'open') {
        return res.status(400).json({ error: 'This trade offer is no longer available' });
      }

      // Students can't respond to their own offers
      if (offer.offeringStudentId === req.user.id) {
        return res.status(400).json({ error: 'You cannot respond to your own trade offer' });
      }

      // Verify the student owns the offered inventory item
      const inventoryItem = await storage.getInventoryItem(responseData.offeredInventoryId);
      if (!inventoryItem || inventoryItem.studentId !== req.user.id) {
        return res.status(403).json({ error: 'You do not own this item' });
      }

      const response = await storage.createTradeResponse({
        ...responseData,
        tradeOfferId: offerId,
        respondingStudentId: req.user.id,
        status: 'pending'
      });

      res.json(response);
    } catch (error: any) {
      console.error('Error responding to trade offer:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid response data', errors: error.errors });
      }
      res.status(500).json({ error: 'Failed to respond to trade offer' });
    }
  });

  // Accept a trade response (complete the trade)
  app.post('/api/trades/responses/:responseId/accept', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can accept trade responses' });
      }

      const { responseId } = req.params;
      
      // Get the response and verify ownership of the original offer
      const responses = await storage.getTradeResponses(''); // We need the response ID
      const response = responses.find(r => r.id === responseId);
      
      if (!response) {
        return res.status(404).json({ error: 'Trade response not found' });
      }

      const offer = await storage.getTradeOffer(response.tradeOfferId);
      if (!offer || offer.offeringStudentId !== req.user.id) {
        return res.status(403).json({ error: 'You can only accept responses to your own offers' });
      }

      // Complete the trade
      await storage.completeTradeOffer(response.tradeOfferId, responseId);

      res.json({ success: true, message: 'Trade completed successfully' });
    } catch (error) {
      console.error('Error accepting trade response:', error);
      res.status(500).json({ error: 'Failed to complete trade' });
    }
  });

  // Group Buy System Endpoints

  // Create a new group buy
  app.post('/api/group-buys', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can create group buys' });
      }

      const groupBuyData = insertGroupBuySchema.parse(req.body);
      
      const groupBuy = await storage.createGroupBuy({
        ...groupBuyData,
        createdBy: req.user.id,
        currentAmount: 0,
        progress: 0,
        status: 'active'
      });

      res.json(groupBuy);
    } catch (error: any) {
      console.error('Error creating group buy:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid group buy data', errors: error.errors });
      }
      res.status(500).json({ error: 'Failed to create group buy' });
    }
  });

  // Get group buys for a classroom
  app.get('/api/group-buys/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const { status } = req.query;
      
      const groupBuys = await storage.getGroupBuysByClassroom(classroomId, status as string);
      res.json(groupBuys);
    } catch (error) {
      console.error('Error fetching group buys:', error);
      res.status(500).json({ error: 'Failed to fetch group buys' });
    }
  });

  // Contribute to a group buy
  app.post('/api/group-buys/:groupBuyId/contribute', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'student') {
        return res.status(403).json({ error: 'Only students can contribute to group buys' });
      }

      const { groupBuyId } = req.params;
      const contributionData = insertGroupBuyContributionSchema.parse(req.body);

      // Get the group buy
      const groupBuy = await storage.getGroupBuy(groupBuyId);
      if (!groupBuy) {
        return res.status(404).json({ error: 'Group buy not found' });
      }

      if (groupBuy.status !== 'active') {
        return res.status(400).json({ error: 'This group buy is no longer active' });
      }

      // Check if student has enough tokens
      const student = await storage.getUser(req.user.id);
      if (!student || student.tokens < contributionData.amount) {
        return res.status(400).json({ error: 'Not enough tokens' });
      }

      // Create token transaction (deduction)
      // For now, we'll just create the contribution
      const contribution = await storage.createGroupBuyContribution({
        ...contributionData,
        groupBuyId,
        studentId: req.user.id
      });

      // Deduct tokens from student
      await storage.updateUserTokens(req.user.id, student.tokens - contributionData.amount);

      // Update group buy progress
      await storage.updateGroupBuyProgress(groupBuyId);

      res.json(contribution);
    } catch (error: any) {
      console.error('Error contributing to group buy:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: 'Invalid contribution data', errors: error.errors });
      }
      res.status(500).json({ error: 'Failed to contribute to group buy' });
    }
  });

  // Get group buy templates
  app.get('/api/group-buy-templates', authenticate, async (req: any, res) => {
    try {
      const { category } = req.query;
      
      const templates = await storage.getGroupBuyTemplates(category as string);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching group buy templates:', error);
      res.status(500).json({ error: 'Failed to fetch templates' });
    }
  });

  // Seed group buy templates (for development/testing)
  app.post('/api/group-buy-templates/seed', authenticate, async (req: any, res) => {
    try {
      if (req.user.role !== 'teacher') {
        return res.status(403).json({ error: 'Only teachers can seed templates' });
      }

      const templates = [
        {
          title: 'Class Pizza Party',
          description: 'A fun pizza party for the entire class! Everyone contributes to make it happen.',
          category: 'Class Parties & Events',
          targetAmount: 250,
          durationDays: 14,
          imageUrl: '🍕',
          tags: ['party', 'food', 'celebration']
        },
        {
          title: 'Educational Field Trip',
          description: 'Visit a science museum or educational center. Let\'s explore and learn together!',
          category: 'Educational Rewards',
          targetAmount: 400,
          durationDays: 30,
          imageUrl: '🏛️',
          tags: ['field-trip', 'education', 'learning']
        },
        {
          title: 'Class Tablet for Learning',
          description: 'A shared tablet for educational apps, research, and interactive learning activities.',
          category: 'Technology & Equipment',
          targetAmount: 300,
          durationDays: 21,
          imageUrl: '📱',
          tags: ['technology', 'learning', 'tablet']
        },
        {
          title: 'Cozy Reading Corner',
          description: 'Bean bags, cushions, and decorations to create a comfortable reading space.',
          category: 'Class Improvements',
          targetAmount: 180,
          durationDays: 14,
          imageUrl: '📚',
          tags: ['reading', 'comfort', 'classroom']
        },
        {
          title: 'Extra Recess Time',
          description: 'Earn an extra 15 minutes of recess for the whole class!',
          category: 'Special Privileges',
          targetAmount: 150,
          durationDays: 7,
          imageUrl: '⏰',
          tags: ['recess', 'time', 'privilege']
        },
        {
          title: 'Movie Day with Popcorn',
          description: 'Watch an educational movie with popcorn and snacks for everyone!',
          category: 'Class Parties & Events',
          targetAmount: 120,
          durationDays: 10,
          imageUrl: '🍿',
          tags: ['movie', 'snacks', 'entertainment']
        },
        {
          title: 'Class Pet Fish',
          description: 'A beautiful aquarium with fish to learn about aquatic life and responsibility.',
          category: 'Educational Rewards',
          targetAmount: 200,
          durationDays: 28,
          imageUrl: '🐠',
          tags: ['pet', 'responsibility', 'science']
        },
        {
          title: 'Interactive Whiteboard',
          description: 'Digital whiteboard for interactive lessons and student presentations.',
          category: 'Technology & Equipment',
          targetAmount: 500,
          durationDays: 45,
          imageUrl: '📋',
          tags: ['whiteboard', 'presentations', 'interactive']
        },
        {
          title: 'Class Art Supplies',
          description: 'High-quality art supplies for creative projects and artistic expression.',
          category: 'Class Improvements',
          targetAmount: 80,
          durationDays: 10,
          imageUrl: '🎨',
          tags: ['art', 'creativity', 'supplies']
        },
        {
          title: 'Homework Free Weekend',
          description: 'Earn a weekend with no homework assignments for the entire class!',
          category: 'Special Privileges',
          targetAmount: 200,
          durationDays: 14,
          imageUrl: '📝',
          tags: ['homework', 'weekend', 'break']
        }
      ];

      const createdTemplates = [];
      for (const template of templates) {
        const created = await storage.createGroupBuyTemplate(template);
        createdTemplates.push(created);
      }

      res.json({ 
        success: true, 
        count: createdTemplates.length,
        templates: createdTemplates 
      });
    } catch (error) {
      console.error('Error seeding group buy templates:', error);
      res.status(500).json({ error: 'Failed to seed templates' });
    }
  });

  // Student purchases endpoint 
  app.get('/api/students/:studentId/purchases', authenticate, async (req: any, res) => {
    try {
      if (req.user.id !== req.params.studentId && req.user.role !== 'teacher') {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // For now, return empty array since we don't have purchase storage implemented yet
      // TODO: Implement purchase history storage
      res.json([]);
    } catch (error) {
      console.error("Get student purchases error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // PHASE 2A: ASSIGNMENT MANAGEMENT SYSTEM
  
  // Assignment Management for Teachers - Duplicate endpoint removed

  // Get assignments for a classroom (legacy endpoint)
  app.get('/api/assignments/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const { status, category, visibleToStudents } = req.query;
      
      const filters = {
        status: status as string | undefined,
        category: category as string | undefined,
        visibleToStudents: visibleToStudents === 'true' ? true : visibleToStudents === 'false' ? false : undefined
      };
      
      const assignments = await storage.getAssignmentsByClassroom(classroomId);
      res.json({ assignments });
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  });

  // Get assignments for a classroom (new endpoint format)
  app.get('/api/assignments/classroom/:classroomId', authenticate, async (req: any, res) => {
    try {
      const { classroomId } = req.params;
      const { status, category, visibleToStudents } = req.query;
      
      const filters = {
        status: status as string | undefined,
        category: category as string | undefined,
        visibleToStudents: visibleToStudents === 'true' ? true : visibleToStudents === 'false' ? false : undefined
      };
      
      const assignments = await storage.getAssignmentsByClassroom(classroomId);
      res.json(assignments);
    } catch (error) {
      console.error('Get assignments error:', error);
      res.status(500).json({ message: 'Failed to fetch assignments' });
    }
  });

  // Get all assignments - general endpoint
  app.get('/api/assignments', authenticate, async (req: any, res) => {
    try {
      if (req.user.role === 'teacher') {
        // For teachers, get all assignments across their classrooms
        const classrooms = await storage.getClassroomsByTeacher(req.user.id);
        const allAssignments = [];
        for (const classroom of classrooms) {
          const assignments = await storage.getAssignmentsByClassroom(classroom.id);
          allAssignments.push(...assignments);
        }
        res.json(allAssignments);
      } else {
        // For students, get assignments from their classrooms
        const studentClassrooms = await storage.getStudentClassrooms(req.user.id);
        const allAssignments = [];
        for (const sc of studentClassrooms) {
          const assignments = await storage.getAssignmentsByClassroom(sc.classroomId);
          allAssignments.push(...assignments);
        }
        res.json(allAssignments);
      }
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
      
      const submission = await storage.createAdvancedSubmission({
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

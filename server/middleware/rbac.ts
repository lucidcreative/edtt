import type { Request, Response, NextFunction } from "express";
import { storage } from "../storage";
import { db } from "../db";
import { classrooms, assignments, submissions } from "@shared/schema";
import { eq, and } from "drizzle-orm";

interface AuthenticatedRequest extends Request {
  user: any;
}

// Role-based access control middleware
export const requireRole = (requiredRole: 'teacher' | 'student' | 'admin') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        message: `Access denied. ${requiredRole} role required.` 
      });
    }

    next();
  };
};

// Multiple role access control
export const requireAnyRole = (allowedRoles: ('teacher' | 'student' | 'admin')[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. One of these roles required: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Classroom ownership middleware
export const requireClassroomOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const classroomId = req.params.classroomId;
    if (!classroomId) {
      return res.status(400).json({ message: "Classroom ID required" });
    }

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId)
    });

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (classroom.teacherId !== req.user.id) {
      return res.status(403).json({ 
        message: "Access denied. You don't own this classroom." 
      });
    }

    // Attach classroom to request for efficiency
    (req as any).classroom = classroom;
    next();
  } catch (error) {
    console.error("Classroom ownership check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Classroom access middleware (teacher owns OR student is enrolled)
export const requireClassroomAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const classroomId = req.params.classroomId;
    if (!classroomId) {
      return res.status(400).json({ message: "Classroom ID required" });
    }

    const classroom = await db.query.classrooms.findFirst({
      where: eq(classrooms.id, classroomId)
    });

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    // Teacher owns the classroom
    if (req.user.role === 'teacher' && classroom.teacherId === req.user.id) {
      (req as any).classroom = classroom;
      (req as any).accessType = 'owner';
      return next();
    }

    // Student has access to the classroom (check via storage)
    if (req.user.role === 'student') {
      const hasAccess = await storage.isStudentEnrolledInClassroom(req.user.id, classroomId);
      
      if (hasAccess) {
        (req as any).classroom = classroom;
        (req as any).accessType = 'enrolled';
        return next();
      }
    }

    return res.status(403).json({ 
      message: "Access denied. You don't have access to this classroom." 
    });
  } catch (error) {
    console.error("Classroom access check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Assignment ownership middleware
export const requireAssignmentOwnership = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const assignmentId = req.params.assignmentId || req.params.id;
    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID required" });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
      with: {
        classroom: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    if (assignment.classroom.teacherId !== req.user.id) {
      return res.status(403).json({ 
        message: "Access denied. You don't own this assignment." 
      });
    }

    (req as any).assignment = assignment;
    next();
  } catch (error) {
    console.error("Assignment ownership check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Assignment access middleware (teacher owns OR student has access to classroom)
export const requireAssignmentAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const assignmentId = req.params.assignmentId || req.params.id;
    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID required" });
    }

    const assignment = await db.query.assignments.findFirst({
      where: eq(assignments.id, assignmentId),
      with: {
        classroom: true
      }
    });

    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Teacher owns the assignment
    if (req.user.role === 'teacher' && assignment.classroom.teacherId === req.user.id) {
      (req as any).assignment = assignment;
      (req as any).accessType = 'owner';
      return next();
    }

    // Student has access to the assignment's classroom
    if (req.user.role === 'student') {
      const hasAccess = await storage.isStudentEnrolledInClassroom(req.user.id, assignment.classroomId);
      
      if (hasAccess) {
        (req as any).assignment = assignment;
        (req as any).accessType = 'student';
        return next();
      }
    }

    return res.status(403).json({ 
      message: "Access denied. You don't have access to this assignment." 
    });
  } catch (error) {
    console.error("Assignment access check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Submission ownership middleware (student owns the submission OR teacher owns the assignment)
export const requireSubmissionAccess = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const submissionId = req.params.submissionId || req.params.id;
    if (!submissionId) {
      return res.status(400).json({ message: "Submission ID required" });
    }

    const submission = await db.query.submissions.findFirst({
      where: eq(submissions.id, submissionId),
      with: {
        assignment: {
          with: {
            classroom: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Student owns the submission
    if (req.user.role === 'student' && submission.studentId === req.user.id) {
      (req as any).submission = submission;
      (req as any).accessType = 'owner';
      return next();
    }

    // Teacher owns the assignment
    if (req.user.role === 'teacher' && submission.assignment.classroom.teacherId === req.user.id) {
      (req as any).submission = submission;
      (req as any).accessType = 'teacher';
      return next();
    }

    return res.status(403).json({ 
      message: "Access denied. You don't have access to this submission." 
    });
  } catch (error) {
    console.error("Submission access check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// Token operation middleware (prevent students from awarding tokens to themselves)
export const requireTokenAuthority = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const body = req.body || {};
    const { studentId, targetUserId } = body;
    const targetId = studentId || targetUserId;

    if (!targetId) {
      return res.status(400).json({ message: "Student ID required for token operations" });
    }

    // Teachers can award tokens to any student in their classrooms
    if (req.user.role === 'teacher') {
      // Verify the student is in one of the teacher's classrooms
      const teacherClassrooms = await storage.getTeacherClassrooms(req.user.id);
      
      for (const classroom of teacherClassrooms) {
        const hasStudent = await storage.isStudentEnrolledInClassroom(targetId, classroom.id);
        if (hasStudent) {
          return next();
        }
      }

      return res.status(403).json({ 
        message: "Access denied. Student is not in your classroom." 
      });
    }

    // Students cannot award tokens to others or themselves
    if (req.user.role === 'student') {
      return res.status(403).json({ 
        message: "Access denied. Students cannot award tokens." 
      });
    }

    return res.status(403).json({ message: "Access denied." });
  } catch (error) {
    console.error("Token authority check error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
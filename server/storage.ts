import {
  // Core tables from schema.ts
  users,
  classrooms,
  studentClassrooms,
  classroomEnrollments,
  assignments,
  assignmentResources,
  submissions,
  proposals,
  proposalFeedback,
  proposalNotifications,
  storeItems,
  purchases,
  timeEntries,
  badges,
  studentBadges,
  challenges,
  challengeProgress,
  announcements,
  announcementReads,
  
  // Core types
  type User,
  type InsertUser,
  type Classroom,
  type InsertClassroom,
  type Assignment,
  type InsertAssignment,
  type AssignmentResource,
  type InsertAssignmentResource,
  type Submission,
  type InsertSubmission,
  type Proposal,
  type InsertProposal,
  type ProposalFeedback,
  type InsertProposalFeedback,
  type ProposalNotification,
  type InsertProposalNotification,
  type StoreItem,
  type InsertStoreItem,
  type Purchase,
  type InsertPurchase,
  type TimeEntry,
  type InsertTimeEntry,
  type Badge,
  type InsertBadge,
  type StudentBadge,
  type InsertStudentBadge,
  type Challenge,
  type InsertChallenge,
  type ChallengeProgress,
  type InsertChallengeProgress,
  type Announcement,
  type InsertAnnouncement,
  type AnnouncementRead,
  type InsertAnnouncementRead
} from "@shared/schema";

import { db } from "./db";
import { eq, desc, asc, and, or, ne, sql, count } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByNickname(nickname: string, classroomId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User>;
  updateUserTokens(id: string, tokens: number): Promise<User>;
  
  // Classroom operations
  getClassroom(id: string): Promise<Classroom | undefined>;
  getClassroomByCode(code: string): Promise<Classroom | undefined>;
  getClassroomsByTeacher(teacherId: string): Promise<Classroom[]>;
  createClassroom(classroom: InsertClassroom): Promise<Classroom>;
  updateClassroom(id: string, updates: Partial<InsertClassroom>): Promise<Classroom>;
  
  // Student-Classroom operations
  getClassroomStudents(classroomId: string): Promise<User[]>;
  getStudentClassrooms(studentId: string): Promise<Classroom[]>;
  
  // Assignment operations
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAssignmentsByClassroom(classroomId: string): Promise<Assignment[]>;
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment>;
  
  // Assignment Resource operations
  getAssignmentResources(assignmentId: string): Promise<AssignmentResource[]>;
  createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource>;
  updateAssignmentResource(id: string, updates: Partial<InsertAssignmentResource>): Promise<AssignmentResource>;
  deleteAssignmentResource(id: string): Promise<void>;
  
  // Submission operations
  getSubmission(id: string): Promise<Submission | undefined>;
  getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]>;
  getSubmissionsByStudent(studentId: string): Promise<Submission[]>;
  createSubmission(submission: InsertSubmission): Promise<Submission>;
  updateSubmission(id: string, updates: Partial<Omit<InsertSubmission, 'status'>> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<Submission>;

  // Enhanced Proposal operations
  createProposal(proposal: InsertProposal): Promise<Proposal>;
  getProposalsByAssignment(assignmentId: string): Promise<any[]>;
  getProposalsByClassroom(classroomId: string): Promise<any[]>;
  getProposalsByStudent(studentId: string): Promise<Proposal[]>;
  getProposal(proposalId: string): Promise<Proposal | undefined>;
  updateProposal(proposalId: string, updates: Partial<InsertProposal>): Promise<Proposal>;
  updateProposalStatus(proposalId: string, status: Proposal['status'], reviewData?: any): Promise<Proposal>;
  approveProposal(proposalId: string, feedback?: string): Promise<void>;
  rejectProposal(proposalId: string, feedback?: string): Promise<void>;
  requestProposalRevision(proposalId: string, feedback: string): Promise<void>;
  updateProposalProgress(proposalId: string, progressPercentage: number, completedMilestones?: string[]): Promise<Proposal>;
  
  // Proposal Feedback operations
  createProposalFeedback(feedback: InsertProposalFeedback): Promise<ProposalFeedback>;
  getProposalFeedback(proposalId: string): Promise<any[]>;
  
  // Proposal Notifications operations
  createProposalNotification(notification: InsertProposalNotification): Promise<ProposalNotification>;
  getProposalNotifications(userId: string, unreadOnly?: boolean): Promise<ProposalNotification[]>;
  markNotificationAsRead(notificationId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByNickname(nickname: string, classroomId: string): Promise<User | undefined> {
    // Get students from this classroom with the specified nickname
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(and(
        eq(users.nickname, nickname),
        eq(studentClassrooms.classroomId, classroomId),
        eq(users.role, 'student')
      ))
      .limit(1);
    
    return result[0]?.user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values([user]).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async updateUserTokens(id: string, tokens: number): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ tokens, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Classroom operations
  async getClassroom(id: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.id, id));
    return classroom;
  }

  async getClassroomByCode(code: string): Promise<Classroom | undefined> {
    const [classroom] = await db.select().from(classrooms).where(eq(classrooms.joinCode, code));
    return classroom;
  }

  async getClassroomsByTeacher(teacherId: string): Promise<Classroom[]> {
    return db.select().from(classrooms).where(eq(classrooms.teacherId, teacherId));
  }

  async createClassroom(classroom: InsertClassroom): Promise<Classroom> {
    const [newClassroom] = await db.insert(classrooms).values([classroom]).returning();
    return newClassroom;
  }

  async updateClassroom(id: string, updates: Partial<InsertClassroom>): Promise<Classroom> {
    const [updatedClassroom] = await db
      .update(classrooms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(classrooms.id, id))
      .returning();
    return updatedClassroom;
  }

  // Student-Classroom operations
  async getClassroomStudents(classroomId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(users)
      .innerJoin(studentClassrooms, eq(users.id, studentClassrooms.studentId))
      .where(eq(studentClassrooms.classroomId, classroomId));
    
    return result.map(row => row.user);
  }

  async getStudentClassrooms(studentId: string): Promise<Classroom[]> {
    const result = await db
      .select({ classroom: classrooms })
      .from(classrooms)
      .innerJoin(studentClassrooms, eq(classrooms.id, studentClassrooms.classroomId))
      .where(eq(studentClassrooms.studentId, studentId));
    
    return result.map(row => row.classroom);
  }

  // Assignment operations
  async getAssignment(id: string): Promise<Assignment | undefined> {
    const [assignment] = await db.select().from(assignments).where(eq(assignments.id, id));
    return assignment;
  }

  async getAssignmentsByClassroom(classroomId: string): Promise<Assignment[]> {
    return db
      .select()
      .from(assignments)
      .where(eq(assignments.classroomId, classroomId))
      .orderBy(desc(assignments.createdAt));
  }

  async createAssignment(assignment: InsertAssignment): Promise<Assignment> {
    const [newAssignment] = await db.insert(assignments).values([assignment]).returning();
    return newAssignment;
  }

  async updateAssignment(id: string, updates: Partial<InsertAssignment>): Promise<Assignment> {
    const [updatedAssignment] = await db
      .update(assignments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignments.id, id))
      .returning();
    return updatedAssignment;
  }

  // Assignment Resource operations
  async getAssignmentResources(assignmentId: string): Promise<AssignmentResource[]> {
    return db
      .select()
      .from(assignmentResources)
      .where(and(
        eq(assignmentResources.assignmentId, assignmentId),
        eq(assignmentResources.isActive, true)
      ))
      .orderBy(assignmentResources.displayOrder, assignmentResources.createdAt);
  }

  async createAssignmentResource(resource: InsertAssignmentResource): Promise<AssignmentResource> {
    const [newResource] = await db.insert(assignmentResources).values([resource]).returning();
    return newResource;
  }

  async updateAssignmentResource(id: string, updates: Partial<InsertAssignmentResource>): Promise<AssignmentResource> {
    const [updatedResource] = await db
      .update(assignmentResources)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(assignmentResources.id, id))
      .returning();
    return updatedResource;
  }

  async deleteAssignmentResource(id: string): Promise<void> {
    await db
      .update(assignmentResources)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(assignmentResources.id, id));
  }

  // Submission operations
  async getSubmission(id: string): Promise<Submission | undefined> {
    const [submission] = await db.select().from(submissions).where(eq(submissions.id, id));
    return submission;
  }

  async getSubmissionsByAssignment(assignmentId: string): Promise<Submission[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.assignmentId, assignmentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async getSubmissionsByStudent(studentId: string): Promise<Submission[]> {
    return db
      .select()
      .from(submissions)
      .where(eq(submissions.studentId, studentId))
      .orderBy(desc(submissions.submittedAt));
  }

  async createSubmission(submission: InsertSubmission): Promise<Submission> {
    const [newSubmission] = await db.insert(submissions).values([submission]).returning();
    return newSubmission;
  }

  async updateSubmission(id: string, updates: Partial<Omit<InsertSubmission, 'status'>> & { status?: 'pending' | 'approved' | 'rejected' }): Promise<Submission> {
    const [updatedSubmission] = await db
      .update(submissions)
      .set(updates)
      .where(eq(submissions.id, id))
      .returning();
    return updatedSubmission;
  }

  // Enhanced Proposal operations for comprehensive special projects management
  async createProposal(proposal: InsertProposal): Promise<Proposal> {
    const [newProposal] = await db.insert(proposals).values([proposal]).returning();
    return newProposal;
  }

  async getProposalsByAssignment(assignmentId: string): Promise<(Proposal & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'> })[]> {
    const result = await db
      .select({
        proposal: proposals,
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(proposals)
      .innerJoin(users, eq(proposals.studentId, users.id))
      .where(eq(proposals.assignmentId, assignmentId))
      .orderBy(desc(proposals.createdAt));
    
    return result.map(row => ({
      ...row.proposal,
      student: row.student
    }));
  }

  async getProposalsByClassroom(classroomId: string): Promise<(Proposal & { student: Pick<User, 'id' | 'nickname' | 'firstName' | 'lastName'>, assignment: Pick<Assignment, 'id' | 'title'> })[]> {
    const result = await db
      .select({
        proposal: proposals,
        student: {
          id: users.id,
          nickname: users.nickname,
          firstName: users.firstName,
          lastName: users.lastName
        },
        assignment: {
          id: assignments.id,
          title: assignments.title
        }
      })
      .from(proposals)
      .innerJoin(users, eq(proposals.studentId, users.id))
      .innerJoin(assignments, eq(proposals.assignmentId, assignments.id))
      .where(eq(proposals.classroomId, classroomId))
      .orderBy(desc(proposals.createdAt));
    
    return result.map(row => ({
      ...row.proposal,
      student: row.student,
      assignment: row.assignment
    }));
  }

  async getProposalsByStudent(studentId: string): Promise<Proposal[]> {
    return db
      .select()
      .from(proposals)
      .where(eq(proposals.studentId, studentId))
      .orderBy(desc(proposals.createdAt));
  }

  async getProposal(proposalId: string): Promise<Proposal | undefined> {
    const result = await db
      .select()
      .from(proposals)
      .where(eq(proposals.id, proposalId))
      .limit(1);
    
    return result[0];
  }

  async updateProposal(proposalId: string, updates: Partial<InsertProposal>): Promise<Proposal> {
    const [updatedProposal] = await db
      .update(proposals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  async updateProposalStatus(proposalId: string, status: Proposal['status'], reviewData?: { teacherFeedback?: string; internalNotes?: string }): Promise<Proposal> {
    const updateData: any = { 
      status, 
      updatedAt: new Date(),
      reviewedAt: new Date()
    };
    
    if (reviewData?.teacherFeedback) updateData.teacherFeedback = reviewData.teacherFeedback;
    if (reviewData?.internalNotes) updateData.internalNotes = reviewData.internalNotes;
    if (status === 'approved') updateData.approvedAt = new Date();
    if (status === 'needs_revision') {
      updateData.revisionCount = sql`${proposals.revisionCount} + 1`;
      updateData.lastRevisionDate = new Date();
    }

    const [updatedProposal] = await db
      .update(proposals)
      .set(updateData)
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  async approveProposal(proposalId: string, feedback?: string): Promise<void> {
    await this.updateProposalStatus(proposalId, 'approved', { teacherFeedback: feedback });
  }

  async rejectProposal(proposalId: string, feedback?: string): Promise<void> {
    await this.updateProposalStatus(proposalId, 'rejected', { teacherFeedback: feedback });
  }

  async requestProposalRevision(proposalId: string, feedback: string): Promise<void> {
    await this.updateProposalStatus(proposalId, 'needs_revision', { teacherFeedback: feedback });
  }

  async updateProposalProgress(proposalId: string, progressPercentage: number, completedMilestones?: string[]): Promise<Proposal> {
    const updateData: any = { 
      progressPercentage, 
      updatedAt: new Date() 
    };
    
    if (completedMilestones) updateData.completedMilestones = completedMilestones;
    if (progressPercentage >= 100) updateData.status = 'completed';

    const [updatedProposal] = await db
      .update(proposals)
      .set(updateData)
      .where(eq(proposals.id, proposalId))
      .returning();
    return updatedProposal;
  }

  // Proposal Feedback operations
  async createProposalFeedback(feedback: InsertProposalFeedback): Promise<ProposalFeedback> {
    const [newFeedback] = await db.insert(proposalFeedback).values([feedback]).returning();
    return newFeedback;
  }

  async getProposalFeedback(proposalId: string): Promise<(ProposalFeedback & { fromUser: Pick<User, 'id' | 'firstName' | 'lastName' | 'nickname'> })[]> {
    const result = await db
      .select({
        feedback: proposalFeedback,
        fromUser: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          nickname: users.nickname
        }
      })
      .from(proposalFeedback)
      .innerJoin(users, eq(proposalFeedback.fromUserId, users.id))
      .where(eq(proposalFeedback.proposalId, proposalId))
      .orderBy(desc(proposalFeedback.createdAt));
    
    return result.map(row => ({
      ...row.feedback,
      fromUser: row.fromUser
    }));
  }

  // Proposal Notifications operations
  async createProposalNotification(notification: InsertProposalNotification): Promise<ProposalNotification> {
    const [newNotification] = await db.insert(proposalNotifications).values([notification]).returning();
    return newNotification;
  }

  async getProposalNotifications(userId: string, unreadOnly: boolean = false): Promise<ProposalNotification[]> {
    let query = db
      .select()
      .from(proposalNotifications)
      .where(eq(proposalNotifications.userId, userId));

    if (unreadOnly) {
      query = query.where(eq(proposalNotifications.isRead, false));
    }

    return query.orderBy(desc(proposalNotifications.createdAt));
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    await db
      .update(proposalNotifications)
      .set({ isRead: true, readAt: new Date() })
      .where(eq(proposalNotifications.id, notificationId));
  }
}

export const storage = new DatabaseStorage();
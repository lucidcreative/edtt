import { db } from './db';
import { eq, and, sql, desc, count, gte } from 'drizzle-orm';
import { timeSessions, sessionHeartbeats, users, auditLogs } from '../shared/schema';
import crypto from 'crypto';

export class TimeTrackingService {
  private readonly MAX_DAILY_HOURS = 8;
  private readonly MIN_SESSION_MINUTES = 5;
  private readonly HEARTBEAT_TIMEOUT_MINUTES = 5;
  private readonly MAX_IDLE_MINUTES = 15;

  // Generate browser fingerprint hash
  private generateFingerprintHash(userAgent: string, ipAddress: string, additionalData?: any): string {
    const fingerprint = {
      userAgent,
      ipAddress,
      ...additionalData
    };
    return crypto.createHash('sha256').update(JSON.stringify(fingerprint)).digest('hex');
  }

  // Generate user agent hash for privacy
  private generateUserAgentHash(userAgent: string): string {
    return crypto.createHash('sha256').update(userAgent).digest('hex');
  }

  // Check if student can start a new session
  async canStartSession(studentId: string, classroomId: string): Promise<{
    canStart: boolean;
    reason?: string;
    hoursToday?: number;
    activeSession?: any;
  }> {
    // Check for active sessions
    const activeSessions = await db
      .select()
      .from(timeSessions)
      .where(and(
        eq(timeSessions.studentId, studentId),
        eq(timeSessions.status, 'active')
      ));

    if (activeSessions.length > 0) {
      return {
        canStart: false,
        reason: 'Student already has an active session',
        activeSession: activeSessions[0]
      };
    }

    // Check daily hours limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysSessions = await db
      .select({
        totalMinutes: sql<number>`COALESCE(SUM(${timeSessions.duration}), 0)`
      })
      .from(timeSessions)
      .where(and(
        eq(timeSessions.studentId, studentId),
        eq(timeSessions.classroomId, classroomId),
        gte(timeSessions.startTime, today),
        eq(timeSessions.status, 'completed')
      ));

    const hoursToday = (todaysSessions[0]?.totalMinutes || 0) / 60;

    if (hoursToday >= this.MAX_DAILY_HOURS) {
      return {
        canStart: false,
        reason: `Daily limit of ${this.MAX_DAILY_HOURS} hours reached`,
        hoursToday
      };
    }

    return {
      canStart: true,
      hoursToday
    };
  }

  // Start a new time tracking session
  async startSession(
    studentId: string, 
    classroomId: string, 
    ipAddress: string, 
    userAgent: string,
    metadata?: any
  ): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const canStart = await this.canStartSession(studentId, classroomId);
    
    if (!canStart.canStart) {
      return { success: false, error: canStart.reason };
    }

    const userAgentHash = this.generateUserAgentHash(userAgent);
    const fingerprintHash = this.generateFingerprintHash(userAgent, ipAddress, metadata);

    try {
      const [session] = await db
        .insert(timeSessions)
        .values({
          studentId,
          classroomId,
          startTime: new Date(),
          status: 'active',
          ipAddress,
          userAgentHash,
          fingerprintHash,
          lastHeartbeat: new Date()
        })
        .returning();

      // Log the action
      await db.insert(auditLogs).values({
        userId: studentId,
        classroomId,
        action: 'time_session_start',
        entityType: 'time_session',
        entityId: session.id,
        metadata: { ipAddress, userAgentHash },
        ipAddress,
        userAgent
      });

      return { success: true, sessionId: session.id };
    } catch (error) {
      return { success: false, error: 'Failed to start session' };
    }
  }

  // Update session heartbeat
  async updateHeartbeat(
    sessionId: string, 
    activity: 'click' | 'keypress' | 'focus' | 'blur' | 'scroll',
    metadata?: any
  ): Promise<{ success: boolean; warning?: string }> {
    const now = new Date();

    // Update session heartbeat
    await db
      .update(timeSessions)
      .set({ 
        lastHeartbeat: now,
        updatedAt: now
      })
      .where(eq(timeSessions.id, sessionId));

    // Record heartbeat
    await db.insert(sessionHeartbeats).values({
      sessionId,
      timestamp: now,
      activity,
      metadata: metadata || {}
    });

    // Check for idle time
    const session = await db
      .select()
      .from(timeSessions)
      .where(eq(timeSessions.id, sessionId))
      .limit(1);

    if (session[0]) {
      const timeSinceLastHeartbeat = now.getTime() - session[0].lastHeartbeat.getTime();
      const idleMinutes = timeSinceLastHeartbeat / (1000 * 60);

      if (idleMinutes > this.MAX_IDLE_MINUTES) {
        return {
          success: true,
          warning: `Session has been idle for ${Math.round(idleMinutes)} minutes`
        };
      }
    }

    return { success: true };
  }

  // End session
  async endSession(
    sessionId: string, 
    endReason: 'manual' | 'timeout' | 'idle' | 'daily_limit' | 'admin',
    terminatedBy?: string
  ): Promise<{ success: boolean; duration?: number; tokensEarned?: number; error?: string }> {
    const session = await db
      .select()
      .from(timeSessions)
      .where(eq(timeSessions.id, sessionId))
      .limit(1);

    if (!session[0]) {
      return { success: false, error: 'Session not found' };
    }

    const endTime = new Date();
    const startTime = new Date(session[0].startTime);
    const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    // Calculate idle time from heartbeats
    const heartbeats = await db
      .select()
      .from(sessionHeartbeats)
      .where(eq(sessionHeartbeats.sessionId, sessionId))
      .orderBy(desc(sessionHeartbeats.timestamp));

    let idleTime = 0;
    let lastActivity = startTime;

    for (const beat of heartbeats.reverse()) {
      const gap = beat.timestamp.getTime() - lastActivity.getTime();
      if (gap > this.HEARTBEAT_TIMEOUT_MINUTES * 60 * 1000) {
        idleTime += Math.floor(gap / (1000 * 60)) - this.HEARTBEAT_TIMEOUT_MINUTES;
      }
      lastActivity = beat.timestamp;
    }

    // Check if session meets minimum duration
    const effectiveMinutes = Math.max(0, durationMinutes - idleTime);
    const status = effectiveMinutes >= this.MIN_SESSION_MINUTES ? 'completed' : 'abandoned';

    // Calculate tokens earned (simplified - 1 token per 15 minutes)
    const tokensEarned = status === 'completed' ? Math.floor(effectiveMinutes / 15) : 0;

    try {
      await db
        .update(timeSessions)
        .set({
          endTime,
          duration: durationMinutes,
          idleTime,
          status,
          tokensEarned,
          terminatedBy,
          terminationReason: endReason,
          updatedAt: new Date()
        })
        .where(eq(timeSessions.id, sessionId));

      // Log the action
      await db.insert(auditLogs).values({
        userId: session[0].studentId,
        classroomId: session[0].classroomId,
        action: 'time_session_end',
        entityType: 'time_session',
        entityId: sessionId,
        metadata: { 
          endReason, 
          durationMinutes, 
          idleTime, 
          tokensEarned,
          status
        },
        ipAddress: session[0].ipAddress
      });

      return { 
        success: true, 
        duration: effectiveMinutes, 
        tokensEarned 
      };
    } catch (error) {
      return { success: false, error: 'Failed to end session' };
    }
  }

  // Get active session for student
  async getActiveSession(studentId: string): Promise<any> {
    const [session] = await db
      .select()
      .from(timeSessions)
      .where(and(
        eq(timeSessions.studentId, studentId),
        eq(timeSessions.status, 'active')
      ))
      .limit(1);

    return session || null;
  }

  // Check for abandoned sessions and clean them up
  async cleanupAbandonedSessions(): Promise<number> {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - this.HEARTBEAT_TIMEOUT_MINUTES * 2);

    const abandonedSessions = await db
      .select()
      .from(timeSessions)
      .where(and(
        eq(timeSessions.status, 'active'),
        sql`${timeSessions.lastHeartbeat} < ${cutoffTime}`
      ));

    let cleaned = 0;
    for (const session of abandonedSessions) {
      await this.endSession(session.id, 'timeout');
      cleaned++;
    }

    return cleaned;
  }

  // Detect suspicious activity
  async detectSuspiciousActivity(classroomId: string, hoursBack: number = 24): Promise<any[]> {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);

    // Multiple sessions from same IP but different students
    const ipConflicts = await db
      .select({
        ipAddress: timeSessions.ipAddress,
        studentCount: sql<number>`COUNT(DISTINCT ${timeSessions.studentId})`,
        students: sql<string[]>`array_agg(DISTINCT ${users.username})`
      })
      .from(timeSessions)
      .innerJoin(users, eq(timeSessions.studentId, users.id))
      .where(and(
        eq(timeSessions.classroomId, classroomId),
        gte(timeSessions.startTime, cutoffTime)
      ))
      .groupBy(timeSessions.ipAddress)
      .having(sql`COUNT(DISTINCT ${timeSessions.studentId}) > 1`);

    // Sessions with minimal heartbeats (possible bot activity)
    const suspiciousSessions = await db
      .select({
        sessionId: timeSessions.id,
        studentId: timeSessions.studentId,
        username: users.username,
        duration: timeSessions.duration,
        heartbeatCount: sql<number>`(
          SELECT COUNT(*) FROM ${sessionHeartbeats} 
          WHERE ${sessionHeartbeats.sessionId} = ${timeSessions.id}
        )`
      })
      .from(timeSessions)
      .innerJoin(users, eq(timeSessions.studentId, users.id))
      .where(and(
        eq(timeSessions.classroomId, classroomId),
        gte(timeSessions.startTime, cutoffTime),
        sql`${timeSessions.duration} > 30` // Sessions longer than 30 minutes
      ))
      .having(sql`heartbeat_count < (${timeSessions.duration} / 10)`); // Less than 1 heartbeat per 10 minutes

    return {
      ipConflicts,
      suspiciousSessions
    };
  }
}

export const timeTrackingService = new TimeTrackingService();
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TimeTrackingService } from '../server/timeTracking';

// Mock database
const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  and: vi.fn(),
  eq: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
};

vi.mock('../server/db', () => ({
  db: mockDb,
}));

vi.mock('crypto', () => ({
  default: {
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('mocked-hash'),
    }),
  },
}));

describe('TimeTrackingService', () => {
  let timeTrackingService: TimeTrackingService;

  beforeEach(() => {
    timeTrackingService = new TimeTrackingService();
    vi.clearAllMocks();
  });

  describe('canStartSession', () => {
    it('should allow session start when no active sessions exist', async () => {
      mockDb.select.mockResolvedValueOnce([]); // No active sessions
      mockDb.select.mockResolvedValueOnce([{ totalMinutes: 60 }]); // 1 hour worked today

      const result = await timeTrackingService.canStartSession('student-1', 'classroom-1');

      expect(result.canStart).toBe(true);
      expect(result.hoursToday).toBe(1);
    });

    it('should prevent session start when active session exists', async () => {
      mockDb.select.mockResolvedValueOnce([{ id: 'session-1' }]); // Active session exists

      const result = await timeTrackingService.canStartSession('student-1', 'classroom-1');

      expect(result.canStart).toBe(false);
      expect(result.reason).toBe('Student already has an active session');
    });

    it('should prevent session start when daily limit reached', async () => {
      mockDb.select.mockResolvedValueOnce([]); // No active sessions
      mockDb.select.mockResolvedValueOnce([{ totalMinutes: 480 }]); // 8 hours worked today

      const result = await timeTrackingService.canStartSession('student-1', 'classroom-1');

      expect(result.canStart).toBe(false);
      expect(result.reason).toContain('Daily limit');
    });
  });

  describe('startSession', () => {
    it('should start session when conditions are met', async () => {
      // Mock canStartSession to return true
      vi.spyOn(timeTrackingService, 'canStartSession').mockResolvedValue({
        canStart: true,
        hoursToday: 2,
      });

      mockDb.insert.mockResolvedValueOnce([{ id: 'new-session-id' }]);

      const result = await timeTrackingService.startSession(
        'student-1',
        'classroom-1',
        '192.168.1.1',
        'Mozilla/5.0...'
      );

      expect(result.success).toBe(true);
      expect(result.sessionId).toBe('new-session-id');
      expect(mockDb.insert).toHaveBeenCalledTimes(2); // Session + audit log
    });

    it('should fail when conditions are not met', async () => {
      vi.spyOn(timeTrackingService, 'canStartSession').mockResolvedValue({
        canStart: false,
        reason: 'Daily limit reached',
      });

      const result = await timeTrackingService.startSession(
        'student-1',
        'classroom-1',
        '192.168.1.1',
        'Mozilla/5.0...'
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Daily limit reached');
    });
  });

  describe('endSession', () => {
    it('should calculate duration and tokens correctly', async () => {
      const mockSession = {
        id: 'session-1',
        studentId: 'student-1',
        classroomId: 'classroom-1',
        startTime: new Date('2024-01-15T10:00:00Z'),
        ipAddress: '192.168.1.1',
      };

      mockDb.select.mockResolvedValueOnce([mockSession]);
      mockDb.select.mockResolvedValueOnce([]); // No heartbeats for simplicity

      const result = await timeTrackingService.endSession('session-1', 'manual');

      expect(result.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled(); // Audit log
    });

    it('should handle abandoned sessions with minimum duration check', async () => {
      const mockSession = {
        id: 'session-1',
        studentId: 'student-1',
        classroomId: 'classroom-1',
        startTime: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        ipAddress: '192.168.1.1',
      };

      mockDb.select.mockResolvedValueOnce([mockSession]);
      mockDb.select.mockResolvedValueOnce([]);

      const result = await timeTrackingService.endSession('session-1', 'timeout');

      expect(result.success).toBe(true);
      // Should be marked as abandoned due to < 5 minutes duration
    });
  });

  describe('updateHeartbeat', () => {
    it('should update session heartbeat successfully', async () => {
      const result = await timeTrackingService.updateHeartbeat('session-1', 'click');

      expect(result.success).toBe(true);
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('should warn about idle sessions', async () => {
      const mockSession = {
        id: 'session-1',
        lastHeartbeat: new Date(Date.now() - 20 * 60 * 1000), // 20 minutes ago
      };

      mockDb.select.mockResolvedValueOnce([mockSession]);

      const result = await timeTrackingService.updateHeartbeat('session-1', 'click');

      expect(result.success).toBe(true);
      expect(result.warning).toContain('idle');
    });
  });
});
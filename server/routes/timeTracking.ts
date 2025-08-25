import { Router } from 'express';
import { db } from '../db';
import { timeTrackingService } from '../timeTracking';
// import { auditLogs } from '../../shared/schema';

const router = Router();

// Time tracking with anti-cheat
router.post('/start', async (req: any, res) => {
  try {
    const { classroomId } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent') || '';
    
    const result = await timeTrackingService.startSession(
      req.user.id,
      classroomId,
      ipAddress,
      userAgent,
      { timestamp: new Date().toISOString() }
    );
    
    if (result.success) {
      // Log audit trail
      await db.insert(auditLogs).values({
        userId: req.user.id,
        classroomId,
        action: 'time_session_start',
        entityType: 'time_session',
        entityId: result.sessionId,
        ipAddress,
        userAgent
      });
      
      res.json({ sessionId: result.sessionId });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Time tracking start error:', error);
    res.status(500).json({ message: 'Failed to start time tracking session' });
  }
});

router.post('/heartbeat', async (req: any, res) => {
  try {
    const { sessionId, activity = 'heartbeat' } = req.body;
    
    const result = await timeTrackingService.updateHeartbeat(sessionId, activity);
    res.json(result);
  } catch (error) {
    console.error('Heartbeat error:', error);
    res.status(500).json({ message: 'Failed to update heartbeat' });
  }
});

router.post('/end', async (req: any, res) => {
  try {
    const { sessionId, reason = 'manual' } = req.body;
    
    const result = await timeTrackingService.endSession(sessionId, reason, req.user.id);
    
    if (result.success) {
      res.json({
        duration: result.duration,
        tokensEarned: result.tokensEarned
      });
    } else {
      res.status(400).json({ message: result.error });
    }
  } catch (error) {
    console.error('Time tracking end error:', error);
    res.status(500).json({ message: 'Failed to end time tracking session' });
  }
});

router.get('/active-session', async (req: any, res) => {
  try {
    const session = await timeTrackingService.getActiveSession(req.user.id);
    res.json(session);
  } catch (error) {
    console.error('Active session error:', error);
    res.status(500).json({ message: 'Failed to fetch active session' });
  }
});

export default router;
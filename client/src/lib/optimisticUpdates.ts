import { queryClient } from './queryClient';

// Optimistic update helpers for common operations
export const optimisticUpdates = {
  // Token award optimistic update
  awardTokens: (studentId: string, amount: number, classroomId: string) => {
    // Update student's token balance
    queryClient.setQueryData(['/api/students', studentId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        tokens: oldData.tokens + amount,
        totalEarnings: (oldData.totalEarnings || 0) + amount
      };
    });

    // Update classroom leaderboard
    queryClient.setQueryData(['/api/classrooms', classroomId, 'leaderboard'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((student: any) => 
        student.id === studentId 
          ? { ...student, tokens: student.tokens + amount }
          : student
      );
    });

    // Update student list in classroom
    queryClient.setQueryData(['/api/classrooms', classroomId, 'students'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((student: any) => 
        student.id === studentId 
          ? { ...student, tokens: student.tokens + amount }
          : student
      );
    });
  },

  // Store purchase optimistic update
  purchaseItem: (studentId: string, itemCost: number, classroomId: string) => {
    // Deduct tokens from student
    queryClient.setQueryData(['/api/students', studentId], (oldData: any) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        tokens: Math.max(0, oldData.tokens - itemCost),
        totalSpent: (oldData.totalSpent || 0) + itemCost
      };
    });

    // Update leaderboard
    queryClient.setQueryData(['/api/classrooms', classroomId, 'leaderboard'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((student: any) => 
        student.id === studentId 
          ? { ...student, tokens: Math.max(0, student.tokens - itemCost) }
          : student
      );
    });
  },

  // Assignment submission optimistic update
  submitAssignment: (assignmentId: string, studentId: string, submissionData: any) => {
    // Add to student's submissions
    queryClient.setQueryData(['/api/students', studentId, 'submissions'], (oldData: any) => {
      if (!oldData) return [submissionData];
      return [submissionData, ...oldData];
    });

    // Update assignment submissions count
    queryClient.setQueryData(['/api/assignments', assignmentId, 'submissions'], (oldData: any) => {
      if (!oldData) return [submissionData];
      return [submissionData, ...oldData];
    });

    // Mark assignment as submitted in student's assignment list
    queryClient.setQueryData(['/api/student/assignments'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.map((assignment: any) => 
        assignment.id === assignmentId 
          ? { ...assignment, submissionStatus: 'submitted', hasSubmission: true }
          : assignment
      );
    });
  },

  // Clock in/out optimistic update
  clockInOut: (studentId: string, isClockingIn: boolean, classroomId: string) => {
    const now = new Date().toISOString();
    
    // Update student's clock status
    queryClient.setQueryData(['/api/students', studentId, 'time-status'], (oldData: any) => {
      return {
        ...oldData,
        isClockedIn: isClockingIn,
        lastClockAction: now,
        currentSessionStart: isClockingIn ? now : null
      };
    });

    // Update classroom active students list
    queryClient.setQueryData(['/api/classrooms', classroomId, 'active-students'], (oldData: any) => {
      if (!oldData) return oldData;
      
      if (isClockingIn) {
        // Add student to active list if not already there
        const isAlreadyActive = oldData.some((s: any) => s.id === studentId);
        if (!isAlreadyActive) {
          return [...oldData, { id: studentId, clockedInAt: now }];
        }
        return oldData;
      } else {
        // Remove student from active list
        return oldData.filter((s: any) => s.id !== studentId);
      }
    });
  },

  // Notification system removed - notifications functionality disabled

  // Assignment creation optimistic update
  createAssignment: (assignmentData: any, classroomId: string) => {
    // Add to classroom assignments
    queryClient.setQueryData(['/api/classrooms', classroomId, 'assignments'], (oldData: any) => {
      if (!oldData) return [assignmentData];
      return [assignmentData, ...oldData];
    });

    // Add to teacher's assignments list
    queryClient.setQueryData(['/api/assignments'], (oldData: any) => {
      if (!oldData) return [assignmentData];
      return [assignmentData, ...oldData];
    });
  },

  // Assignment deletion optimistic update
  deleteAssignment: (assignmentId: string, classroomId: string) => {
    // Remove from classroom assignments
    queryClient.setQueryData(['/api/classrooms', classroomId, 'assignments'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.filter((assignment: any) => assignment.id !== assignmentId);
    });

    // Remove from teacher's assignments list
    queryClient.setQueryData(['/api/assignments'], (oldData: any) => {
      if (!oldData) return oldData;
      return oldData.filter((assignment: any) => assignment.id !== assignmentId);
    });
  },
};

// Rollback helpers for when optimistic updates fail
export const rollbackUpdates = {
  // Generic rollback by invalidating related queries
  invalidateRelated: (keys: string[][]) => {
    keys.forEach(key => {
      queryClient.invalidateQueries({ queryKey: key });
    });
  },

  // Specific rollbacks for complex operations
  tokenAward: (studentId: string, classroomId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'leaderboard'] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'students'] });
  },

  purchase: (studentId: string, classroomId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId] });
    queryClient.invalidateQueries({ queryKey: ['/api/classrooms', classroomId, 'leaderboard'] });
  },

  submission: (assignmentId: string, studentId: string) => {
    queryClient.invalidateQueries({ queryKey: ['/api/students', studentId, 'submissions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/assignments', assignmentId, 'submissions'] });
    queryClient.invalidateQueries({ queryKey: ['/api/student/assignments'] });
  },
};
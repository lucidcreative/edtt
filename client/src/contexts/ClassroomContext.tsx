import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

interface Classroom {
  id: string;
  name: string;
  subject?: string;
  gradeLevel?: string;
  academicYear?: string;
  joinCode?: string;
  teacherId?: string;
  isActive?: boolean;
}

interface ClassroomContextType {
  currentClassroom: Classroom | null;
  classrooms: Classroom[];
  isLoading: boolean;
  setSelectedClassroom: (classroom: Classroom | null) => void;
  refreshClassrooms: () => void;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

  // Get user's classrooms
  const { data: classrooms = [], isLoading, refetch } = useQuery<Classroom[]>({
    queryKey: ["/api/classrooms"],
    enabled: !!user && user.role === 'teacher' // Only for teachers
  });

  // Auto-select first classroom when classrooms load or when no classroom is selected
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classrooms[0]);
    }
  }, [classrooms, selectedClassroom]);

  // Store selected classroom in localStorage for persistence
  useEffect(() => {
    if (selectedClassroom) {
      localStorage.setItem('selectedClassroomId', selectedClassroom.id);
    }
  }, [selectedClassroom]);

  // Restore selected classroom from localStorage on mount
  useEffect(() => {
    const storedClassroomId = localStorage.getItem('selectedClassroomId');
    if (storedClassroomId && classrooms.length > 0) {
      const storedClassroom = classrooms.find(c => c.id === storedClassroomId);
      if (storedClassroom) {
        setSelectedClassroom(storedClassroom);
      }
    }
  }, [classrooms]);

  const refreshClassrooms = () => {
    refetch();
  };

  return (
    <ClassroomContext.Provider value={{
      currentClassroom: selectedClassroom,
      classrooms,
      isLoading,
      setSelectedClassroom,
      refreshClassrooms
    }}>
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (context === undefined) {
    throw new Error('useClassroom must be used within a ClassroomProvider');
  }
  return context;
}
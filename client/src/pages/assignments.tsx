import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useClassroom } from "@/contexts/ClassroomContext";
import StudentAssignments from "@/components/student/student-assignments";

// Custom hooks
import { useAssignments, useAssignmentMutations } from "@/hooks/useAssignments";

// Broken-down components
import { AssignmentFilters } from "@/components/assignments/AssignmentFilters";
import { AssignmentGrid } from "@/components/assignments/AssignmentGrid";
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog";
import { AssignmentCreator } from "@/components/teacher/assignment-creator";

export default function Assignments() {
  const { user } = useAuth();
  const { currentClassroom } = useClassroom();
  
  // Show student assignments view for students
  if (user?.role === 'student') {
    return <StudentAssignments />;
  }
  
  // State management
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [deletingIds, setDeletingIds] = useState<string[]>([]);
  const [showAdvancedCreator, setShowAdvancedCreator] = useState(false);
  
  // Use custom hooks
  const { data: assignments, isLoading } = useAssignments();
  const { createMutation, updateMutation, deleteMutation } = useAssignmentMutations();
  
  // Event handlers
  const handleCreateAssignment = (data: any) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
      }
    });
  };
  
  const handleViewAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsEditing(true);
    setShowAdvancedCreator(true);
  };
  
  const handleEditAssignment = (assignment: any) => {
    setSelectedAssignment(assignment);
    setIsEditing(true);
    setShowAdvancedCreator(true);
  };
  
  const handleDeleteAssignment = (assignmentId: string) => {
    if (confirm('Are you sure you want to delete this assignment?')) {
      setDeletingIds(prev => [...prev, assignmentId]);
      deleteMutation.mutate(assignmentId, {
        onSettled: () => {
          setDeletingIds(prev => prev.filter(id => id !== assignmentId));
        }
      });
    }
  };
  
  const handleAssignmentCreated = (assignment: any) => {
    setIsEditing(false);
    setSelectedAssignment(null);
    setShowAdvancedCreator(false);
  };

  const handleCreateNewAdvanced = () => {
    setSelectedAssignment(null);
    setIsEditing(false);
    setShowAdvancedCreator(true);
  };

  const handleCancelCreation = () => {
    setShowAdvancedCreator(false);
    setSelectedAssignment(null);
    setIsEditing(false);
  };
  
  if (!currentClassroom) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a classroom to view assignments.</p>
      </div>
    );
  }

  // Show advanced assignment creator when editing or creating
  if (showAdvancedCreator) {
    return (
      <AssignmentCreator
        classroomId={currentClassroom.id}
        editingAssignment={selectedAssignment}
        onAssignmentCreated={handleAssignmentCreated}
        onCancel={handleCancelCreation}
      />
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" data-testid="assignments-page">
      <AssignmentFilters
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        assignmentCount={assignments?.length || 0}
      />

      <AssignmentGrid
        assignments={assignments || []}
        selectedCategory={selectedCategory}
        onCreateNew={() => setIsCreateDialogOpen(true)}
        onView={handleViewAssignment}
        onEdit={handleEditAssignment}
        onDelete={handleDeleteAssignment}
        isLoading={isLoading}
        deletingIds={deletingIds}
      />

      {/* Simple Create Assignment Dialog */}
      <CreateAssignmentDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateAssignment}
        isSubmitting={createMutation.isPending}
      />

      {/* Link to Advanced Creator */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={handleCreateNewAdvanced}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg transition-colors"
          data-testid="button-advanced-creator"
          title="Create Advanced Assignment"
        >
          <span className="text-sm font-medium px-2">Advanced</span>
        </button>
      </div>
    </div>
  );
}
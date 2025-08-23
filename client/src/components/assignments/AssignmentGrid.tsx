import { AssignmentCard } from './AssignmentCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  category: string;
  baseTokenReward: number;
  dueDate?: string;
  visibleToStudents: boolean;
  submissionCount?: number;
  createdAt: string;
}

interface AssignmentGridProps {
  assignments: Assignment[];
  selectedCategory: string;
  onCreateNew: () => void;
  onView: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
  isLoading?: boolean;
  deletingIds?: string[];
}

export function AssignmentGrid({
  assignments,
  selectedCategory,
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  isLoading = false,
  deletingIds = [],
}: AssignmentGridProps) {
  // Filter assignments by category
  const filteredAssignments = assignments?.filter(assignment => 
    selectedCategory === 'all' || assignment.category === selectedCategory
  ) || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-48 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
            data-testid={`assignment-skeleton-${i}`}
          />
        ))}
      </div>
    );
  }

  if (filteredAssignments.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-12"
        data-testid="no-assignments-message"
      >
        <div className="max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Plus className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {selectedCategory === 'all' ? 'No assignments yet' : `No ${selectedCategory} assignments`}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {selectedCategory === 'all' 
              ? 'Create your first assignment to get started with engaging your students.'
              : `Create your first ${selectedCategory} assignment for this category.`
            }
          </p>
          <Button onClick={onCreateNew} data-testid="button-create-first-assignment">
            <Plus className="h-4 w-4 mr-2" />
            Create Assignment
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          Showing {filteredAssignments.length} of {assignments.length} assignments
        </div>
        <Button onClick={onCreateNew} data-testid="button-create-assignment">
          <Plus className="h-4 w-4 mr-2" />
          New Assignment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssignments.map((assignment) => (
          <AssignmentCard
            key={assignment.id}
            assignment={assignment}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            isDeleting={deletingIds.includes(assignment.id)}
          />
        ))}
      </div>
    </div>
  );
}
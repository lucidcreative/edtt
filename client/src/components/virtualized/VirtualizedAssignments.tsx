import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Award } from 'lucide-react';
import { format } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  description?: string;
  category: string;
  tokenReward: number;
  dueDate?: string;
  createdAt: string;
  isActive: boolean;
  submissionCount?: number;
}

interface VirtualizedAssignmentsProps {
  assignments: Assignment[];
  onViewAssignment?: (assignment: Assignment) => void;
  onEditAssignment?: (assignment: Assignment) => void;
  className?: string;
}

export function VirtualizedAssignments({ 
  assignments, 
  onViewAssignment, 
  onEditAssignment, 
  className 
}: VirtualizedAssignmentsProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort assignments by due date, then by creation date
  const sortedAssignments = useMemo(() => 
    [...assignments].sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }),
    [assignments]
  );

  const virtualizer = useVirtualizer({
    count: sortedAssignments.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 160, // Estimated height of each assignment card
    overscan: 3,
  });

  const items = virtualizer.getVirtualItems();

  const isOverdue = (dueDate?: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const isDueSoon = (dueDate?: string) => {
    if (!dueDate) return false;
    const due = new Date(dueDate);
    const now = new Date();
    const daysDiff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 3 && daysDiff > 0;
  };

  return (
    <div 
      ref={parentRef}
      className={`h-96 overflow-auto ${className}`}
      data-testid="virtualized-assignments-container"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const assignment = sortedAssignments[virtualItem.index];
          const overdue = isOverdue(assignment.dueDate);
          const dueSoon = isDueSoon(assignment.dueDate);
          
          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Card 
                className={`mb-3 mx-2 hover:shadow-md transition-all cursor-pointer ${
                  overdue ? 'border-red-200 bg-red-50' : 
                  dueSoon ? 'border-yellow-200 bg-yellow-50' : ''
                }`}
                onClick={() => onViewAssignment?.(assignment)}
                data-testid={`assignment-card-${assignment.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg font-semibold truncate" data-testid={`assignment-title-${assignment.id}`}>
                        {assignment.title}
                      </CardTitle>
                      {assignment.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {assignment.description}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-2">
                      <Badge variant="outline" data-testid={`assignment-category-${assignment.id}`}>
                        {assignment.category}
                      </Badge>
                      {!assignment.isActive && (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-4">
                      {/* Due date */}
                      {assignment.dueDate && (
                        <div className={`flex items-center space-x-1 ${
                          overdue ? 'text-red-600' : dueSoon ? 'text-yellow-600' : 'text-muted-foreground'
                        }`}>
                          <Calendar className="h-4 w-4" />
                          <span data-testid={`assignment-due-date-${assignment.id}`}>
                            Due {format(new Date(assignment.dueDate), 'MMM d')}
                          </span>
                          {overdue && <span className="text-xs font-medium">(Overdue)</span>}
                          {dueSoon && <span className="text-xs font-medium">(Due Soon)</span>}
                        </div>
                      )}
                      
                      {/* Creation date if no due date */}
                      {!assignment.dueDate && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Created {format(new Date(assignment.createdAt), 'MMM d')}</span>
                        </div>
                      )}
                      
                      {/* Submission count */}
                      {typeof assignment.submissionCount === 'number' && (
                        <div className="flex items-center space-x-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span data-testid={`assignment-submissions-${assignment.id}`}>
                            {assignment.submissionCount} submissions
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Token reward */}
                    <div className="flex items-center space-x-1 text-yellow-600 font-medium">
                      <Award className="h-4 w-4" />
                      <span data-testid={`assignment-reward-${assignment.id}`}>
                        {assignment.tokenReward} tokens
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex justify-end space-x-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewAssignment?.(assignment);
                      }}
                      data-testid={`view-assignment-${assignment.id}`}
                    >
                      View Details
                    </Button>
                    {onEditAssignment && (
                      <Button 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditAssignment(assignment);
                        }}
                        data-testid={`edit-assignment-${assignment.id}`}
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {sortedAssignments.length === 0 && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p data-testid="empty-assignments">No assignments created yet</p>
        </div>
      )}
    </div>
  );
}
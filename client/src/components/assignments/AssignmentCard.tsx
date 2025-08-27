import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, DollarSign, Users, MoreVertical, Edit, Trash2, Eye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { CATEGORIES } from './AssignmentFilters';

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

interface AssignmentCardProps {
  assignment: Assignment;
  onView: (assignment: Assignment) => void;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignmentId: string) => void;
  isDeleting?: boolean;
}

export function AssignmentCard({ 
  assignment, 
  onView, 
  onEdit, 
  onDelete, 
  isDeleting = false 
}: AssignmentCardProps) {
  const category = CATEGORIES.find(cat => cat.value === assignment.category);
  const isOverdue = assignment.dueDate && new Date(assignment.dueDate) < new Date();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      data-testid={`assignment-card-${assignment.id}`}
    >
      <Card className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2 mb-2">
                {assignment.title}
              </CardTitle>
              <div className="flex items-center space-x-3">
                {category && (
                  <Badge variant="secondary" className={category.color}>
                    <span className="mr-1">{category.icon}</span>
                    {category.label}
                  </Badge>
                )}
                {!assignment.visibleToStudents && (
                  <Badge variant="outline">Hidden</Badge>
                )}
                {isOverdue && (
                  <Badge variant="destructive">Overdue</Badge>
                )}
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid={`assignment-menu-${assignment.id}`}>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView(assignment)}>
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(assignment)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(assignment.id)}
                  className="text-red-600"
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        
        <CardContent>
          {assignment.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {assignment.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-medium">{assignment.baseTokenReward} tokens</span>
              </div>
              
              {assignment.submissionCount !== undefined && (
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span>{assignment.submissionCount} submissions</span>
                </div>
              )}
            </div>
            
            {assignment.dueDate && (
              <div className="flex items-center space-x-1 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Due {format(new Date(assignment.dueDate), 'MMM dd')}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
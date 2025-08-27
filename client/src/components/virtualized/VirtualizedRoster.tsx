import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Award, Clock } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  username: string;
  tokens: number;
  level: number;
  profileImageUrl?: string;
  joinedAt: string;
  isActive: boolean;
}

interface VirtualizedRosterProps {
  students: Student[];
  onAwardTokens?: (student: Student) => void;
  onViewProgress?: (student: Student) => void;
  className?: string;
}

export function VirtualizedRoster({ students, onAwardTokens, onViewProgress, className }: VirtualizedRosterProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Sort students by tokens descending for leaderboard effect
  const sortedStudents = useMemo(() => 
    [...students].sort((a, b) => b.tokens - a.tokens),
    [students]
  );

  const virtualizer = useVirtualizer({
    count: sortedStudents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated height of each student card
    overscan: 5, // Render 5 extra items outside viewport for smooth scrolling
  });

  const items = virtualizer.getVirtualItems();

  return (
    <div 
      ref={parentRef}
      className={`h-96 overflow-auto ${className}`}
      data-testid="virtualized-roster-container"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {items.map((virtualItem) => {
          const student = sortedStudents[virtualItem.index];
          const rank = virtualItem.index + 1;
          
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
                className="mb-2 mx-2 hover:shadow-md transition-shadow"
                data-testid={`student-card-${student.id}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Rank indicator */}
                      <div className="text-sm font-bold text-muted-foreground w-6">
                        #{rank}
                      </div>
                      
                      {/* Avatar */}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={student.profileImageUrl} />
                        <AvatarFallback>
                          {student.name?.charAt(0) || student.username?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Student info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" data-testid={`student-name-${student.id}`}>
                          {student.name || student.username}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          @{student.username}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats and actions */}
                    <div className="flex items-center space-x-3">
                      {/* Tokens */}
                      <div className="text-right">
                        <div className="flex items-center space-x-1">
                          <span className="text-lg font-bold text-yellow-600" data-testid={`student-tokens-${student.id}`}>
                            {student.tokens}
                          </span>
                          <span className="text-xs text-muted-foreground">tokens</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          Level {student.level}
                        </Badge>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex space-x-1">
                        {onAwardTokens && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onAwardTokens(student)}
                            data-testid={`award-tokens-${student.id}`}
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        )}
                        {onViewProgress && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewProgress(student)}
                            data-testid={`view-progress-${student.id}`}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" data-testid={`student-menu-${student.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      
      {/* Empty state */}
      {sortedStudents.length === 0 && (
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          <p data-testid="empty-roster">No students enrolled yet</p>
        </div>
      )}
    </div>
  );
}
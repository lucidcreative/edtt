import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'math', label: 'Math', icon: '🔢', color: 'bg-red-100 text-red-600' },
  { value: 'science', label: 'Science', icon: '🧪', color: 'bg-blue-100 text-blue-600' },
  { value: 'history', label: 'History', icon: '🏛️', color: 'bg-green-100 text-green-600' },
  { value: 'english', label: 'English', icon: '📚', color: 'bg-purple-100 text-purple-600' },
  { value: 'art', label: 'Art', icon: '🎨', color: 'bg-pink-100 text-pink-600' },
  { value: 'homework', label: 'Homework', icon: '📝', color: 'bg-orange-100 text-orange-600' },
  { value: 'project', label: 'Project', icon: '🎯', color: 'bg-indigo-100 text-indigo-600' },
  { value: 'quiz', label: 'Quiz', icon: '❓', color: 'bg-yellow-100 text-yellow-600' },
];

interface AssignmentFiltersProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  assignmentCount?: number;
}

export function AssignmentFilters({ 
  selectedCategory, 
  onCategoryChange, 
  assignmentCount = 0 
}: AssignmentFiltersProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <h2 className="text-2xl font-bold">Assignments</h2>
        {assignmentCount > 0 && (
          <span className="text-sm text-muted-foreground">
            ({assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''})
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-48" data-testid="select-category-filter">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                <div className="flex items-center space-x-2">
                  {category.icon && <span>{category.icon}</span>}
                  <span>{category.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export { CATEGORIES };
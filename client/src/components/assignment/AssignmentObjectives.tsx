import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Target } from 'lucide-react';
import { AssignmentFormData } from '@/hooks/useAssignmentForm';
import { UseFormReturn } from 'react-hook-form';

interface AssignmentObjectivesProps {
  form: UseFormReturn<AssignmentFormData>;
  learningObjective: string;
  setLearningObjective: (value: string) => void;
  addLearningObjective: () => void;
  removeLearningObjective: (index: number) => void;
  subjectTag: string;
  setSubjectTag: (value: string) => void;
  addSubjectTag: () => void;
  removeSubjectTag: (index: number) => void;
}

export function AssignmentObjectives({
  form,
  learningObjective,
  setLearningObjective,
  addLearningObjective,
  removeLearningObjective,
  subjectTag,
  setSubjectTag,
  addSubjectTag,
  removeSubjectTag,
}: AssignmentObjectivesProps) {
  const objectives = form.watch('learningObjectives');
  const tags = form.watch('subjectTags');

  return (
    <div className="space-y-6">
      {/* Learning Objectives */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Target className="h-4 w-4 text-blue-500" />
          <h3 className="text-lg font-medium">Learning Objectives</h3>
        </div>
        
        <div className="flex space-x-2">
          <Input
            placeholder="Add a learning objective"
            value={learningObjective}
            onChange={(e) => setLearningObjective(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLearningObjective())}
            data-testid="input-learning-objective"
          />
          <Button 
            type="button" 
            onClick={addLearningObjective}
            size="sm"
            data-testid="button-add-objective"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {objectives.map((objective, index) => (
            <Badge 
              key={index} 
              variant="outline" 
              className="flex items-center gap-1"
              data-testid={`objective-${index}`}
            >
              {objective}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => removeLearningObjective(index)}
                data-testid={`remove-objective-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>

      {/* Subject Tags */}
      <div className="space-y-3">
        <h3 className="text-lg font-medium">Subject Tags (Optional)</h3>
        
        <div className="flex space-x-2">
          <Input
            placeholder="Add a subject tag"
            value={subjectTag}
            onChange={(e) => setSubjectTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubjectTag())}
            data-testid="input-subject-tag"
          />
          <Button 
            type="button" 
            onClick={addSubjectTag}
            size="sm"
            data-testid="button-add-tag"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <Badge 
              key={index} 
              variant="secondary" 
              className="flex items-center gap-1"
              data-testid={`tag-${index}`}
            >
              {tag}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 ml-1"
                onClick={() => removeSubjectTag(index)}
                data-testid={`remove-tag-${index}`}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
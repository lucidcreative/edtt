import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, Target, FileText, Clock, Users } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { AssignmentFormData } from '@/hooks/useAssignmentForm';
import { format } from 'date-fns';

interface AssignmentPreviewProps {
  form: UseFormReturn<AssignmentFormData>;
}

export function AssignmentPreview({ form }: AssignmentPreviewProps) {
  const formData = form.watch();

  return (
    <Card data-testid="assignment-preview">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Assignment Preview</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="text-xl font-bold">{formData.title || 'Untitled Assignment'}</h3>
          <p className="text-muted-foreground mt-2">
            {formData.description || 'No description provided'}
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="text-sm">
              Due: {formData.dueDate ? format(new Date(formData.dueDate), 'MMM dd, yyyy') : 'No due date'}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-sm">
              {formData.baseTokenReward || '0'} tokens
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <Badge variant="outline">{formData.category || 'Uncategorized'}</Badge>
          </div>

          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-sm">
              {formData.visibleToStudents ? 'Visible' : 'Hidden'}
            </span>
          </div>
        </div>

        {formData.learningObjectives.length > 0 && (
          <>
            <Separator />
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <span className="font-medium">Learning Objectives</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {formData.learningObjectives.map((objective, index) => (
                  <li key={index}>{objective}</li>
                ))}
              </ul>
            </div>
          </>
        )}

        {formData.subjectTags.length > 0 && (
          <>
            <Separator />
            <div>
              <span className="font-medium">Tags: </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {formData.subjectTags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </>
        )}

        {formData.submissionInstructions && (
          <>
            <Separator />
            <div>
              <span className="font-medium">Submission Instructions:</span>
              <p className="text-sm mt-1 text-muted-foreground">
                {formData.submissionInstructions}
              </p>
            </div>
          </>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Late Submissions:</span>
            <p className="text-muted-foreground">
              {formData.lateSubmissionAllowed ? 
                `Allowed (${formData.latePenaltyPercentage}% penalty/day)` : 
                'Not allowed'
              }
            </p>
          </div>

          <div>
            <span className="font-medium">Max Submissions:</span>
            <p className="text-muted-foreground">{formData.maxSubmissions}</p>
          </div>

          <div>
            <span className="font-medium">Early Bonus:</span>
            <p className="text-muted-foreground">{formData.earlySubmissionBonus}%</p>
          </div>

          <div>
            <span className="font-medium">Quality Bonus:</span>
            <p className="text-muted-foreground">Up to {formData.qualityBonusMax}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
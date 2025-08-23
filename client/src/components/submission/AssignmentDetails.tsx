import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, DollarSign, Target, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { format, differenceInDays, isAfter } from 'date-fns';

interface AssignmentDetailsProps {
  assignment: any;
  existingSubmission?: any;
}

export function AssignmentDetails({ assignment, existingSubmission }: AssignmentDetailsProps) {
  const isOverdue = assignment.dueDate && isAfter(new Date(), new Date(assignment.dueDate));
  const daysUntilDue = assignment.dueDate 
    ? differenceInDays(new Date(assignment.dueDate), new Date())
    : null;

  const getStatusColor = () => {
    if (existingSubmission) return 'bg-green-100 text-green-700';
    if (isOverdue) return 'bg-red-100 text-red-700';
    if (daysUntilDue !== null && daysUntilDue <= 1) return 'bg-orange-100 text-orange-700';
    return 'bg-blue-100 text-blue-700';
  };

  const getStatusText = () => {
    if (existingSubmission) return 'Submitted';
    if (isOverdue) return 'Overdue';
    if (daysUntilDue !== null && daysUntilDue <= 1) return 'Due Soon';
    return 'In Progress';
  };

  const getStatusIcon = () => {
    if (existingSubmission) return <CheckCircle className="h-4 w-4" />;
    if (isOverdue) return <AlertTriangle className="h-4 w-4" />;
    return <Clock className="h-4 w-4" />;
  };

  return (
    <Card data-testid="assignment-details">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
            <div className="flex items-center space-x-3">
              <Badge className={getStatusColor()}>
                {getStatusIcon()}
                <span className="ml-1">{getStatusText()}</span>
              </Badge>
              {assignment.category && (
                <Badge variant="outline">{assignment.category}</Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {assignment.description && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Description</h4>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {assignment.description}
            </p>
          </div>
        )}

        {assignment.learningObjectives?.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-500" />
              Learning Objectives
            </h4>
            <ul className="space-y-1">
              {assignment.learningObjectives.map((objective: string, index: number) => (
                <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                  <span className="mr-2">•</span>
                  <span>{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {assignment.submissionInstructions && (
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Instructions</h4>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {assignment.submissionInstructions}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {assignment.dueDate && (
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-xs text-gray-500">Due Date</div>
                <div className="text-sm font-medium">
                  {format(new Date(assignment.dueDate), 'MMM dd, yyyy')}
                </div>
                {daysUntilDue !== null && daysUntilDue >= 0 && (
                  <div className="text-xs text-gray-500">
                    {daysUntilDue === 0 ? 'Due today' : `${daysUntilDue} days left`}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-500" />
            <div>
              <div className="text-xs text-gray-500">Token Reward</div>
              <div className="text-sm font-medium">{assignment.baseTokenReward || 0} tokens</div>
              {assignment.earlySubmissionBonus && (
                <div className="text-xs text-green-600">
                  +{assignment.earlySubmissionBonus}% early bonus
                </div>
              )}
            </div>
          </div>

          {assignment.maxSubmissions && (
            <div className="flex items-center space-x-2">
              <div>
                <div className="text-xs text-gray-500">Submissions Allowed</div>
                <div className="text-sm font-medium">
                  {existingSubmission ? 1 : 0} / {assignment.maxSubmissions}
                </div>
                {assignment.maxSubmissions > 1 && !existingSubmission && (
                  <div className="text-xs text-gray-500">Multiple attempts allowed</div>
                )}
              </div>
            </div>
          )}
        </div>

        {existingSubmission && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Your Submission</h4>
            <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-green-800 dark:text-green-300">
                    {existingSubmission.linkTitle}
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Submitted on {format(new Date(existingSubmission.submittedAt), 'MMM dd, yyyy at h:mm a')}
                  </div>
                  {existingSubmission.studentNotes && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      <strong>Notes:</strong> {existingSubmission.studentNotes}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
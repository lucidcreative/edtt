import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Calendar, 
  FileText, 
  Target, 
  Link2, 
  DollarSign, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Upload,
  ExternalLink,
  BookOpen,
  User,
  Award,
  MessageSquare,
  Eye,
  CheckCircle2,
  AlertCircle,
  Timer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const submissionFormSchema = z.object({
  submissionUrl: z.string().url('Please enter a valid URL'),
  linkTitle: z.string().min(1, 'Please provide a title for your submission'),
  studentNotes: z.string().optional(),
  linkType: z.string().optional()
});

type SubmissionFormData = z.infer<typeof submissionFormSchema>;

interface AssignmentSubmissionProps {
  assignment: any;
  existingSubmission?: any;
  onSubmissionComplete?: () => void;
}

const PLATFORM_CONFIGS = {
  google_drive: {
    name: 'Google Drive',
    icon: '📁',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-900/10',
    borderColor: 'border-blue-200 dark:border-blue-800',
    instructions: [
      'Create your document/presentation in Google Drive',
      'Set sharing permissions to "Anyone with the link can view"',
      'Copy the sharing link from the "Share" button',
      'Paste the link below and add a descriptive title'
    ],
    urlPattern: /drive\.google\.com/
  },
  youtube: {
    name: 'YouTube',
    icon: '📹',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-900/10',
    borderColor: 'border-red-200 dark:border-red-800',
    instructions: [
      'Upload your video to YouTube',
      'Set visibility to "Unlisted" or "Public"',
      'Copy the video URL from the address bar',
      'Paste the URL below with your video title'
    ],
    urlPattern: /youtube\.com|youtu\.be/
  },
  dropbox: {
    name: 'Dropbox',
    icon: '📦',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-900/10',
    borderColor: 'border-purple-200 dark:border-purple-800',
    instructions: [
      'Upload your files to Dropbox',
      'Right-click the file/folder and select "Share"',
      'Create a sharing link with appropriate permissions',
      'Copy the link and paste it below'
    ],
    urlPattern: /dropbox\.com/
  },
  padlet: {
    name: 'Padlet',
    icon: '📌',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-900/10',
    borderColor: 'border-green-200 dark:border-green-800',
    instructions: [
      'Create your Padlet board',
      'Set privacy to "Public" or "Secret" with link sharing',
      'Copy the Padlet URL from your browser',
      'Submit the link with your board title'
    ],
    urlPattern: /padlet\.com/
  },
  canva: {
    name: 'Canva',
    icon: '🎨',
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 dark:bg-pink-900/10',
    borderColor: 'border-pink-200 dark:border-pink-800',
    instructions: [
      'Complete your design in Canva',
      'Click "Share" and create a view-only link',
      'Ensure link permissions allow viewing',
      'Copy and submit the sharing link'
    ],
    urlPattern: /canva\.com/
  },
  prezi: {
    name: 'Prezi',
    icon: '🎯',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-900/10',
    borderColor: 'border-orange-200 dark:border-orange-800',
    instructions: [
      'Finish your Prezi presentation',
      'Set sharing permissions in presentation settings',
      'Copy the presentation link',
      'Submit with your presentation title'
    ],
    urlPattern: /prezi\.com/
  }
};

function detectLinkType(url: string): string {
  for (const [type, config] of Object.entries(PLATFORM_CONFIGS)) {
    if (config.urlPattern.test(url)) {
      return type;
    }
  }
  return 'other';
}

function getTimeUntilDue(dueDate: string): { 
  isOverdue: boolean; 
  timeLeft: string; 
  urgency: 'low' | 'medium' | 'high' | 'overdue' 
} {
  const due = new Date(dueDate);
  const now = new Date();
  const diff = due.getTime() - now.getTime();
  
  if (diff < 0) {
    return { isOverdue: true, timeLeft: 'Overdue', urgency: 'overdue' };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  let timeLeft = '';
  let urgency: 'low' | 'medium' | 'high' = 'low';
  
  if (days > 0) {
    timeLeft = `${days} day${days > 1 ? 's' : ''} left`;
    urgency = days <= 1 ? 'high' : days <= 3 ? 'medium' : 'low';
  } else {
    timeLeft = `${hours} hour${hours > 1 ? 's' : ''} left`;
    urgency = 'high';
  }
  
  return { isOverdue: false, timeLeft, urgency };
}

function ProfessionalTipsCard() {
  return (
    <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Award className="h-4 w-4 text-yellow-600" />
          Professional Submission Tips
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Clear, Descriptive Titles</p>
              <p className="text-muted-foreground text-xs">
                Use titles like "Math Portfolio - Week 3 Analysis" instead of "homework"
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Proper Sharing Permissions</p>
              <p className="text-muted-foreground text-xs">
                Ensure your teacher can access your work with the link
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Submit Early When Possible</p>
              <p className="text-muted-foreground text-xs">
                Early submissions can earn bonus tokens and show responsibility
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium">Add Context in Notes</p>
              <p className="text-muted-foreground text-xs">
                Explain your work, challenges faced, or areas you're proud of
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AssignmentSubmission({ assignment, existingSubmission, onSubmissionComplete }: AssignmentSubmissionProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');

  const timeInfo = getTimeUntilDue(assignment.dueDate);
  
  const form = useForm<SubmissionFormData>({
    resolver: zodResolver(submissionFormSchema),
    defaultValues: {
      submissionUrl: existingSubmission?.submissionUrl || '',
      linkTitle: existingSubmission?.linkTitle || '',
      studentNotes: existingSubmission?.studentNotes || '',
      linkType: existingSubmission?.linkType || ''
    }
  });

  const watchedUrl = form.watch('submissionUrl');
  
  // Auto-detect platform when URL changes
  React.useEffect(() => {
    if (watchedUrl) {
      const detectedType = detectLinkType(watchedUrl);
      if (detectedType !== 'other') {
        setSelectedPlatform(detectedType);
        form.setValue('linkType', detectedType);
      }
    }
  }, [watchedUrl, form]);

  const submitAssignmentMutation = useMutation({
    mutationFn: async (data: SubmissionFormData) => {
      return apiRequest('/api/submissions', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          assignmentId: assignment.id,
          classroomId: assignment.classroomId,
          linkType: selectedPlatform || 'other'
        })
      });
    },
    onSuccess: () => {
      toast({
        title: 'Assignment Submitted!',
        description: 'Your teacher will review your submission and provide feedback.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student-assignments'] });
      onSubmissionComplete?.();
    },
    onError: (error: any) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Please check your link and try again.',
        variant: 'destructive',
      });
    }
  });

  const handleSubmit = (data: SubmissionFormData) => {
    submitAssignmentMutation.mutate(data);
  };

  const getPlatformConfig = (type: string) => {
    return PLATFORM_CONFIGS[type as keyof typeof PLATFORM_CONFIGS] || {
      name: 'Other Platform',
      icon: '🔗',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 dark:bg-gray-900/10',
      borderColor: 'border-gray-200 dark:border-gray-800',
      instructions: ['Submit your work using the provided URL'],
      urlPattern: /.*/
    };
  };

  const selectedConfig = selectedPlatform ? getPlatformConfig(selectedPlatform) : null;

  return (
    <div className="space-y-6">
      {/* Assignment Header */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-xl">{assignment.title}</CardTitle>
                  <CardDescription className="flex items-center gap-4 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Due: {format(new Date(assignment.dueDate), 'MMM d, yyyy h:mm a')}
                    </span>
                    <Badge variant="outline" className="capitalize">
                      {assignment.category}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-600">
                  {assignment.baseTokenReward} tokens
                </span>
              </div>
              <div className={`flex items-center gap-2 text-sm ${
                timeInfo.urgency === 'overdue' ? 'text-red-600' :
                timeInfo.urgency === 'high' ? 'text-orange-600' :
                timeInfo.urgency === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                <Timer className="h-4 w-4" />
                {timeInfo.timeLeft}
              </div>
            </div>
          </div>
          
          {/* Time Progress Bar */}
          {!timeInfo.isOverdue && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Assigned: {format(new Date(assignment.assignedDate), 'MMM d')}</span>
                <span>Due: {format(new Date(assignment.dueDate), 'MMM d')}</span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, 
                  ((new Date().getTime() - new Date(assignment.assignedDate).getTime()) / 
                   (new Date(assignment.dueDate).getTime() - new Date(assignment.assignedDate).getTime())) * 100
                ))}
                className="h-2"
              />
            </div>
          )}
        </CardHeader>
      </Card>

      {/* Assignment Description */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Assignment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Description</h4>
            <p className="text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
          </div>
          
          {assignment.learningObjectives?.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Learning Objectives</h4>
              <ul className="space-y-1">
                {assignment.learningObjectives.map((objective: string, index: number) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Target className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    {objective}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Separator />

          <div>
            <h4 className="font-medium mb-2">Submission Instructions</h4>
            <p className="text-muted-foreground whitespace-pre-wrap text-sm">
              {assignment.submissionInstructions}
            </p>
          </div>

          {assignment.submissionFormatNotes && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Format Notes:</strong> {assignment.submissionFormatNotes}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Submission Status or Form */}
      {existingSubmission ? (
        <Card className="border-green-200 dark:border-green-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              Assignment Submitted
            </CardTitle>
            <CardDescription>
              Submitted on {format(new Date(existingSubmission.submittedAt), 'MMM d, yyyy h:mm a')}
              {existingSubmission.isLateSubmission && (
                <Badge variant="destructive" className="ml-2">Late Submission</Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Your Submission</h4>
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <span className="text-2xl">{getPlatformConfig(existingSubmission.linkType).icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{existingSubmission.linkTitle}</p>
                  <a 
                    href={existingSubmission.submissionUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Submission <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {existingSubmission.studentNotes && (
              <div>
                <h4 className="font-medium mb-2">Your Notes</h4>
                <p className="text-sm text-muted-foreground bg-gray-50 dark:bg-gray-900 p-3 rounded-lg">
                  {existingSubmission.studentNotes}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`h-2 w-2 rounded-full ${
                  existingSubmission.reviewStatus === 'completed' ? 'bg-green-600' :
                  existingSubmission.reviewStatus === 'reviewing' ? 'bg-yellow-600' :
                  'bg-gray-400'
                }`} />
                <span className="font-medium capitalize">
                  {existingSubmission.reviewStatus === 'pending' ? 'Awaiting Review' : 
                   existingSubmission.reviewStatus === 'reviewing' ? 'Under Review' :
                   existingSubmission.reviewStatus === 'completed' ? 'Reviewed' :
                   existingSubmission.reviewStatus}
                </span>
              </div>
              {existingSubmission.tokensAwarded && parseFloat(existingSubmission.tokensAwarded) > 0 && (
                <div className="flex items-center gap-1 text-green-600 font-semibold">
                  <DollarSign className="h-4 w-4" />
                  {existingSubmission.tokensAwarded} tokens earned
                </div>
              )}
            </div>

            {existingSubmission.teacherFeedback && (
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Teacher Feedback
                </h4>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{existingSubmission.teacherFeedback}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Late Submission Warning */}
          {timeInfo.isOverdue && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This assignment is overdue. 
                {assignment.lateSubmissionAllowed ? (
                  <span> Late submissions are allowed with a {assignment.latePenaltyPercentage}% penalty.</span>
                ) : (
                  <span> Late submissions are not allowed for this assignment.</span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Professional Tips */}
          <ProfessionalTipsCard />

          {/* Platform Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Choose Your Platform
              </CardTitle>
              <CardDescription>
                Select the platform where you created your work
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {assignment.acceptedLinkTypes?.map((platformType: string) => {
                  const config = getPlatformConfig(platformType);
                  const isSelected = selectedPlatform === platformType;
                  
                  return (
                    <Card
                      key={platformType}
                      className={`cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? `ring-2 ring-blue-500 ${config.bgColor} ${config.borderColor}`
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                      onClick={() => setSelectedPlatform(platformType)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{config.icon}</span>
                          <div>
                            <div className={`font-medium ${config.color}`}>
                              {config.name}
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle className="h-5 w-5 text-blue-600 ml-auto" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Platform Instructions */}
          {selectedConfig && (
            <Card className={`${selectedConfig.bgColor} ${selectedConfig.borderColor} border-2`}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="text-2xl">{selectedConfig.icon}</span>
                  How to Submit with {selectedConfig.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-2">
                  {selectedConfig.instructions.map((instruction, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className={`h-6 w-6 rounded-full ${selectedConfig.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center text-xs font-semibold ${selectedConfig.color}`}>
                        {index + 1}
                      </div>
                      <span className="text-sm">{instruction}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Submission Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Submit Your Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="submissionUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Link</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Paste your link here (e.g., https://drive.google.com/...)"
                            {...field}
                            data-testid="input-submission-url"
                          />
                        </FormControl>
                        <FormDescription>
                          Make sure your link is accessible to your teacher
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="linkTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Submission Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Give your submission a clear, descriptive title"
                            {...field}
                            data-testid="input-submission-title"
                          />
                        </FormControl>
                        <FormDescription>
                          Help your teacher understand what you've submitted
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="studentNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share any challenges you faced, what you learned, or what you're proud of..."
                            className="min-h-[80px]"
                            {...field}
                            data-testid="textarea-student-notes"
                          />
                        </FormControl>
                        <FormDescription>
                          This helps your teacher understand your learning process
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Eye className="h-4 w-4" />
                      Your teacher will review and provide feedback
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={submitAssignmentMutation.isPending || (!assignment.lateSubmissionAllowed && timeInfo.isOverdue)}
                      className="min-w-[140px]"
                      data-testid="button-submit-assignment"
                    >
                      {submitAssignmentMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Submitting...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          Submit Assignment
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
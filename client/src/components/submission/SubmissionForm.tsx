import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { SubmissionFormData } from '@/hooks/useSubmissionForm';
import { PLATFORM_CONFIGS } from './PlatformInstructions';

interface SubmissionFormProps {
  form: UseFormReturn<SubmissionFormData>;
  selectedPlatform: string | null;
  onSubmit: (data: SubmissionFormData) => void;
  onUrlChange?: (url: string) => void;
  isSubmitting?: boolean;
  isExistingSubmission?: boolean;
  assignment: any;
}

export function SubmissionForm({
  form,
  selectedPlatform,
  onSubmit,
  onUrlChange,
  isSubmitting = false,
  isExistingSubmission = false,
  assignment
}: SubmissionFormProps) {
  const watchedUrl = form.watch('submissionUrl');
  
  const validatePlatformUrl = (url: string) => {
    if (!url || !selectedPlatform) return true;
    
    const platform = PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS];
    if (!platform) return true;
    
    return platform.urlPattern.test(url);
  };

  const isValidPlatformUrl = validatePlatformUrl(watchedUrl);

  return (
    <Card data-testid="submission-form">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Upload className="h-5 w-5" />
          <span>{isExistingSubmission ? 'Update Submission' : 'Submit Assignment'}</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="submissionUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission URL *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="https://..."
                        onChange={(e) => {
                          field.onChange(e);
                          onUrlChange?.(e.target.value);
                        }}
                        className={`pr-10 ${
                          watchedUrl && !isValidPlatformUrl 
                            ? 'border-red-300 focus:border-red-500' 
                            : watchedUrl && isValidPlatformUrl 
                            ? 'border-green-300 focus:border-green-500' 
                            : ''
                        }`}
                        data-testid="input-submission-url"
                      />
                      {watchedUrl && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {isValidPlatformUrl ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Paste the link to your completed work from the selected platform above.
                  </FormDescription>
                  {!isValidPlatformUrl && watchedUrl && selectedPlatform && (
                    <Alert className="mt-2 border-red-200 bg-red-50">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-red-700">
                        This URL doesn't match the selected platform ({PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS]?.name}). 
                        Please check the URL or select the correct platform.
                      </AlertDescription>
                    </Alert>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submission Title *</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="e.g., My Science Project Presentation"
                      data-testid="input-submission-title"
                    />
                  </FormControl>
                  <FormDescription>
                    Give your submission a clear, descriptive title.
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
                      {...field}
                      placeholder="Any additional comments about your submission..."
                      className="min-h-[80px]"
                      data-testid="textarea-student-notes"
                    />
                  </FormControl>
                  <FormDescription>
                    Share any challenges you faced, what you learned, or additional context for your teacher.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-2">
                {selectedPlatform && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <span>{PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS]?.icon}</span>
                    <span>{PLATFORM_CONFIGS[selectedPlatform as keyof typeof PLATFORM_CONFIGS]?.name}</span>
                  </Badge>
                )}
                {watchedUrl && isValidPlatformUrl && (
                  <Badge variant="secondary" className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>URL Valid</span>
                  </Badge>
                )}
              </div>

              <div className="flex space-x-2">
                {watchedUrl && isValidPlatformUrl && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(watchedUrl, '_blank')}
                    data-testid="button-preview-submission"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview
                  </Button>
                )}
                
                <Button
                  type="submit"
                  disabled={isSubmitting || !isValidPlatformUrl}
                  data-testid="button-submit-assignment"
                >
                  {isSubmitting ? (
                    isExistingSubmission ? 'Updating...' : 'Submitting...'
                  ) : (
                    isExistingSubmission ? 'Update Submission' : 'Submit Assignment'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
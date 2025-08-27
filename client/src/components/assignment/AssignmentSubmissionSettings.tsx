import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { UseFormReturn } from 'react-hook-form';
import { AssignmentFormData } from '@/hooks/useAssignmentForm';

const LINK_TYPES = [
  { id: 'google_drive', label: 'Google Drive', icon: '📁', description: 'Documents, presentations, spreadsheets' },
  { id: 'youtube', label: 'YouTube', icon: '📹', description: 'Video presentations and tutorials' },
  { id: 'dropbox', label: 'Dropbox', icon: '📦', description: 'File sharing and collaboration' },
  { id: 'padlet', label: 'Padlet', icon: '📌', description: 'Digital bulletin boards' },
  { id: 'canva', label: 'Canva', icon: '🎨', description: 'Design and infographics' },
  { id: 'prezi', label: 'Prezi', icon: '🎯', description: 'Interactive presentations' }
];

const PERMISSION_LEVELS = [
  { value: 'view', label: 'View Only', description: 'Teacher can view submissions' },
  { value: 'comment', label: 'Comment Access', description: 'Teacher can leave comments' },
  { value: 'edit', label: 'Edit Access', description: 'Teacher can edit submissions (if platform allows)' }
];

interface AssignmentSubmissionSettingsProps {
  form: UseFormReturn<AssignmentFormData>;
}

export function AssignmentSubmissionSettings({ form }: AssignmentSubmissionSettingsProps) {
  const acceptedLinkTypes = form.watch('acceptedLinkTypes');

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="submissionInstructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Submission Instructions</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Provide detailed instructions for how students should submit their work"
                className="min-h-[120px]"
                {...field}
                data-testid="textarea-submission-instructions"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="acceptedLinkTypes"
        render={() => (
          <FormItem>
            <FormLabel>Accepted Submission Platforms</FormLabel>
            <FormDescription>
              Select which platforms students can use to submit their work
            </FormDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LINK_TYPES.map((linkType) => (
                <div key={linkType.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={acceptedLinkTypes.includes(linkType.id)}
                    onCheckedChange={(checked) => {
                      const current = form.getValues('acceptedLinkTypes');
                      if (checked) {
                        form.setValue('acceptedLinkTypes', [...current, linkType.id]);
                      } else {
                        form.setValue('acceptedLinkTypes', current.filter(id => id !== linkType.id));
                      }
                    }}
                    data-testid={`checkbox-link-type-${linkType.id}`}
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span>{linkType.icon}</span>
                      <span className="font-medium">{linkType.label}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{linkType.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="requiredPermissions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Required Link Permissions</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger data-testid="select-required-permissions">
                  <SelectValue placeholder="Select permission level" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PERMISSION_LEVELS.map((permission) => (
                  <SelectItem key={permission.value} value={permission.value}>
                    <div>
                      <div className="font-medium">{permission.label}</div>
                      <div className="text-sm text-muted-foreground">{permission.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="submissionFormatNotes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Format Notes (Optional)</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Any additional formatting requirements or guidelines"
                {...field}
                data-testid="textarea-format-notes"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
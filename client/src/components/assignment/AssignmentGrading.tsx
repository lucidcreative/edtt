import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Clock, CheckCircle } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { AssignmentFormData } from '@/hooks/useAssignmentForm';

interface AssignmentGradingProps {
  form: UseFormReturn<AssignmentFormData>;
}

export function AssignmentGrading({ form }: AssignmentGradingProps) {
  const lateSubmissionAllowed = form.watch('lateSubmissionAllowed');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5" />
            <span>Token Rewards</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="baseTokenReward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Base Token Reward</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="50"
                    {...field}
                    data-testid="input-base-token-reward"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="earlySubmissionBonus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Early Submission Bonus (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    placeholder="10.00"
                    {...field}
                    data-testid="input-early-bonus"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="qualityBonusMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Quality Bonus (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    step="0.01"
                    placeholder="20.00"
                    {...field}
                    data-testid="input-quality-bonus"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Late Submission Policy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="lateSubmissionAllowed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Allow Late Submissions</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Students can submit after the due date with penalty
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    data-testid="switch-late-submissions"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {lateSubmissionAllowed && (
            <FormField
              control={form.control}
              name="latePenaltyPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Penalty (% per day)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min="0" 
                      max="100"
                      step="0.01"
                      placeholder="10.00"
                      {...field}
                      data-testid="input-late-penalty"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="maxSubmissions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Submissions Allowed</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    data-testid="input-max-submissions"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5" />
            <span>Grading Criteria Weights</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="deadlineWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline Adherence</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1"
                    step="0.01"
                    placeholder="0.25"
                    {...field}
                    data-testid="input-deadline-weight"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instructionFollowingWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Following Instructions</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1"
                    step="0.01"
                    placeholder="0.25"
                    {...field}
                    data-testid="input-instruction-weight"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="communicationWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Communication</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1"
                    step="0.01"
                    placeholder="0.25"
                    {...field}
                    data-testid="input-communication-weight"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="presentationWeight"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presentation Quality</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    max="1"
                    step="0.01"
                    placeholder="0.25"
                    {...field}
                    data-testid="input-presentation-weight"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <FormField
        control={form.control}
        name="visibleToStudents"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Visible to Students</FormLabel>
              <div className="text-sm text-muted-foreground">
                Students can see and work on this assignment
              </div>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                data-testid="switch-visible-to-students"
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  );
}
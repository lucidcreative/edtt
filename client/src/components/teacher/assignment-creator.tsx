import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, X, Wand2 } from 'lucide-react';

// Custom hooks
import { useAssignmentForm } from '@/hooks/useAssignmentForm';
import { useAssignmentTemplates } from '@/hooks/useAssignmentTemplates';

// Broken-down components
import { AssignmentBasicInfo } from '@/components/assignment/AssignmentBasicInfo';
import { AssignmentObjectives } from '@/components/assignment/AssignmentObjectives';
import { AssignmentSubmissionSettings } from '@/components/assignment/AssignmentSubmissionSettings';
import { AssignmentGrading } from '@/components/assignment/AssignmentGrading';
import { AssignmentPreview } from '@/components/assignment/AssignmentPreview';

// All form logic and validation moved to useAssignmentForm hook

interface AssignmentCreatorProps {
  classroomId: string;
  onAssignmentCreated?: (assignment: any) => void;
  editingAssignment?: any;
  onCancel?: () => void;
}

// Constants moved to individual components where they're used

export function AssignmentCreator({ classroomId, onAssignmentCreated, editingAssignment, onCancel }: AssignmentCreatorProps) {
  // Use custom hooks for form logic and templates
  const formHooks = useAssignmentForm({
    classroomId,
    editingAssignment,
    onSuccess: onAssignmentCreated,
    onCancel,
  });

  const { data: templates } = useAssignmentTemplates(!editingAssignment);

  const loadTemplate = (template: any) => {
    formHooks.form.setValue('title', template.titleTemplate || '');
    formHooks.form.setValue('description', template.descriptionTemplate || '');
    formHooks.form.setValue('learningObjectives', template.learningObjectivesTemplate || []);
    formHooks.form.setValue('submissionInstructions', template.submissionInstructionsTemplate || '');
    formHooks.form.setValue('baseTokenReward', template.defaultTokenReward || '50');
    formHooks.form.setValue('acceptedLinkTypes', template.recommendedLinkTypes || ['google_drive']);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto" data-testid="assignment-creator">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </CardTitle>
          </div>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} data-testid="button-cancel">
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Form {...formHooks.form}>
          <form onSubmit={formHooks.form.handleSubmit(formHooks.handleSubmit)} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="basic" data-testid="tab-basic-info">
                  Basic Info
                </TabsTrigger>
                <TabsTrigger value="objectives" data-testid="tab-objectives">
                  Objectives
                </TabsTrigger>
                <TabsTrigger value="submission" data-testid="tab-submission">
                  Submission
                </TabsTrigger>
                <TabsTrigger value="grading" data-testid="tab-grading">
                  Grading
                </TabsTrigger>
                <TabsTrigger value="preview" data-testid="tab-preview">
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-6">
                {/* Template Selector */}
                {!editingAssignment && templates?.templates?.length > 0 && (
                  <Card className="border-dashed border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <Wand2 className="h-4 w-4 text-purple-600" />
                        <CardTitle className="text-sm">Quick Start Templates</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {templates.templates.slice(0, 4).map((template: any) => (
                          <Button
                            key={template.id}
                            variant="outline"
                            size="sm"
                            onClick={() => loadTemplate(template)}
                            className="justify-start h-auto p-3"
                            data-testid={`template-${template.id}`}
                          >
                            <div className="text-left">
                              <div className="font-medium">{template.templateName}</div>
                              <div className="text-xs text-muted-foreground">{template.category}</div>
                            </div>
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                <AssignmentBasicInfo form={formHooks.form} />
              </TabsContent>

              <TabsContent value="objectives" className="space-y-6">
                <AssignmentObjectives 
                  form={formHooks.form}
                  learningObjective={formHooks.learningObjective}
                  setLearningObjective={formHooks.setLearningObjective}
                  addLearningObjective={formHooks.addLearningObjective}
                  removeLearningObjective={formHooks.removeLearningObjective}
                  subjectTag={formHooks.subjectTag}
                  setSubjectTag={formHooks.setSubjectTag}
                  addSubjectTag={formHooks.addSubjectTag}
                  removeSubjectTag={formHooks.removeSubjectTag}
                />
              </TabsContent>

              <TabsContent value="submission" className="space-y-6">
                <AssignmentSubmissionSettings form={formHooks.form} />
              </TabsContent>

              <TabsContent value="grading" className="space-y-6">
                <AssignmentGrading form={formHooks.form} />
              </TabsContent>

              <TabsContent value="preview" className="space-y-6">
                <AssignmentPreview form={formHooks.form} />
              </TabsContent>

              <div className="flex justify-end space-x-2 pt-6 border-t">
                {onCancel && (
                  <Button variant="outline" onClick={onCancel} data-testid="button-cancel-bottom">
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  disabled={formHooks.isSubmitting}
                  data-testid="button-save-assignment"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {formHooks.isSubmitting ? 'Saving...' : (editingAssignment ? 'Update Assignment' : 'Create Assignment')}
                </Button>
              </div>
            </Tabs>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

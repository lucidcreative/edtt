import React from 'react';

// Custom hooks
import { useSubmissionForm } from '@/hooks/useSubmissionForm';

// Broken-down components
import { AssignmentDetails } from '@/components/submission/AssignmentDetails';
import { PlatformInstructions } from '@/components/submission/PlatformInstructions';
import { SubmissionForm } from '@/components/submission/SubmissionForm';

interface AssignmentSubmissionProps {
  assignment: any;
  existingSubmission?: any;
  onSubmissionComplete?: () => void;
}

export default function AssignmentSubmission({ 
  assignment, 
  existingSubmission, 
  onSubmissionComplete 
}: AssignmentSubmissionProps) {
  // Use custom hook for all form logic
  const submissionHooks = useSubmissionForm({
    assignment,
    existingSubmission,
    onSubmissionComplete,
  });

  const handleUrlChange = (url: string) => {
    if (url) {
      const detectedPlatform = submissionHooks.detectPlatform(url);
      if (detectedPlatform && assignment.acceptedLinkTypes?.includes(detectedPlatform)) {
        submissionHooks.setSelectedPlatform(detectedPlatform);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6" data-testid="assignment-submission">
      {/* Assignment Information */}
      <AssignmentDetails 
        assignment={assignment}
        existingSubmission={existingSubmission}
      />

      {/* Platform Selection and Instructions */}
      {assignment.acceptedLinkTypes?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Choose Your Submission Platform</h3>
          <PlatformInstructions
            acceptedPlatforms={assignment.acceptedLinkTypes}
            selectedPlatform={submissionHooks.selectedPlatform}
            onPlatformSelect={submissionHooks.setSelectedPlatform}
          />
        </div>
      )}

      {/* Submission Form */}
      {submissionHooks.selectedPlatform && (
        <SubmissionForm
          form={submissionHooks.form}
          selectedPlatform={submissionHooks.selectedPlatform}
          onSubmit={submissionHooks.handleSubmit}
          onUrlChange={handleUrlChange}
          isSubmitting={submissionHooks.isSubmitting}
          isExistingSubmission={submissionHooks.isExistingSubmission}
          assignment={assignment}
        />
      )}
    </div>
  );
}
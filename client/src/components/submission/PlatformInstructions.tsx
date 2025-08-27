import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ExternalLink } from 'lucide-react';

export const PLATFORM_CONFIGS = {
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
      'Copy the board URL from your browser',
      'Share the link with a descriptive title'
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
      'Click "Share" and select "Anyone with the link"',
      'Copy the sharing link',
      'Submit the link with your design title'
    ],
    urlPattern: /canva\.com/
  },
  prezi: {
    name: 'Prezi',
    icon: '🎯',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-900/10',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    instructions: [
      'Finish your Prezi presentation',
      'Click "Share" and enable public viewing',
      'Copy the presentation URL',
      'Submit with your presentation title'
    ],
    urlPattern: /prezi\.com/
  }
};

interface PlatformInstructionsProps {
  acceptedPlatforms: string[];
  selectedPlatform?: string | null;
  onPlatformSelect?: (platform: string) => void;
}

export function PlatformInstructions({ 
  acceptedPlatforms, 
  selectedPlatform, 
  onPlatformSelect 
}: PlatformInstructionsProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
        Accepted Platforms:
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {acceptedPlatforms.map((platformKey) => {
          const platform = PLATFORM_CONFIGS[platformKey as keyof typeof PLATFORM_CONFIGS];
          if (!platform) return null;
          
          const isSelected = selectedPlatform === platformKey;
          
          return (
            <Card
              key={platformKey}
              className={`cursor-pointer transition-all duration-200 ${
                isSelected 
                  ? `${platform.borderColor} ${platform.bgColor} ring-2 ring-offset-2` 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onPlatformSelect?.(platformKey)}
              data-testid={`platform-${platformKey}`}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{platform.icon}</span>
                    <span className={platform.color}>{platform.name}</span>
                  </div>
                  {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                </CardTitle>
              </CardHeader>
              
              {isSelected && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      Submission Steps:
                    </div>
                    <ol className="text-xs space-y-1">
                      {platform.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <span className="text-gray-400 mt-0.5">{index + 1}.</span>
                          <span className="text-gray-600 dark:text-gray-400">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
      
      {selectedPlatform && (
        <div className="flex items-center space-x-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>Platform selected. Follow the steps above to prepare your submission.</span>
        </div>
      )}
    </div>
  );
}
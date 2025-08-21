import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: string;
  authorId: string;
  createdAt: string;
  scheduledFor?: string;
  published: boolean;
  isUnread?: boolean;
}

interface AnnouncementFeedProps {
  classroomId: string;
  maxAnnouncements?: number;
  showCreateButton?: boolean;
  onCreateClick?: () => void;
}

export default function AnnouncementFeed({ 
  classroomId, 
  maxAnnouncements = 10, 
  showCreateButton = false,
  onCreateClick 
}: AnnouncementFeedProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch announcements
  const { data: announcements, isLoading } = useQuery<Announcement[]>({
    queryKey: ["/api/announcements/classroom", classroomId],
    enabled: !!classroomId,
    refetchInterval: 30000, // Refresh every 30 seconds for new announcements
  });

  // Mark announcement as read mutation (students only)
  const markAsReadMutation = useMutation({
    mutationFn: async (announcementId: string) => {
      const response = await apiRequest('POST', `/api/announcements/${announcementId}/read`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/classroom", classroomId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to mark announcement as read",
        variant: "destructive",
      });
    },
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <i className="fas fa-exclamation text-xs"></i>
            Urgent
          </Badge>
        );
      case 'high':
        return (
          <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
            <i className="fas fa-chevron-up text-xs"></i>
            High
          </Badge>
        );
      case 'normal':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <i className="fas fa-minus text-xs"></i>
            Normal
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="flex items-center gap-1 text-gray-600">
            <i className="fas fa-chevron-down text-xs"></i>
            Low
          </Badge>
        );
      default:
        return null;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'assignment':
        return 'fas fa-tasks text-blue-500';
      case 'event':
        return 'fas fa-calendar text-purple-500';
      case 'reminder':
        return 'fas fa-bell text-yellow-500';
      case 'policy':
        return 'fas fa-clipboard-list text-gray-500';
      default:
        return 'fas fa-bullhorn text-green-500';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const handleMarkAsRead = (announcementId: string) => {
    if (user?.role === 'student') {
      markAsReadMutation.mutate(announcementId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showCreateButton && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
            <div className="w-32 h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        )}
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                  <div className="flex items-center gap-2">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                    <div className="h-5 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-4/5"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const displayedAnnouncements = announcements?.slice(0, maxAnnouncements) || [];

  return (
    <div className="space-y-4">
      {showCreateButton && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Announcements</h2>
            <p className="text-gray-600">{announcements?.length || 0} total announcements</p>
          </div>
          {user?.role === 'teacher' && (
            <Button
              onClick={onCreateClick}
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
              data-testid="button-create-announcement"
            >
              <i className="fas fa-plus mr-2"></i>
              New Announcement
            </Button>
          )}
        </div>
      )}

      {displayedAnnouncements.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <i className="fas fa-bullhorn text-4xl text-gray-400 mb-4"></i>
            <h3 className="text-lg font-medium text-gray-800 mb-2">No Announcements Yet</h3>
            <p className="text-gray-600 mb-4">
              {user?.role === 'teacher'
                ? "Share important updates and information with your students."
                : "Your teacher hasn't posted any announcements yet."
              }
            </p>
            {user?.role === 'teacher' && onCreateClick && (
              <Button
                onClick={onCreateClick}
                variant="outline"
                data-testid="button-create-first-announcement"
              >
                <i className="fas fa-plus mr-2"></i>
                Create First Announcement
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {displayedAnnouncements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card 
                className={`hover:shadow-md transition-shadow duration-200 ${
                  announcement.isUnread ? 'border-blue-200 bg-blue-50' : ''
                } ${
                  announcement.priority === 'urgent' ? 'border-red-200 shadow-md' : ''
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 text-lg">
                          {announcement.title}
                        </h3>
                        {announcement.isUnread && user?.role === 'student' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-1">
                          <i className={getCategoryIcon(announcement.category)}></i>
                        </div>
                        {getPriorityBadge(announcement.priority)}
                        {announcement.isUnread && user?.role === 'student' && (
                          <Badge className="bg-blue-100 text-blue-800">New</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500 text-right">
                      {formatDate(announcement.createdAt)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {announcement.content}
                  </p>
                  
                  {user?.role === 'student' && announcement.isUnread && (
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsRead(announcement.id)}
                        disabled={markAsReadMutation.isPending}
                        data-testid={`button-mark-read-${announcement.id}`}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                      >
                        <i className="fas fa-check mr-1"></i>
                        Mark as Read
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
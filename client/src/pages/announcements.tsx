import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import AnnouncementFeed from "@/components/announcements/announcement-feed";
import CreateAnnouncementModal from "@/components/announcements/create-announcement-modal";

export default function Announcements() {
  const { user } = useAuth();

  // Get user's classrooms
  const { data: classrooms, isLoading } = useQuery({
    queryKey: ["/api/classrooms"],
    enabled: !!user
  });

  const currentClassroom = classrooms?.[0];

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!currentClassroom) {
    return (
      <div className="p-4 lg:p-6">
        <div className="text-center py-12">
          <i className="fas fa-bullhorn text-4xl text-gray-400 mb-4"></i>
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Classroom Found</h3>
          <p className="text-gray-600">
            {user?.role === 'teacher' 
              ? "Create a classroom to post announcements."
              : "Join a classroom to see announcements."
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <i className="fas fa-bullhorn text-blue-500"></i>
              Classroom Announcements
            </h1>
            <p className="text-gray-600">
              {currentClassroom.name} • {currentClassroom.subject || 'General'}
            </p>
          </div>

          {user?.role === 'teacher' && (
            <CreateAnnouncementModal 
              classroomId={currentClassroom.id}
              onSuccess={() => {
                // Could add additional success handling here
              }}
            >
              <div className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer flex items-center gap-2">
                <i className="fas fa-plus"></i>
                New Announcement
              </div>
            </CreateAnnouncementModal>
          )}
        </div>

        {/* Announcement Feed */}
        <AnnouncementFeed
          classroomId={currentClassroom.id}
          showCreateButton={false} // We have the button in header
          onCreateClick={() => {
            // This won't be called since showCreateButton is false
          }}
        />
      </motion.div>
    </div>
  );
}
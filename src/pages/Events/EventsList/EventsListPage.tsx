import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../../hooks/useEvents';
import { EventPost } from '../../../types/event';
import PostedPostsSection from '../../../components/Events/PostedPosts/PostedPostsSection';

const EventsListPage = () => {
  const navigate = useNavigate();
  const { events, deleteEvent, loading, refetch } = useEvents();

  // Ensure events are fetched when this page mounts
  useEffect(() => {
    refetch();
  }, [refetch]);

  const handleEditEvent = (event: EventPost) => {
    // Navigate to new-event page with edit parameter
    navigate(`/events/new-event?edit=${event.id}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-900 dark:text-white font-medium">Loading your events</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait while we fetch your events...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PostedPostsSection 
        posts={events}
        onEditPost={handleEditEvent}
        onDeletePost={handleDeleteEvent}
      />
    </div>
  );
};

export default EventsListPage;

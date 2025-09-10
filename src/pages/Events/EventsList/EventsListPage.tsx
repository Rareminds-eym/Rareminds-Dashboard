import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../../hooks/useEvents';
import { EventPost } from '../../../types/event';
import PostedPostsSection from '../../../components/Events/PostedPosts/PostedPostsSection';

const EventsListPage = () => {
  const navigate = useNavigate();
  const { events, deleteEvent } = useEvents();

  const handleEditEvent = (event: EventPost) => {
    // Navigate to new-event page with edit parameter
    navigate(`/events/new-event?edit=${event.id}`);
  };

  const handleDeleteEvent = async (eventId: string) => {
    await deleteEvent(eventId);
  };

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

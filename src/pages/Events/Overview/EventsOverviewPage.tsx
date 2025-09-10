import { useNavigate } from 'react-router-dom';
import { useEvents } from '../../../hooks/useEvents';
import DashboardOverview from '../../../components/Events/Dashboard/DashboardOverview';

const EventsOverviewPage = () => {
  const navigate = useNavigate();
  const { events } = useEvents();

  const handleNewEvent = () => {
    navigate('/events/new-event');
  };

  const handleViewEvents = () => {
    navigate('/events/list');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <DashboardOverview 
        events={events} 
        onNewEvent={handleNewEvent}
        onViewEvents={handleViewEvents}
      />
    </div>
  );
};

export default EventsOverviewPage;

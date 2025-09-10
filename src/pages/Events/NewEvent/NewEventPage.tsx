import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEvents } from '../../../hooks/useEvents';
import { EventPost } from '../../../types/event';
import EventPostManager from '../../../components/Events/EventPostManager';

const NewEventPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { events, loading, getEventById } = useEvents();
  const [editingEvent, setEditingEvent] = useState<EventPost | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const inFlightFetchId = useRef<string | null>(null);

  // Memoize the current edit id to avoid effect churn
  const editId = useMemo(() => searchParams.get('edit'), [searchParams]);
  
  // Load event data when edit ID is present
  useEffect(() => {
    if (!editId) {
      setEditingEvent(null);
      inFlightFetchId.current = null;
      return;
    }

    // If we already have the correct event loaded, skip
    if (editingEvent?.id === editId) return;

    // Try cache first
    const foundEvent = events.find(e => e.id === editId);
    if (foundEvent) {
      if (editingEvent?.id !== foundEvent.id) {
        console.log('Found event in cache for editing:', foundEvent);
        setEditingEvent(foundEvent);
      }
      return;
    }

    // Avoid duplicate fetches of the same id
    if (loadingEvent || inFlightFetchId.current === editId) return;
    if (loading) return;

    inFlightFetchId.current = editId;
    console.log('Event not found in cache, fetching by ID:', editId);
    setLoadingEvent(true);
    getEventById(editId)
      .then((event) => {
        if (event) {
          // Only set if different
          if (editingEvent?.id !== event.id) {
            console.log('Fetched event by ID:', event);
            setEditingEvent(event);
          }
        } else {
          console.warn('Event not found with ID:', editId);
          setEditingEvent(null);
        }
      })
      .finally(() => {
        setLoadingEvent(false);
        inFlightFetchId.current = null;
      });
  }, [editId, events, loading, getEventById, loadingEvent, editingEvent]);

  const handleEventSaved = () => {
    console.log('Event saved, navigating to events list...');
    // Navigate to events list after saving
    navigate('/events/list');
  };

  // Show loading state while events are being fetched
  if ((loading || loadingEvent) && searchParams.get('edit')) {
    return (
      <div className="animate-in fade-in duration-500 flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-900 dark:text-white font-medium">Loading event data</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait while we fetch the event details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <EventPostManager 
        editingEvent={editingEvent}
        onEventSaved={handleEventSaved}
      />
    </div>
  );
};

export default NewEventPage;

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useEvents } from '../../../hooks/useEvents';
import { EventFormData } from '../../../types/event';
import EventPostManager from '../../../components/Events/EventPostManager';

const NewEventPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loading, getEventById } = useEvents();
  const [editingEvent, setEditingEvent] = useState<EventFormData | null>(null);
  const [loadingEvent, setLoadingEvent] = useState(false);
  const inFlightFetchId = useRef<string | null>(null);
  // Tracks the last event ID successfully loaded for editing to prevent re-fetches
  const loadedEventId = useRef<string | null>(null);

  // Memoize the current edit id to avoid effect churn
  const editId = useMemo(() => searchParams.get('edit'), [searchParams]);

  // Load full event data (including section content) when edit ID is present.
  // getEventById returns EventFormData populated with all section content.
  useEffect(() => {
    if (!editId) {
      setEditingEvent(null);
      loadedEventId.current = null;
      inFlightFetchId.current = null;
      return;
    }

    // Already loaded this exact event — skip
    if (loadedEventId.current === editId) return;

    // Avoid duplicate in-flight fetches
    if (loadingEvent || inFlightFetchId.current === editId) return;
    if (loading) return;

    inFlightFetchId.current = editId;
    console.log('Fetching event with section content for editing:', editId);
    setLoadingEvent(true);
    getEventById(editId)
      .then((formData) => {
        if (formData) {
          console.log('Fetched event form data for editing:', formData);
          setEditingEvent(formData);
          loadedEventId.current = editId;
        } else {
          console.warn('Event not found with ID:', editId);
          setEditingEvent(null);
          loadedEventId.current = null;
        }
      })
      .finally(() => {
        setLoadingEvent(false);
        inFlightFetchId.current = null;
      });
  }, [editId, loading, getEventById, loadingEvent]);

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

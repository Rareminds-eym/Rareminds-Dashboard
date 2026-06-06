import { useState, useEffect, useCallback, useMemo } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { EventFormData } from '../../types/event';
import EventFormSection from './NewPost/NewPostSection';
import { useToast } from '../../hooks/use-toast';

interface EventPostManagerProps {
  editingEvent?: EventFormData | null;
  onEventSaved?: () => void;
}

const EventPostManager = ({ editingEvent: externalEditingEvent, onEventSaved }: EventPostManagerProps) => {
  const [editingPost, setEditingPost] = useState<EventFormData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { createEvent, updateEvent } = useEvents();
  const { toast } = useToast();

  console.log('EventPostManager rendered with editingEvent:', externalEditingEvent);

  // Memoize the event ID to reduce unnecessary effect runs
  const editingEventId = useMemo(() => externalEditingEvent?.id, [externalEditingEvent?.id]);

  // Update internal editing state when external prop changes
  useEffect(() => {
    // Only update if the event actually changed (by ID)
    if (!externalEditingEvent && !editingPost) return;
    if (externalEditingEvent?.id === editingPost?.id) return;

    console.log('EventPostManager useEffect - setting editingPost to:', externalEditingEvent);
    if (externalEditingEvent) {
      console.log('Event ID being set for editing:', externalEditingEvent.id, 'Type:', typeof externalEditingEvent.id);
    }
    setEditingPost(externalEditingEvent || null);
  }, [externalEditingEvent, editingEventId, editingPost]);

  const handlePostSaved = useCallback(async (formData: EventFormData) => {
    console.log('EventPostManager - handlePostSaved called with:', formData);

    try {
      setIsSaving(true);
      console.log('handlePostSaved - Start processing:', { editingPost, formData });

      if (editingPost) {
        console.log('Updating existing event with ID:', editingPost.id);
        console.log('editingPost object:', editingPost);
        // Update existing event
        const updatedEvent = await updateEvent(editingPost.id, formData);
        console.log('updateEvent result:', updatedEvent);
        if (updatedEvent) {
          setEditingPost(null);
          console.log('Event updated successfully');
          toast({
            title: "Success",
            description: "Event updated successfully!",
            variant: "default"
          });
          // Notify parent component
          onEventSaved?.();
        } else {
          console.log('updateEvent returned null');
          throw new Error('Update failed - no data returned');
        }
      } else {
        console.log('Creating new event...');
        // Create new event
        const newEvent = await createEvent(formData);
        console.log('createEvent result:', newEvent);
        if (newEvent) {
          toast({
            title: "Success",
            description: "Event created successfully!",
            variant: "default"
          });
          // Notify parent component
          onEventSaved?.();
        } else {
          console.log('createEvent returned null - this means an error occurred');
          throw new Error('Create failed - no data returned');
        }
      }
    } catch (error) {
      console.error('Error in handlePostSaved:', error);
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('Full error object:', error);

      const errorMessage = error instanceof Error ? error.message : 'Failed to save event. Please try again.';
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [editingPost, updateEvent, createEvent, toast, onEventSaved]);

  return (
    <EventFormSection
      onPostSaved={handlePostSaved}
      editingPost={editingPost}
      isSaving={isSaving}
    />
  );
};

export default EventPostManager;

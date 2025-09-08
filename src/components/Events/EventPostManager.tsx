import { useState, useEffect } from 'react';
import { useEvents } from '../../hooks/useEvents';
import { EventPost, EventFormData } from '../../types/event';
import EventFormSection from './NewPost/NewPostSection';
import { useToast } from '../../hooks/use-toast';

interface EventPostManagerProps {
  editingEvent?: EventPost | null;
  onEventSaved?: () => void;
}

const EventPostManager = ({ editingEvent: externalEditingEvent, onEventSaved }: EventPostManagerProps) => {
  const [editingPost, setEditingPost] = useState<EventPost | null>(null);
  const { createEvent, updateEvent } = useEvents();
  const { toast } = useToast();

  console.log('EventPostManager rendered with editingEvent:', externalEditingEvent);

  // Update internal editing state when external prop changes
  useEffect(() => {
    console.log('EventPostManager useEffect - setting editingPost to:', externalEditingEvent);
    if (externalEditingEvent) {
      console.log('Event ID being set for editing:', externalEditingEvent.id, 'Type:', typeof externalEditingEvent.id);
    }
    setEditingPost(externalEditingEvent || null);
  }, [externalEditingEvent]);

  const handlePostSaved = async (eventData: EventPost) => {
    console.log('EventPostManager - handlePostSaved called with:', eventData);
    
    // Convert EventPost to EventFormData format
    const formData: EventFormData = {
      title: eventData.title,
      description: eventData.description,
      event_date: eventData.event_date,
      event_time: eventData.event_time,
      duration: eventData.duration,
      location: eventData.location,
      is_physical: eventData.is_physical,
      event_link: eventData.event_link,
      organizer_name: eventData.organizer_name,
      organizer_email: eventData.organizer_email,
      organizer_phone: eventData.organizer_phone,
      capacity: eventData.capacity,
      category: eventData.category,
      price: eventData.price,
      registration_deadline: eventData.registration_deadline,
      requirements: eventData.requirements,
      agenda: eventData.agenda,
      speakers_details: eventData.speakers_details || [],
      sponsors: eventData.sponsors || [],
      additional_contact_info: eventData.additional_contact_info,
      status: eventData.status,
      event_banner: eventData.event_banner,
      featured_image: eventData.featured_image,
      event_tags: eventData.event_tags || [],
      seo: {
        meta_title: eventData.meta_title,
        meta_description: eventData.meta_description,
        slug: eventData.slug,
      },
    };

    console.log('Converted formData:', formData);
    console.log('FormData validation check:', {
      hasTitle: !!formData.title,
      hasDescription: !!formData.description,
      hasEventDate: !!formData.event_date,
      hasEventTime: !!formData.event_time,
      hasLocation: !!formData.location,
      hasOrganizerName: !!formData.organizer_name,
      hasOrganizerEmail: !!formData.organizer_email,
      hasCategory: !!formData.category,
      formDataKeys: Object.keys(formData)
    });

    try {
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
    }
  };

  return (
    <EventFormSection
      onPostSaved={handlePostSaved}
      editingPost={editingPost}
    />
  );
};

export default EventPostManager;
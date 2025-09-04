import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { EventPost, EventFormData } from '../types/event';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import type { Database } from '../integrations/supabase/types';

type EventRow = Database['public']['Tables']['events']['Row'];

export const useEvents = () => {
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();

  // Helper function to translate database errors to user-friendly messages
  const getDatabaseErrorMessage = (error: any): string => {
    if (error?.code === '23502') {
      // NOT NULL constraint violation
      const column = error.message.match(/column "([^"]+)"/)?.[1];
      if (column) {
        const fieldNames: { [key: string]: string } = {
          'organizer_phone': 'Organizer Phone',
          'title': 'Event Title',
          'description': 'Event Description',
          'event_date': 'Event Date',
          'event_time': 'Event Time',
          'duration': 'Duration',
          'location': 'Location',
          'organizer_name': 'Organizer Name',
          'organizer_email': 'Organizer Email',
          'category': 'Category',
        };
        const friendlyName = fieldNames[column] || column;
        return `The field "${friendlyName}" is required and cannot be empty. Please fill in this field.`;
      }
      return 'Some required fields are empty. Please fill in all required fields.';
    }
    
    if (error?.code === '23505') {
      // UNIQUE constraint violation
      return 'An event with similar details already exists. Please check for duplicates.';
    }
    
    if (error?.code === '23503') {
      // FOREIGN KEY constraint violation
      return 'Invalid reference data. Please check your selections and try again.';
    }
    
    if (error?.code === '42501') {
      // Insufficient privilege
      return 'You do not have permission to perform this action.';
    }
    
    // Default error message
    return error?.message || 'An unexpected database error occurred. Please try again.';
  };

  // Helper function to convert database row to EventPost
  const dbRowToEventPost = (row: EventRow): EventPost => {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title || '',
      description: row.description || '',
      event_date: row.event_date || '',
      event_time: row.event_time || '',
      duration: row.duration || '',
      location: row.location || '',
      organizer_name: row.organizer_name || '',
      organizer_email: row.organizer_email || '',
      organizer_phone: row.organizer_phone || null,
      capacity: row.capacity || 0,
      category: row.category || '',
      price: row.price || null,
      registration_deadline: row.registration_deadline || null,
      requirements: row.requirements || null,
      agenda: row.agenda || null,
      speakers: row.speakers || null,
      sponsors: row.sponsors || null,
      additional_contact_info: row.additional_contact_info || null,
      status: (row.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled') || 'upcoming',
      event_banner: row.event_banner || null,
      featured_image: row.featured_image || null,
      event_tags: row.event_tags || null,
      meta_title: row.meta_title || '',
      meta_description: row.meta_description || '',
      slug: row.slug || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    };
  };

  // Fetch all events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const eventsWithParsedTags = data?.map(dbRowToEventPost) || [];
      setEvents(eventsWithParsedTags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new event
  const createEvent = async (eventData: EventFormData): Promise<EventPost | null> => {
    console.log('useEvents - createEvent called with:', eventData);
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user:', user);
      if (!user) {
        console.log('User not authenticated');
        throw new Error('You must be logged in to create events. Please log in and try again.');
      }

      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.event_date || 
          !eventData.event_time || !eventData.duration || !eventData.location || !eventData.organizer_name || 
          !eventData.organizer_email || !eventData.category) {
        console.log('Validation failed in useEvents:', {
          title: !!eventData.title,
          description: !!eventData.description,
          event_date: !!eventData.event_date,
          event_time: !!eventData.event_time,
          duration: !!eventData.duration,
          location: !!eventData.location,
          organizer_name: !!eventData.organizer_name,
          organizer_email: !!eventData.organizer_email,
          category: !!eventData.category
        });
        throw new Error('Missing required fields for event creation');
      }

      // Ensure SEO fields have values
      const meta_title = eventData.seo.meta_title || eventData.title;
      const meta_description = eventData.seo.meta_description || eventData.description.substring(0, 160);
      const slug = eventData.seo.slug || eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      console.log('SEO fields:', { meta_title, meta_description, slug });

      const newEvent = {
        user_id: user.id,
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        event_time: eventData.event_time,
        duration: eventData.duration,
        location: eventData.location,
        organizer_name: eventData.organizer_name,
        organizer_email: eventData.organizer_email,
        organizer_phone: eventData.organizer_phone || '',
        capacity: eventData.capacity,
        category: eventData.category,
        price: eventData.price || null,
        registration_deadline: eventData.registration_deadline || null,
        requirements: eventData.requirements || null,
        agenda: eventData.agenda || null,
        speakers: eventData.speakers || null,
        sponsors: eventData.sponsors || null,
        additional_contact_info: eventData.additional_contact_info || null,
        status: eventData.status,
        event_banner: eventData.event_banner || null,
        featured_image: eventData.featured_image || null,
        event_tags: eventData.event_tags || null,
        meta_title,
        meta_description,
        slug,
      };

      console.log('Prepared newEvent for database:', newEvent);
      console.log('About to insert into Supabase events table...');

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      console.log('Database insert result:', { data, error });
      if (error) {
        console.error('Database insert error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      const createdEvent = dbRowToEventPost(data);
      setEvents(prev => [createdEvent, ...prev]);
      
      toast({
        title: "Success",
        description: "Event created successfully!",
        variant: "default"
      });

      return createdEvent;
    } catch (err) {
      console.error('createEvent error:', err);
      const errorMessage = getDatabaseErrorMessage(err);
      console.error('Error details:', {
        error: err,
        message: errorMessage,
        eventData
      });
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing event
  const updateEvent = async (id: string, eventData: EventFormData): Promise<EventPost | null> => {
    console.log('useEvents - updateEvent called with:', { id, eventData });
    console.log('Event ID type:', typeof id, 'Value:', id);
    
    if (!id || id.trim() === '') {
      throw new Error('Invalid event ID provided for update');
    }
    try {
      setLoading(true);
      setError(null);

      // Get current user to ensure authentication
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user for update:', user);
      if (!user) {
        console.log('User not authenticated for update');
        throw new Error('You must be logged in to update events. Please log in and try again.');
      }

      // First, check if the event exists and belongs to the user
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      console.log('Existing event check:', { existingEvent, fetchError });
      if (fetchError) {
        console.error('Error fetching existing event:', fetchError);
        throw new Error(`Event not found: ${fetchError.message}`);
      }

      if (!existingEvent) {
        throw new Error('Event not found');
      }

      // Check if user owns the event or is an owner
      if (existingEvent.user_id !== user.id && userRole !== 'owner') {
        console.log('Permission denied - user does not own event');
        throw new Error('You can only update your own events');
      }

      // Validate required fields
      if (!eventData.title || !eventData.description || !eventData.event_date || 
          !eventData.event_time || !eventData.duration || !eventData.location || !eventData.organizer_name || 
          !eventData.organizer_email || !eventData.category) {
        console.log('Validation failed in updateEvent:', {
          title: !!eventData.title,
          description: !!eventData.description,
          event_date: !!eventData.event_date,
          event_time: !!eventData.event_time,
          duration: !!eventData.duration,
          location: !!eventData.location,
          organizer_name: !!eventData.organizer_name,
          organizer_email: !!eventData.organizer_email,
          category: !!eventData.category
        });
        throw new Error('Missing required fields for event update');
      }

      // Ensure SEO fields have values
      const meta_title = eventData.seo.meta_title || eventData.title;
      const meta_description = eventData.seo.meta_description || eventData.description.substring(0, 160);
      const slug = eventData.seo.slug || eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      console.log('Update SEO fields:', { meta_title, meta_description, slug });

      const updatedEvent = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        event_time: eventData.event_time,
        duration: eventData.duration,
        location: eventData.location,
        organizer_name: eventData.organizer_name,
        organizer_email: eventData.organizer_email,
        organizer_phone: eventData.organizer_phone || '',
        capacity: eventData.capacity,
        category: eventData.category,
        price: eventData.price || null,
        registration_deadline: eventData.registration_deadline || null,
        requirements: eventData.requirements || null,
        agenda: eventData.agenda || null,
        speakers: eventData.speakers || null,
        sponsors: eventData.sponsors || null,
        additional_contact_info: eventData.additional_contact_info || null,
        status: eventData.status,
        event_banner: eventData.event_banner || null,
        featured_image: eventData.featured_image || null,
        event_tags: eventData.event_tags || null,
        meta_title,
        meta_description,
        slug,
        updated_at: new Date().toISOString(),
      };

      console.log('Prepared updatedEvent for database:', updatedEvent);
      console.log('About to update event with ID:', id);
      console.log('User ID:', user.id);
      console.log('User role:', userRole);

      // Perform the update with user ownership check
      let updateQuery = supabase
        .from('events')
        .update(updatedEvent)
        .eq('id', id);

      // If user is not an owner, add additional security check
      if (userRole !== 'owner') {
        console.log('Adding user_id filter for non-owner user');
        updateQuery = updateQuery.eq('user_id', user.id);
      }

      console.log('Executing update query...');
      // First try the update without .single() to see if rows were affected
      const updateResult = await updateQuery;
      console.log('Update operation result:', updateResult);
      
      if (updateResult.error) {
        console.error('Database update error details:', {
          message: updateResult.error.message,
          details: updateResult.error.details,
          hint: updateResult.error.hint,
          code: updateResult.error.code
        });
        throw updateResult.error;
      }
      
      console.log('Update count:', updateResult.count);
      console.log('Update status:', updateResult.status);
      console.log('Update statusText:', updateResult.statusText);
      
      // If no rows were affected, the event might not exist or user lacks permission
      if (updateResult.count === 0) {
        console.log('No rows were updated - checking if event exists...');
        
        // Check if the event exists
        const { data: checkEvent, error: checkError } = await supabase
          .from('events')
          .select('id, user_id, title')
          .eq('id', id)
          .single();
          
        if (checkError || !checkEvent) {
          throw new Error(`Event with ID ${id} does not exist`);
        } else if (checkEvent.user_id !== user.id && userRole !== 'owner') {
          throw new Error('You do not have permission to update this event');
        } else {
          throw new Error('Update failed for unknown reason - no rows affected');
        }
      }
      
      // Now fetch the updated event data
      console.log('Fetching updated event data...');
      const { data: updatedData, error: updateFetchError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
        
      if (updateFetchError) {
        console.error('Error fetching updated event:', updateFetchError);
        throw new Error(`Update succeeded but failed to fetch updated event: ${updateFetchError.message}`);
      }
      
      if (!updatedData) {
        throw new Error(`Event with ID ${id} not found after update`);
      }
      
      console.log('Successfully fetched updated event:', updatedData);

      const updatedEventWithTags = dbRowToEventPost(updatedData);
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEventWithTags : event
      ));
      
      toast({
        title: "Success",
        description: "Event updated successfully!",
        variant: "default"
      });

      return updatedEventWithTags;
    } catch (err) {
      console.error('updateEvent error:', err);
      const errorMessage = getDatabaseErrorMessage(err);
      console.error('Update error details:', {
        error: err,
        message: errorMessage,
        eventData,
        eventId: id
      });
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete an event
  const deleteEvent = async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete events",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // First, check if the event exists and get its owner
      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching event before deletion:', fetchError);
        toast({
          title: "Error",
          description: `Failed to find event: ${fetchError.message}`,
          variant: "destructive"
        });
        return false;
      }

      if (!existingEvent) {
        toast({
          title: "Error",
          description: "Event not found",
          variant: "destructive"
        });
        return false;
      }

      // Check if user owns the event or is an owner (can delete any event)
      if (existingEvent.user_id !== user.id && userRole !== 'owner') {
        toast({
          title: "Error",
          description: "You can only delete your own events",
          variant: "destructive"
        });
        return false;
      }

      // Now attempt the deletion
      let deleteQuery = supabase
        .from('events')
        .delete()
        .eq('id', id);

      // If user is not an owner, add additional security check
      if (userRole !== 'owner') {
        deleteQuery = deleteQuery.eq('user_id', user.id);
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== id));
      
      toast({
        title: "Success",
        description: "Event deleted successfully!",
        variant: "default"
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get a single event by ID
  const getEventById = async (id: string): Promise<EventPost | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const eventWithTags = dbRowToEventPost(data);
      return eventWithTags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch event';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load events on hook initialization
  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, fetchEvents]);

  return {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    refetch: fetchEvents,
  };
};
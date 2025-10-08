import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { EventPost, EventFormData } from '../types/event';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import type { Database } from '../integrations/supabase/types';

type EventRow = Database['public']['Tables']['events']['Row'];

// Simple in-memory cache to avoid refetch flash between tabs/routes
let __eventsCache: EventPost[] = [];
let __eventsFetchedOnce = false;

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
      is_physical: (row as any).is_physical ?? true,
      event_link: (row as any).event_link || null,
      organizer_name: row.organizer_name || '',
      organizer_email: row.organizer_email || '',
      organizer_phone: row.organizer_phone || null,
      capacity: row.capacity || 0,
      category: row.category || '',
      price: row.price || 'FREE',
      registration_deadline: row.registration_deadline || null,
      requirements: row.requirements || null,
      agenda: row.agenda || null,
      speakers_details: row.speakers_details || null,
      sponsors: row.sponsors || null,
      additional_contact_info: row.additional_contact_info || null,
      status: (row.status as 'upcoming' | 'ongoing' | 'completed' | 'cancelled') || 'upcoming',
      event_banner: row.event_banner || null,
      featured_image: row.featured_image || null,
      mobile_featured_image: (row as any).mobile_featured_image || null,
      event_tags: row.event_tags || null,
      key_highlights: row.key_highlights || null,
      events_gallery: Array.isArray((row as any).events_gallery) ? (row as any).events_gallery : null,
      teaser_video: (row as any).teaser_video || null,
      enquiry_pdf: (row as any).enquiry_pdf || null,
      faq: Array.isArray(row.faq as any) ? (row.faq as any) : [],
      meta_title: row.meta_title || '',
      meta_description: row.meta_description || '',
      slug: row.slug || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      location_latitude: row.location_latitude ?? null,
      location_longitude: row.location_longitude ?? null,
      languages: Array.isArray((row as any).languages) ? (row as any).languages : null,
    };
  };

  // Fetch all events with pagination to ensure we get everything without timeouts
  const fetchEvents = useCallback(async () => {
    console.log('fetchEvents called');
    try {
      // If there's no authenticated user, avoid querying and clear loading quickly
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        __eventsFetchedOnce = true;
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      // Safety timer so UI never gets stuck in loading
      let timedOut = false;
      const safetyTimer = setTimeout(() => {
        timedOut = true;
        setLoading(false);
        setError('Fetching events took too long. You can retry.');
      }, 20000);

      const pageSize = 200; // conservative chunk size
      let from = 0;
      let allRows: EventPost[] = [];

      for (let page = 0; page < 50; page++) { // hard cap to avoid infinite loops
        const to = from + pageSize - 1;
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('created_at', { ascending: false })
          .range(from, to);

        if (error) throw error;
        if (!data) break;

        const mapped = data.map(dbRowToEventPost);
        allRows = allRows.concat(mapped);

        if (data.length < pageSize) {
          break; // last page
        }
        from += pageSize;
      }

      clearTimeout(safetyTimer);
      if (timedOut) return; // UI already handled timeout guard

      console.log('Events fetched successfully (paged):', allRows.length, 'events');
      __eventsCache = allRows;
      __eventsFetchedOnce = true;
      setEvents(allRows);
    } catch (err: any) {
      const timedOutErr = err?.code === '57014' || err?.code === 'CLIENT_TIMEOUT';
      const errorMessage = timedOutErr
        ? 'Fetching events is taking too long. Please try again.'
        : err instanceof Error
          ? err.message
          : 'Failed to fetch events';
      setError(errorMessage);
      toast({
        title: timedOutErr ? 'Timeout' : 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new event
  const createEvent = useCallback(async (eventData: EventFormData): Promise<EventPost | null> => {
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

      // Validate required fields based on event type
      const requiredLocationField = eventData.is_physical ? eventData.location : eventData.event_link;
      
      if (!eventData.title || !eventData.description || !eventData.event_date || 
          !eventData.event_time || !eventData.duration || !requiredLocationField || !eventData.organizer_name || 
          !eventData.organizer_email || !eventData.category || !eventData.price) {
        console.log('Validation failed in useEvents:', {
          title: !!eventData.title,
          description: !!eventData.description,
          event_date: !!eventData.event_date,
          event_time: !!eventData.event_time,
          duration: !!eventData.duration,
          location: !!eventData.location,
          event_link: !!eventData.event_link,
          is_physical: eventData.is_physical,
          requiredLocationField: !!requiredLocationField,
          organizer_name: !!eventData.organizer_name,
          organizer_email: !!eventData.organizer_email,
          category: !!eventData.category,
          price: !!eventData.price
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
        location: eventData.is_physical ? eventData.location : '',
        is_physical: eventData.is_physical,
        event_link: eventData.is_physical ? null : eventData.event_link,
        organizer_name: eventData.organizer_name,
        organizer_email: eventData.organizer_email,
        organizer_phone: eventData.organizer_phone || '',
        capacity: eventData.capacity,
        category: eventData.category,
        price: eventData.price,
        registration_deadline: eventData.registration_deadline || null,
        requirements: eventData.requirements || null,
        agenda: eventData.agenda || null,
        speakers_details: eventData.speakers_details || null,
        sponsors: eventData.sponsors || null,
        additional_contact_info: eventData.additional_contact_info || null,
        status: eventData.status,
        event_banner: eventData.event_banner || null,
        featured_image: eventData.featured_image || null,
        mobile_featured_image: eventData.mobile_featured_image || null,
        event_tags: eventData.event_tags || null,
        key_highlights: eventData.key_highlights || null,
        languages: eventData.languages || [],
        events_gallery: eventData.events_gallery || [],
        teaser_video: eventData.teaser_video || null,
        faq: eventData.faq || [],
        meta_title,
        meta_description,
        slug,
        location_latitude: eventData.location_latitude ?? null,
        location_longitude: eventData.location_longitude ?? null,
      };

      console.log('Prepared newEvent for database:', newEvent);
      console.log('About to insert into Supabase events table...');

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      console.log('Supabase insert result:', { data, error });
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
      __eventsCache = [createdEvent, ...__eventsCache];
      __eventsFetchedOnce = true;
      
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
  }, [toast, userRole]);

  // Update an existing event
  const updateEvent = useCallback(async (id: string, eventData: EventFormData): Promise<EventPost | null> => {
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

      // Validate required fields based on event type
      const requiredLocationField = eventData.is_physical ? eventData.location : eventData.event_link;
      if (!eventData.title || !eventData.description || !eventData.event_date ||
          !eventData.event_time || !eventData.duration || !requiredLocationField || !eventData.organizer_name ||
          !eventData.organizer_email || !eventData.category || !eventData.price) {
        console.log('Validation failed in updateEvent:', {
          title: !!eventData.title,
          description: !!eventData.description,
          event_date: !!eventData.event_date,
          event_time: !!eventData.event_time,
          duration: !!eventData.duration,
          location: !!eventData.location,
          event_link: !!eventData.event_link,
          is_physical: eventData.is_physical,
          requiredLocationField: !!requiredLocationField,
          organizer_name: !!eventData.organizer_name,
          organizer_email: !!eventData.organizer_email,
          category: !!eventData.category,
          price: !!eventData.price
        });
        throw new Error('Missing required fields for event update');
      }

      // Ensure SEO fields have values
      const meta_title = eventData.seo.meta_title || eventData.title;
      const meta_description = eventData.seo.meta_description || eventData.description.substring(0, 160);
      const slug = eventData.seo.slug || eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      console.log('Update SEO fields:', { meta_title, meta_description, slug });

      // Build the full payload
      const fullPayload = {
        title: eventData.title,
        description: eventData.description,
        event_date: eventData.event_date,
        event_time: eventData.event_time,
        duration: eventData.duration,
        location: eventData.is_physical ? eventData.location : '',
        is_physical: eventData.is_physical,
        event_link: eventData.is_physical ? null : eventData.event_link,
        organizer_name: eventData.organizer_name,
        organizer_email: eventData.organizer_email,
        organizer_phone: eventData.organizer_phone || '',
        capacity: eventData.capacity,
        category: eventData.category,
        price: eventData.price,
        registration_deadline: eventData.registration_deadline || null,
        requirements: eventData.requirements || null,
        agenda: eventData.agenda || null,
        speakers_details: eventData.speakers_details || null,
        sponsors: eventData.sponsors || null,
        additional_contact_info: eventData.additional_contact_info || null,
        status: eventData.status,
        event_banner: eventData.event_banner || null,
        featured_image: eventData.featured_image || null,
        mobile_featured_image: eventData.mobile_featured_image || null,
        event_tags: eventData.event_tags || null,
        key_highlights: eventData.key_highlights || null,
        languages: eventData.languages || [],
        events_gallery: eventData.events_gallery || [],
        teaser_video: eventData.teaser_video || null,
        faq: eventData.faq || [],
        meta_title,
        meta_description,
        slug,
        updated_at: new Date().toISOString(),
        location_latitude: eventData.location_latitude ?? null,
        location_longitude: eventData.location_longitude ?? null
      } as Record<string, any>;

      // Only send fields that actually changed to avoid heavy updates that may time out
      const current = events.find(e => e.id === id);
      const diffPayload: Record<string, any> = {};
      for (const [key, value] of Object.entries(fullPayload)) {
        if (value === undefined) continue;
        if (current) {
          const prev = (current as any)[key];
          if (JSON.stringify(prev ?? null) === JSON.stringify(value ?? null)) continue;
        }
        diffPayload[key] = value;
      }

      if (Object.keys(diffPayload).length === 0) {
        console.log('No changes detected, skipping database update.');
        return current || null;
      }

      const performUpdate = async (payload: Record<string, any>) => {
        let q = supabase
          .from('events')
          // Use minimal return to reduce DB work
          .update(payload, { returning: 'minimal' as any })
          .eq('id', id);
        if (userRole !== 'owner') q = q.eq('user_id', user.id);
        const { error } = await q;
        if (error) throw error;
      };

      try {
        // First attempt with the diff payload
        await performUpdate(diffPayload);
      } catch (e: any) {
        // If the DB canceled due to statement timeout, split into smaller batches
        if (e?.code === '57014') {
          console.warn('Update timed out. Retrying with split payload...');
          const coreKeys = [
            'title','event_date','event_time','duration','location','is_physical','event_link',
            'organizer_name','organizer_email','organizer_phone','capacity','category','price',
            'registration_deadline','status','meta_title','meta_description','slug',
            'location_latitude','location_longitude','updated_at'
          ];
          const core: Record<string, any> = {};
          const heavy: Record<string, any> = {};
          for (const [k, v] of Object.entries(diffPayload)) {
            if (coreKeys.includes(k)) core[k] = v; else heavy[k] = v;
          }
          if (Object.keys(core).length > 0) await performUpdate(core);
          if (Object.keys(heavy).length > 0) await performUpdate(heavy);
        } else {
          throw e;
        }
      }

      // Fetch the updated row in a single lightweight query
      const { data: updatedData, error: fetchErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchErr) {
        console.error('Error fetching updated event:', fetchErr);
        throw new Error(`Update succeeded but failed to fetch updated event: ${fetchErr.message}`);
      }

      const updatedEventWithTags = dbRowToEventPost(updatedData);
      setEvents(prev => prev.map(event => (event.id === id ? updatedEventWithTags : event)));
      __eventsCache = __eventsCache.map(event => (event.id === id ? updatedEventWithTags : event));
      __eventsFetchedOnce = true;

      toast({ title: 'Success', description: 'Event updated successfully!', variant: 'default' });
      return updatedEventWithTags;
    } catch (err) {
      console.error('updateEvent error:', err);
      const errorMessage = getDatabaseErrorMessage(err);
      console.error('Update error details:', { error: err, message: errorMessage, eventData, eventId: id });
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, userRole, events]);

  // Delete an event
  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
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
      __eventsCache = __eventsCache.filter(event => event.id !== id);
      __eventsFetchedOnce = true;
      
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
  }, [toast, userRole, user]);

  // Get a single event by ID
  const getEventById = useCallback(async (id: string): Promise<EventPost | null> => {
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
  }, [toast]);

  // Load events on hook initialization
  useEffect(() => {
    console.log('useEvents useEffect:', { user: !!user, loading });
    if (!user) {
      console.log('No user, not fetching events');
      return;
    }

    // Serve from cache immediately to avoid flash on tab switch
    if (__eventsCache.length > 0) {
      console.log('Hydrating events from cache:', __eventsCache.length);
      setEvents(__eventsCache);
    }

    // Only fetch once per session unless user calls refetch
    if (!__eventsFetchedOnce) {
      console.log('Fetching events for the first time...');
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
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import {
  EventPost, EventFormData,
  EventCategory, EventStatus,
  ContentMetadata, MediaMetadata, OrganizerMetadata, LocationMetadata,
  GalleryItem, Speaker, FAQItem, StatItem, FeatureItem, TestimonialItem, CtaBadge,
} from '../types/event';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import type { Database, Json } from '../integrations/supabase/types';

type EventRow = Database['public']['Tables']['events']['Row'];

// Simple in-memory cache to avoid refetch flash between tabs/routes
let __eventsCache: EventPost[] = [];
let __eventsFetchedOnce = false;

// Upserts all six dynamic content sections for one event.
// Called sequentially after every create or update of the events row.
// On partial failure the events row already exists; user can re-save to retry.
async function saveSectionContent(eventId: string, eventData: EventFormData): Promise<void> {
  const sections: Array<{
    section_key: Database['public']['Tables']['entity_sections']['Insert']['section_key'];
    content_type: Database['public']['Tables']['entity_sections']['Insert']['content_type'];
    display_order: number;
    content: Record<string, unknown>;
  }> = [
    { section_key: 'hero',       content_type: 'text',    display_order: 0, content: { title: eventData.hero_title ?? '', description: eventData.hero_description ?? '', benefits: eventData.hero_benefits ?? [] } },
    { section_key: 'about',      content_type: 'text',    display_order: 1, content: { text: eventData.about ?? '' } },
    { section_key: 'highlights', content_type: 'list',    display_order: 2, content: { items: (eventData.highlights ?? []).map(text => ({ text })) } },
    { section_key: 'agenda',     content_type: 'text',    display_order: 3, content: { text: eventData.agenda ?? '' } },
    { section_key: 'gallery',    content_type: 'gallery', display_order: 4, content: { items: eventData.gallery ?? [] } },
    { section_key: 'speakers',   content_type: 'cards',   display_order: 5, content: { items: eventData.speakers ?? [] } },
    { section_key: 'faq',        content_type: 'faq',     display_order: 6, content: { items: eventData.faq ?? [] } },
    { section_key: 'stats',      content_type: 'stats',   display_order: 8, content: { items: eventData.stats ?? [] } },
    { section_key: 'features',      content_type: 'cards',   display_order: 9,  content: { items: eventData.features ?? [] } },
    { section_key: 'testimonials',  content_type: 'cards',   display_order: 10, content: { heading: eventData.testimonials_heading ?? '', tag: eventData.testimonials_tag ?? '', items: eventData.testimonials ?? [] } },
    { section_key: 'cta',           content_type: 'text',    display_order: 7,  content: { text: eventData.cta_text ?? '', subline: eventData.cta_subline ?? '', button: eventData.cta_button_label ?? 'Register Now', badges: eventData.cta_badges ?? [] } },
  ];

  for (const s of sections) {
    const { data: sectionRow, error: sErr } = await supabase
      .from('entity_sections')
      .upsert(
        {
          entity_type: 'event' as const,
          entity_id: eventId,
          section_key: s.section_key,
          content_type: s.content_type,
          display_order: s.display_order,
          is_active: true,
        },
        { onConflict: 'entity_type,entity_id,section_key' }
      )
      .select('id')
      .single();

    if (sErr) throw sErr;

    const { error: cErr } = await supabase
      .from('section_contents')
      .upsert(
        { entity_section_id: sectionRow.id, content: s.content as unknown as Json },
        { onConflict: 'entity_section_id' }
      );

    if (cErr) throw cErr;
  }
}

export const useEvents = () => {
  const [events, setEvents] = useState<EventPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();

  const getDatabaseErrorMessage = (error: any): string => {
    if (error?.code === '23502') {
      const column = error.message.match(/column "([^"]+)"/)?.[1];
      if (column) {
        const fieldNames: { [key: string]: string } = {
          'title': 'Event Title',
          'event_date': 'Event Date',
          'event_time': 'Event Time',
          'duration': 'Duration',
          'category': 'Category',
          'created_by': 'Creator',
        };
        const friendlyName = fieldNames[column] || column;
        return `The field "${friendlyName}" is required and cannot be empty. Please fill in this field.`;
      }
      return 'Some required fields are empty. Please fill in all required fields.';
    }
    if (error?.code === '23505') {
      return 'An event with similar details already exists. Please check for duplicates.';
    }
    if (error?.code === '23503') {
      return 'Invalid reference data. Please check your selections and try again.';
    }
    if (error?.code === '42501') {
      return 'You do not have permission to perform this action.';
    }
    return error?.message || 'An unexpected database error occurred. Please try again.';
  };

  // Maps a DB events row to EventPost — flat columns + JSONB column unpacking.
  // Section content (about/highlights/agenda/gallery/speakers/faq) is NOT included here;
  // call getEventById for a fully populated EventFormData when opening the edit form.
  const dbRowToEventPost = (row: EventRow): EventPost => {
    const cm = ((row.content_metadata  ?? {}) as unknown) as ContentMetadata;
    const mm = ((row.media_metadata    ?? {}) as unknown) as MediaMetadata;
    const om = ((row.organizer_metadata ?? {}) as unknown) as OrganizerMetadata;
    const lm = ((row.location_metadata  ?? {}) as unknown) as LocationMetadata;

    return {
      id: row.id,
      created_by: row.created_by,
      title: row.title ?? '',
      event_date: row.event_date ?? '',
      event_time: row.event_time ?? null,
      duration: row.duration ?? 60,
      category: (row.category as EventCategory) ?? 'Other',
      price: row.price ?? null,
      registration_deadline: row.registration_deadline ?? null,
      status: (row.status as EventStatus) ?? 'upcoming',
      is_physical: row.is_physical ?? true,
      slug: row.slug ?? '',
      form_id: row.form_id ?? null,
      content_metadata: {
        event_link:              cm.event_link              ?? '',
        zoho_form_url:           cm.zoho_form_url           ?? '',
        requirements:            cm.requirements            ?? '',
        sponsors:                cm.sponsors                ?? [],
        additional_contact_info: cm.additional_contact_info ?? '',
        languages:               cm.languages               ?? [],
        event_tags:              cm.event_tags              ?? [],
        capacity:                cm.capacity                ?? 0,
      },
      media_metadata: {
        featured_image:        mm.featured_image        ?? '',
        mobile_featured_image: mm.mobile_featured_image ?? '',
        event_banner:          mm.event_banner          ?? '',
        teaser_video:          mm.teaser_video          ?? '',
        enquiry_pdf:           mm.enquiry_pdf           ?? '',
      },
      organizer_metadata: {
        name:  om.name  ?? '',
        email: om.email ?? '',
        phone: om.phone ?? '',
      },
      location_metadata: {
        address: lm.address ?? '',
        lat: lm.lat,
        lng: lm.lng,
      },
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString(),
    };
  };

  // Fetches all events (events row only, no section content) with pagination.
  const fetchEvents = useCallback(async () => {
    console.log('fetchEvents called');
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        __eventsFetchedOnce = true;
        setEvents([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      let timedOut = false;
      const safetyTimer = setTimeout(() => {
        timedOut = true;
        setLoading(false);
        setError('Fetching events took too long. You can retry.');
      }, 20000);

      const pageSize = 200;
      let from = 0;
      let allRows: EventPost[] = [];

      for (let page = 0; page < 50; page++) {
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

        if (data.length < pageSize) break;
        from += pageSize;
      }

      clearTimeout(safetyTimer);
      if (timedOut) return;

      console.log('Events fetched successfully (paged):', allRows.length, 'events');
      __eventsCache = allRows;
      __eventsFetchedOnce = true;
      setEvents(allRows);
    } catch (err: any) {
      const timedOutErr = err?.code === '57014' || err?.code === 'CLIENT_TIMEOUT';
      const errorMessage = timedOutErr
        ? 'Fetching events is taking too long. Please try again.'
        : err instanceof Error ? err.message : 'Failed to fetch events';
      setError(errorMessage);
      toast({ title: timedOutErr ? 'Timeout' : 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Creates a new event row and its six section content rows.
  const createEvent = useCallback(async (eventData: EventFormData): Promise<EventPost | null> => {
    console.log('useEvents - createEvent called with:', eventData);
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create events. Please log in and try again.');

      const requiredLocationField = eventData.is_physical ? eventData.location_address : eventData.event_link;
      if (!eventData.title || !eventData.event_date || !eventData.event_time ||
          eventData.duration <= 0 || !requiredLocationField ||
          !eventData.organizer_name || !eventData.organizer_email || !eventData.category) {
        throw new Error('Missing required fields for event creation');
      }

      const slug = eventData.slug ||
        eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const newEvent = {
        created_by: user.id,
        title: eventData.title,
        event_date: eventData.event_date,
        event_time: eventData.event_time || null,
        duration: eventData.duration,
        category: eventData.category,
        price: eventData.price ?? null,
        registration_deadline: eventData.registration_deadline || null,
        status: eventData.status,
        is_physical: eventData.is_physical,
        slug,
        form_id: eventData.form_id || null,
        content_metadata: {
          event_link:              eventData.is_physical ? '' : (eventData.event_link ?? ''),
          zoho_form_url:           eventData.zoho_form_url ?? '',
          requirements:            eventData.requirements ?? '',
          sponsors:                eventData.sponsors ?? [],
          additional_contact_info: eventData.additional_contact_info ?? '',
          languages:               eventData.languages ?? [],
          event_tags:              eventData.event_tags ?? [],
          capacity:                eventData.capacity ?? 0,
        },
        media_metadata: {
          featured_image:        eventData.featured_image ?? '',
          mobile_featured_image: eventData.mobile_featured_image ?? '',
          event_banner:          eventData.event_banner ?? '',
          teaser_video:          eventData.teaser_video ?? '',
          enquiry_pdf:           eventData.enquiry_pdf ?? '',
        },
        organizer_metadata: {
          name:  eventData.organizer_name ?? '',
          email: eventData.organizer_email ?? '',
          phone: eventData.organizer_phone ?? '',
        },
        location_metadata: eventData.is_physical
          ? {
              address: eventData.location_address ?? '',
              lat: eventData.location_lat ?? undefined,
              lng: eventData.location_lng ?? undefined,
            }
          : {},
      };

      console.log('Prepared newEvent for database:', newEvent);

      const { data, error } = await supabase
        .from('events')
        .insert(newEvent)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        console.error('DB error detail:', JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }));
        console.error('Payload sent:', JSON.stringify(newEvent));
        throw error;
      }

      await saveSectionContent(data.id, eventData);

      const createdEvent = dbRowToEventPost(data);
      setEvents(prev => [createdEvent, ...prev]);
      __eventsCache = [createdEvent, ...__eventsCache];
      __eventsFetchedOnce = true;

      toast({ title: 'Success', description: 'Event created successfully!', variant: 'default' });
      return createdEvent;
    } catch (err) {
      console.error('createEvent error:', err);
      const errorMessage = getDatabaseErrorMessage(err);
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, userRole]);

  // Updates an existing event row and re-upserts all six section content rows.
  const updateEvent = useCallback(async (id: string, eventData: EventFormData): Promise<EventPost | null> => {
    console.log('useEvents - updateEvent called with id:', id);
    console.log('useEvents - updateEvent eventData.form_id:', eventData.form_id);
    console.log('useEvents - updateEvent called with:', { id, eventData });
    if (!id || id.trim() === '') throw new Error('Invalid event ID provided for update');

    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to update events. Please log in and try again.');

      const requiredLocationField = eventData.is_physical ? eventData.location_address : eventData.event_link;
      if (!eventData.title || !eventData.event_date || !eventData.event_time ||
          eventData.duration <= 0 || !requiredLocationField ||
          !eventData.organizer_name || !eventData.organizer_email || !eventData.category) {
        throw new Error('Missing required fields for event update');
      }

      const slug = eventData.slug ||
        eventData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const fullPayload = {
        title: eventData.title,
        event_date: eventData.event_date,
        event_time: eventData.event_time || null,
        duration: eventData.duration,
        category: eventData.category,
        price: eventData.price ?? null,
        registration_deadline: eventData.registration_deadline || null,
        status: eventData.status,
        is_physical: eventData.is_physical,
        slug,
        form_id: eventData.form_id || null,
        content_metadata: {
          event_link:              eventData.is_physical ? '' : (eventData.event_link ?? ''),
          zoho_form_url:           eventData.zoho_form_url ?? '',
          requirements:            eventData.requirements ?? '',
          sponsors:                eventData.sponsors ?? [],
          additional_contact_info: eventData.additional_contact_info ?? '',
          languages:               eventData.languages ?? [],
          event_tags:              eventData.event_tags ?? [],
          capacity:                eventData.capacity ?? 0,
        },
        media_metadata: {
          featured_image:        eventData.featured_image ?? '',
          mobile_featured_image: eventData.mobile_featured_image ?? '',
          event_banner:          eventData.event_banner ?? '',
          teaser_video:          eventData.teaser_video ?? '',
          enquiry_pdf:           eventData.enquiry_pdf ?? '',
        },
        organizer_metadata: {
          name:  eventData.organizer_name ?? '',
          email: eventData.organizer_email ?? '',
          phone: eventData.organizer_phone ?? '',
        },
        location_metadata: eventData.is_physical
          ? {
              address: eventData.location_address ?? '',
              lat: eventData.location_lat ?? undefined,
              lng: eventData.location_lng ?? undefined,
            }
          : {},
        updated_at: new Date().toISOString(),
      } as Record<string, any>;

      // Diff against cached EventPost to skip unchanged fields
      const current = events.find(e => e.id === id);
      const diffPayload: Record<string, any> = {};
      for (const [key, value] of Object.entries(fullPayload)) {
        if (value === undefined) continue;
        if (current) {
          const prev = (current as any)[key];
          // Special handling for form_id: always include if it's changing from null to a value or vice versa
          if (key === 'form_id') {
            if (prev !== value) {
              diffPayload[key] = value;
            }
          } else if (JSON.stringify(prev ?? null) === JSON.stringify(value ?? null)) {
            continue;
          } else {
            diffPayload[key] = value;
          }
        } else {
          diffPayload[key] = value;
        }
      }

      console.log('useEvents updateEvent - current event form_id:', current?.form_id);
      console.log('useEvents updateEvent - new form_id:', fullPayload.form_id);
      console.log('useEvents updateEvent - form_id in fullPayload:', fullPayload.form_id);
      console.log('useEvents updateEvent - form_id in diffPayload:', diffPayload.form_id);
      console.log('useEvents updateEvent - diffPayload keys:', Object.keys(diffPayload));

      const performUpdate = async (payload: Record<string, any>) => {
        console.log('useEvents - performUpdate called with payload:', payload);
        console.log('useEvents - performUpdate payload.form_id:', payload.form_id);
        let q = supabase.from('events').update(payload).eq('id', id);
        if (userRole !== 'owner') q = q.eq('created_by', user.id);
        const { error } = await q;
        if (error) throw error;
      };

      if (Object.keys(diffPayload).length > 0) {
        try {
          await performUpdate(diffPayload);
        } catch (e: any) {
          if (e?.code === '57014') {
            console.warn('Update timed out. Retrying with split payload...');
            const coreKeys = [
              'title', 'event_date', 'event_time', 'duration', 'category', 'price',
              'registration_deadline', 'status', 'is_physical', 'slug', 'form_id', 'updated_at',
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
      } else {
        console.log('No events row changes detected; proceeding to section content update.');
      }

      // Always upsert section content — it may be the only thing that changed
      await saveSectionContent(id, eventData);

      const { data: updatedData, error: fetchErr } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      if (fetchErr) throw new Error(`Update succeeded but failed to fetch updated event: ${fetchErr.message}`);

      const updatedEvent = dbRowToEventPost(updatedData);
      setEvents(prev => prev.map(e => (e.id === id ? updatedEvent : e)));
      __eventsCache = __eventsCache.map(e => (e.id === id ? updatedEvent : e));
      __eventsFetchedOnce = true;

      toast({ title: 'Success', description: 'Event updated successfully!', variant: 'default' });
      return updatedEvent;
    } catch (err) {
      console.error('updateEvent error:', err);
      const errorMessage = getDatabaseErrorMessage(err);
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, userRole, events]);

  const deleteEvent = useCallback(async (id: string): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to delete events', variant: 'destructive' });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: existingEvent, error: fetchError } = await supabase
        .from('events')
        .select('id, created_by, title')
        .eq('id', id)
        .single();

      if (fetchError) {
        toast({ title: 'Error', description: `Failed to find event: ${fetchError.message}`, variant: 'destructive' });
        return false;
      }
      if (!existingEvent) {
        toast({ title: 'Error', description: 'Event not found', variant: 'destructive' });
        return false;
      }

      if (existingEvent.created_by !== user.id && userRole !== 'owner') {
        toast({ title: 'Error', description: 'You can only delete your own events', variant: 'destructive' });
        return false;
      }

      let deleteQuery = supabase.from('events').delete().eq('id', id);
      if (userRole !== 'owner') {
        deleteQuery = deleteQuery.eq('created_by', user.id);
      }

      const { error } = await deleteQuery;
      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== id));
      __eventsCache = __eventsCache.filter(e => e.id !== id);
      __eventsFetchedOnce = true;

      toast({ title: 'Success', description: 'Event deleted successfully!', variant: 'default' });
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete event';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast, userRole, user]);

  // Fetches a single event including all section content.
  // Returns EventFormData ready for the edit form.
  const getEventById = useCallback(async (id: string): Promise<EventFormData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Fetch events row and entity_sections in parallel
      const [eventResult, sectionsResult] = await Promise.all([
        supabase.from('events').select('*').eq('id', id).single(),
        supabase.from('entity_sections')
          .select('id, section_key')
          .eq('entity_type', 'event')
          .eq('entity_id', id),
      ]);

      if (eventResult.error) throw eventResult.error;
      if (!eventResult.data) return null;
      if (sectionsResult.error) throw sectionsResult.error;

      const post = dbRowToEventPost(eventResult.data);
      const cm = post.content_metadata;
      const mm = post.media_metadata;
      const om = post.organizer_metadata;
      const lm = post.location_metadata;

      // Fetch section contents for all sections of this event
      const sectionIds = (sectionsResult.data ?? []).map(s => s.id);
      const contentBySectionId: Record<string, Record<string, unknown>> = {};

      if (sectionIds.length > 0) {
        const { data: contentRows, error: contentErr } = await supabase
          .from('section_contents')
          .select('entity_section_id, content')
          .in('entity_section_id', sectionIds);
        if (contentErr) throw contentErr;
        for (const cr of (contentRows ?? [])) {
          contentBySectionId[cr.entity_section_id] = (cr.content as Record<string, unknown>) ?? {};
        }
      }

      // Build section_key → content payload map
      const byKey: Record<string, Record<string, unknown>> = {};
      for (const s of (sectionsResult.data ?? [])) {
        byKey[s.section_key] = contentBySectionId[s.id] ?? {};
      }

      const formData: EventFormData = {
        id:                      post.id,
        title:                   post.title,
        event_date:              post.event_date,
        event_time:              post.event_time ?? '',
        duration:                post.duration,
        category:                post.category,
        price:                   post.price ?? 0,
        registration_deadline:   post.registration_deadline ?? null,
        status:                  post.status,
        is_physical:             post.is_physical,
        slug:                    post.slug,
        form_id:                 post.form_id ?? null,
        event_link:              cm.event_link,
        zoho_form_url:           cm.zoho_form_url,
        capacity:                cm.capacity,
        requirements:            cm.requirements,
        sponsors:                cm.sponsors,
        additional_contact_info: cm.additional_contact_info,
        languages:               cm.languages,
        event_tags:              cm.event_tags,
        featured_image:          mm.featured_image,
        mobile_featured_image:   mm.mobile_featured_image,
        event_banner:            mm.event_banner,
        teaser_video:            mm.teaser_video,
        enquiry_pdf:             mm.enquiry_pdf,
        organizer_name:          om.name  ?? '',
        organizer_email:         om.email ?? '',
        organizer_phone:         om.phone ?? '',
        location_address:        lm.address ?? '',
        location_lat:            lm.lat ?? null,
        location_lng:            lm.lng ?? null,
        hero_title:       (byKey['hero']?.title          as string)        ?? '',
        hero_description: (byKey['hero']?.description   as string)        ?? '',
        hero_benefits:    (byKey['hero']?.benefits       as string[])      ?? [],
        about:            (byKey['about']?.text         as string)        ?? '',
        highlights:       ((byKey['highlights']?.items as { text: string }[]) ?? []).map(h => h.text),
        agenda:           (byKey['agenda']?.text        as string)        ?? '',
        gallery:          (byKey['gallery']?.items      as GalleryItem[]) ?? [],
        speakers:         (byKey['speakers']?.items     as Speaker[])     ?? [],
        faq:              (byKey['faq']?.items          as FAQItem[])     ?? [],
        stats:            (byKey['stats']?.items        as StatItem[])    ?? [],
        features:         (byKey['features']?.items     as FeatureItem[]) ?? [],
        testimonials_heading: (byKey['testimonials']?.heading as string) ?? '',
        testimonials_tag:     (byKey['testimonials']?.tag     as string) ?? '',
        testimonials:         (byKey['testimonials']?.items   as TestimonialItem[]) ?? [],
        cta_text:         (byKey['cta']?.text           as string)        ?? '',
        cta_subline:      (byKey['cta']?.subline        as string)        ?? '',
        cta_button_label: ((byKey['cta']?.button ?? byKey['cta']?.button_label) as string) ?? 'Register Now',
        cta_badges:       (byKey['cta']?.badges         as CtaBadge[])   ?? [],
      };

      return formData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch event';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    console.log('useEvents useEffect:', { user: !!user, loading });
    if (!user) {
      console.log('No user, not fetching events');
      return;
    }

    if (__eventsCache.length > 0) {
      console.log('Hydrating events from cache:', __eventsCache.length);
      setEvents(__eventsCache);
    }

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

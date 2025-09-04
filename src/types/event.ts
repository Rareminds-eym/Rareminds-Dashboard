// Event-related type definitions matching the actual Supabase schema

export interface EventPost {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: string;
  location: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone?: string | null;
  capacity: number;
  category: string;
  price?: string | null;
  registration_deadline?: string | null;
  requirements?: string | null;
  agenda?: string | null;
  speakers?: string[] | null;
  sponsors?: string[] | null;
  additional_contact_info?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  event_banner?: string | null;
  featured_image?: string | null;
  event_tags?: string[] | null;
  meta_title: string;
  meta_description: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface EventSEOSettings {
  meta_title: string;
  meta_description: string;
  slug: string;
}

export interface EventFormData {
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: string;
  location: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  capacity: number;
  category: string;
  price?: string | null;
  registration_deadline?: string | null;
  requirements?: string | null;
  agenda?: string | null;
  speakers?: string[];
  sponsors?: string[];
  additional_contact_info?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  event_banner?: string | null;
  featured_image?: string | null;
  event_tags: string[];
  seo: EventSEOSettings;
}

// Event Draft types (if needed in the future)
export interface EventDraft {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: string;
  location: string;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  capacity: number;
  category: string;
  price?: string | null;
  registration_deadline?: string | null;
  requirements?: string | null;
  agenda?: string | null;
  speakers?: string[];
  sponsors?: string[];
  additional_contact_info?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  event_banner?: string | null;
  featured_image?: string | null;
  event_tags?: string[];
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}
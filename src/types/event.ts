// Event-related type definitions matching the final database schema
// Source of truth: 20260602000001_migrate_events_content_to_entity_sections.sql
//                  20260603000001_optimize_events_schema.sql

// ─── Enum types ───────────────────────────────────────────────────────────────

export type EventCategory =
  | 'Workshop'
  | 'Webinar'
  | 'Seminar'
  | 'Conference'
  | 'Training'
  | 'Bootcamp'
  | 'Hackathon'
  | 'Other';

export type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export type EntitySectionKey =
  | 'hero'
  | 'about'
  | 'highlights'
  | 'agenda'
  | 'gallery'
  | 'speakers'
  | 'stats'
  | 'features'
  | 'testimonials'
  | 'faq'
  | 'cta';

export type SectionContentType = 'text' | 'list' | 'stats' | 'cards' | 'gallery' | 'faq';

// ─── Section content item shapes ──────────────────────────────────────────────
// id is optional: absent in form state, assigned by DB trigger on save.

export interface Speaker {
  id?: string;
  name: string;
  role?: string | null;
  description?: string | null;
  photo?: string | null;
  linkedin?: string | null;
}

export interface FAQItem {
  id?: string;
  question: string;
  answer: string;
}

export interface StatItem {
  id?: string;
  value: string;
  label: string;
}

export interface FeatureItem {
  id?: string;
  title: string;
  description: string;
  icon?: string | null;
}

export interface TestimonialItem {
  id?: string;
  name: string;
  designation?: string | null;
  school?: string | null;
  location?: string | null;
  rating?: number | null;
  review: string;
  photo?: string | null;
}

export interface HighlightItem {
  text: string;
}

export interface GalleryItem {
  id?: string;
  image_url: string;
  caption?: string;
}

export interface CtaBadge {
  label: string;
}

// ─── JSONB column shapes ──────────────────────────────────────────────────────

export interface ContentMetadata {
  event_link: string;
  zoho_form_url: string;
  requirements: string;
  sponsors: string[];
  additional_contact_info: string;
  languages: string[];
  event_tags: string[];
  capacity: number;
}

export interface MediaMetadata {
  featured_image: string;
  mobile_featured_image: string;
  event_banner: string;
  teaser_video: string;
  enquiry_pdf: string;
}

export interface OrganizerMetadata {
  name?: string;
  email?: string;
  phone?: string;
}

export interface LocationMetadata {
  address?: string;
  lat?: number;
  lng?: number;
}

// ─── Entity sections / section_contents ───────────────────────────────────────

export interface EntitySection {
  id: string;
  entity_type: 'event' | 'program';
  entity_id: string;
  section_key: EntitySectionKey;
  content_type: SectionContentType;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SectionContentRow {
  id: string;
  entity_section_id: string;
  title?: string | null;
  preamble?: string | null;
  content: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ─── Database row (returned from Supabase queries) ────────────────────────────
// Reflects the final events table after both migrations.
// Flat columns only — content lives in JSONB columns and entity_sections.

export interface EventPost {
  id: string;
  created_by: string;
  title: string;
  event_date: string;
  event_time?: string | null;
  duration: number;          // INTEGER — total minutes (e.g. 120 = 2 hours)
  category: EventCategory;
  price?: number | null;     // NUMERIC(10,2) — 0.00 means free
  registration_deadline?: string | null;
  status: EventStatus;
  is_physical: boolean;
  slug: string;
  form_id?: string | null;   // optional reference to custom form
  content_metadata: ContentMetadata;
  media_metadata: MediaMetadata;
  organizer_metadata: OrganizerMetadata;
  location_metadata: LocationMetadata;
  created_at: string;
  updated_at: string;
}

// ─── Form state (used by Create/Edit Event form) ──────────────────────────────
// Fields are kept flat for form convenience.
// The save hook is responsible for mapping these to the correct DB destinations:
//   flat columns      → events.*
//   content_* fields  → events.content_metadata JSONB
//   media_* fields    → events.media_metadata JSONB
//   organizer_* fields→ events.organizer_metadata JSONB
//   location_* fields → events.location_metadata JSONB
//   about/highlights/agenda/gallery/speakers/faq
//                     → entity_sections + section_contents

export interface EventFormData {
  id?: string;       // undefined for new events; set by getEventById for edits
  form_id?: string | null; // optional reference to a custom form

  // events flat columns
  title: string;
  event_date: string;
  event_time: string;
  duration: number;
  category: EventCategory;
  price: number;
  registration_deadline?: string | null;
  status: EventStatus;
  is_physical: boolean;
  slug: string;

  // content_metadata fields
  event_link: string;
  zoho_form_url: string;
  capacity: number;
  requirements: string;
  sponsors: string[];
  additional_contact_info: string;
  languages: string[];
  event_tags: string[];

  // media_metadata fields
  featured_image: string;
  mobile_featured_image: string;
  event_banner: string;
  teaser_video: string;
  enquiry_pdf: string;

  // organizer_metadata fields
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;

  // location_metadata fields — only meaningful when is_physical = true
  location_address: string;
  location_lat?: number | null;
  location_lng?: number | null;

  // entity_sections / section_contents (dynamic content)
  hero_title: string;
  hero_description: string;
  hero_benefits: string[];
  about: string;
  highlights: string[];  // stored as { text: string }[] in DB; converted at save/load boundary
  agenda: string;
  gallery: GalleryItem[];
  speakers: Speaker[];
  faq: FAQItem[];

  // stats section
  stats: StatItem[];

  // features section
  features: FeatureItem[];

  // testimonials section
  testimonials_heading: string;
  testimonials_tag: string;
  testimonials: TestimonialItem[];

  // cta section
  cta_text: string;
  cta_subline: string;
  cta_button_label: string;
  cta_badges: CtaBadge[];
}

// ─── Event Draft ──────────────────────────────────────────────────────────────
// The events_draft table was NOT modified by the migrations.
// It retains its original flat-column structure including description,
// meta_title, and other pre-migration fields.

export interface EventDraft {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  duration: string;
  location: string;
  is_physical: boolean;
  event_link?: string | null;
  organizer_name: string;
  organizer_email: string;
  organizer_phone: string;
  capacity: number;
  category: string;
  price: string;
  registration_deadline?: string | null;
  requirements?: string | null;
  agenda?: string | null;
  speakers_details?: Speaker[];
  sponsors?: string[];
  additional_contact_info?: string | null;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  event_banner?: string | null;
  featured_image?: string | null;
  mobile_featured_image?: string | null;
  event_tags?: string[];
  key_highlights?: string[];
  events_gallery?: string[];
  teaser_video?: string | null;
  faq?: FAQItem[];
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  created_at: string;
  updated_at: string;
}

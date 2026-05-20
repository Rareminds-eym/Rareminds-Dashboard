export type SectionKeyType =
    | 'introduction'
    | 'about'
    | 'modules'
    | 'approaches'
    | 'impact'
    | 'strategic_alignment'
    | 'conclusion'
    | 'header'
    | 'course_enrollment'
    | 'program_delivery'
    | 'intervention'
    | 'video';

export type ContentType = 'text' | 'cards' | 'stats' | 'courses';

// ── Content shape types (derived from schema CHECK constraints + seed data) ──

export interface CardItem {
    id?: string;
    title: string;
    description: string;
}

export interface StatItem {
    id?: string;
    value: string;
    label: string;
}

export interface University {
    id?: string;
    name: string;
    students: number;
}

export interface CourseItem {
    id?: string;
    title: string;
    total: number;
    universities: University[];
}

export interface ImageItem {
    id?: string;
    url: string;
}

export interface TextContent {
    text: string;
    images?: ImageItem[];
    image?: { id?: string; url: string; alt?: string };
}

export interface CardsContent {
    items: CardItem[];
    description?: string;
}

export interface StatsContent {
    items: StatItem[];
}

export interface CoursesContent {
    courses: CourseItem[];
}

export type SectionContent = TextContent | CardsContent | StatsContent | CoursesContent;

export interface Program {
    id: string;
    title: string;
    slug: string;
    program_type: string; // NOW REQUIRED (not null)
    location: string; // NOW REQUIRED (not null)
    date: string; // NOW REQUIRED (not null)
    status: string; // NOW REQUIRED (not null)
    image_url: string; // NOW REQUIRED (not null)
    banner_url: string | null;
    short_description: string; // NOW REQUIRED (not null)
    display_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    sections: ProgramSection[];
}

export interface ProgramSection {
    id: string;
    program_id: string;
    section_key: SectionKeyType;
    content_type: ContentType; // NEW FIELD
    title: string | null;
    preamble: string | null; // NEW FIELD
    content: Record<string, unknown>; // CHANGED from string to JSONB object
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface ProgramFormData {
    title: string;
    slug: string;
    program_type: string; // NOW REQUIRED
    location: string; // NOW REQUIRED
    date: string; // NOW REQUIRED
    status: string; // NOW REQUIRED
    image_url: string; // NOW REQUIRED
    banner_url: string | null;
    short_description: string; // NOW REQUIRED
    display_order: number;
    is_active: boolean;
    sections: ProgramSectionFormData[];
}

export interface ProgramSectionFormData {
    section_key: SectionKeyType;
    content_type?: ContentType; // NEW FIELD (optional for backward compatibility)
    title: string;
    preamble?: string; // NEW FIELD
    content: Record<string, unknown>; // CHANGED from string to JSONB object
}

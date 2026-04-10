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
    | 'programs'
    | 'why'
    | 'cloud_kitchen'
    | 'agri_food'
    | 'inventions';

export interface Program {
    id: string;
    title: string;
    slug: string;
    program_type: string | null;
    location: string | null;
    date: string | null;
    status: string | null;
    image_url: string | null;
    banner_url: string | null;
    short_description: string | null;
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
    title: string | null;
    content: string | null;
    display_order: number;
    created_at: string;
    updated_at: string;
}

export interface ProgramFormData {
    title: string;
    slug: string;
    program_type: string;
    location: string;
    date: string;
    status: string;
    image_url: string;
    banner_url: string;
    short_description: string;
    display_order: number;
    is_active: boolean;
    sections: ProgramSectionFormData[];
}

export interface ProgramSectionFormData {
    section_key: SectionKeyType;
    title: string;
    content: string;
}

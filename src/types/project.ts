// TipTap JSON content structure (using JSONContent type from TipTap)
export interface TipTapContent {
  type?: string;
  content?: TipTapContent[];
  attrs?: Record<string, unknown>;
  text?: string;
  marks?: Array<{
    type: string;
    attrs?: Record<string, unknown>;
  }>;
}

// Allow any valid JSON structure for TipTap content
export type TipTapDocument = Record<string, unknown>;

export interface ProjectPost {
  id: string;
  user_id: string;
  title: string;
  featured_image?: string;
  meta_title: string;
  meta_description: string;
  slug: string;
  videos_url?: string[]; // Changed to array of video URLs
  project_tags?: string[];
  content_json?: TipTapDocument; // TipTap JSON content
  conclusion?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectSEOSettings {
  meta_title: string;
  meta_description: string;
  slug: string;
}

export interface ProjectFormData {
  title: string;
  featured_image?: string;
  videos_url?: string[]; // Changed to array of video URLs
  project_tags: string[];
  content_json: TipTapDocument; // TipTap JSON format
  conclusion?: string;
  seo: ProjectSEOSettings;
}

// Project Draft types
export interface ProjectDraft {
  id: string;
  user_id: string;
  title: string;
  project_tags: string[];
  content_json?: TipTapDocument;
  conclusion?: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  video_url?: string[];
  created_at: string;
  updated_at: string;
}

export interface ProjectDraftFormData {
  title: string;
  project_tags: string[];
  content_json: TipTapDocument;
  conclusion?: string;
  featured_image?: string;
  meta_title?: string;
  meta_description?: string;
  slug?: string;
  video_url?: string[];
}

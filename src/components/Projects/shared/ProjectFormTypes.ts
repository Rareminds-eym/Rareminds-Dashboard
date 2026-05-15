import { ProjectPost, ProjectDraft, ProjectSEOSettings } from '../../../types/project';

export interface ProjectFormData {
  title: string;
  content_json: Record<string, unknown>;
  featured_image: string;
  conclusion: string;
  project_tags: string[];
  video_url: string[];
  seo: ProjectSEOSettings;
}

export interface ProjectFormProps {
  onPostSaved: (post: ProjectPost) => void | Promise<void>;
  editingPost?: ProjectPost | ProjectDraft | null;
}

export interface ProjectValidationErrors {
  title?: boolean;
  featured_image?: boolean;
  project_tags?: boolean;
  meta_title?: boolean;
  meta_description?: boolean;
  slug?: boolean;
  content?: boolean;
}

// Common project tags that can be used as suggestions
export const commonProjectTags = [
  'Web Development',
  'Mobile App',
  'Data Science',
  'Machine Learning',
  'AI',
  'Blockchain',
  'IoT',
  'Cloud Computing',
  'DevOps',
  'UI/UX Design',
  'Frontend',
  'Backend',
  'Full Stack',
  'API Development',
  'Database',
  'Security',
  'Testing',
  'Open Source',
  'Research',
  'Prototype'
];

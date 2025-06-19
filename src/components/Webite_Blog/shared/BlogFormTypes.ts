import { BlogPost, SEOSettings } from '../../../types/blog';

export interface BlogFormData {
  title: string;
  content: string;
  featuredImage: string;
  altImage: string;
  category: string;
  subcategory: string;
  tags: string[];
  seo: SEOSettings;
}

export interface BlogFormProps {
  onPostSaved: (post: BlogPost) => void | Promise<void>;
  editingPost?: BlogPost | null;
}

export interface ValidationErrors {
  title?: boolean;
  featuredImage?: boolean;
  altImage?: boolean;
  category?: boolean;
  subcategory?: boolean;
  tags?: boolean;
  metaTitle?: boolean;
  metaDescription?: boolean;
  slug?: boolean;
  content?: boolean;
}

export const categories = ['Government', 'School', 'Corporate', 'Institution'];

export const subcategories: Record<string, string[]> = {
  'Government': ['None'],
  'School': ['Teachers', 'Students'],
  'Corporate': ['Recruitment', 'Training'],
  'Institution': ['SDP', 'FDP']
};

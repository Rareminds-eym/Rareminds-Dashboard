export interface BlogPost {
  id: string;
  title: string;
  content: string; // HTML for display
  excerpt: string;
  featuredImage: string;
  altImage: string;
  category: string;
  subcategory: string;
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface BlogDraft {
  id: string;
  user_id: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  altImage: string;
  category: string;
  subcategory: string;
  tags: string[];
  seo: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
  publishDate?: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

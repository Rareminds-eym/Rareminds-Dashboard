export interface BlogPost {
  id: string;
  title: string;
  content: string; // HTML for display
  excerpt: string;
  featuredImage?: string;
  category: string;
  subcategory: string;
  seo: {
    metaTitle: string;
    metaDescription: string;
    slug: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SEOSettings {
  metaTitle: string;
  metaDescription: string;
  slug: string;
}

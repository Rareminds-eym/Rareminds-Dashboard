// Export individual form components
export { default as DraftPostForm } from './DraftPost/DraftPostForm';
export { default as NewPostForm } from './NewPost/NewPostForm';
export { default as UpdatePostForm } from './UpdatePost/UpdatePostForm';

// Export shared components and types
export { BlogFormLayout } from './shared/BlogFormLayout';
export { useBlogForm } from './shared/useBlogForm';
export type { BlogFormData, BlogFormProps, ValidationErrors } from './shared/BlogFormTypes';

// Legacy export - Updated NewPostSection that uses the new components
export { default as NewPostSection } from './NewPost/NewPostSection';

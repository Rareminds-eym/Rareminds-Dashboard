import React from 'react';
import { Edit3, FileText } from 'lucide-react';
import { BlogPost, SEOSettings } from '../../../types/blog';
import { BlogFormProps } from '../shared/BlogFormTypes';
import { useBlogForm } from '../shared/useBlogForm';
import { BlogFormLayout } from '../shared/BlogFormLayout';
import { useToast } from '../../../hooks/use-toast';

interface DraftData {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  altImage: string;
  category: string;
  subcategory: string;
  tags: string[];
  seo: SEOSettings;
  status: 'draft';
  createdAt: string;
  updatedAt: string;
}

interface DraftPostFormProps extends BlogFormProps {
  onDraftSaved?: (draft: DraftData) => void;
}

const DraftPostForm: React.FC<DraftPostFormProps> = ({ 
  onPostSaved, 
  editingPost, 
  onDraftSaved 
}) => {
  const { toast } = useToast();
  const formHook = useBlogForm(editingPost);
  const { 
    title, 
    editor, 
    validateForm, 
    generateExcerpt, 
    resetForm, 
    setShowValidation,
    featuredImage,
    altImage,
    category,
    subcategory,
    tags,
    seo
  } = formHook;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields to save the draft.",
        variant: "destructive"
      });
      return;
    }

    const draft = {
      id: editingPost?.id || `draft-${Date.now()}`,
      title,
      content: editor?.getHTML() || '',
      excerpt: generateExcerpt(editor?.getText() || ''),
      featuredImage: featuredImage || '',
      altImage: altImage || '',
      category,
      subcategory,
      tags,
      seo,
      status: 'draft' as const,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (onDraftSaved) {
      onDraftSaved(draft);
    } else {
      // Convert draft to BlogPost format
      const post: BlogPost = {
        id: draft.id,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        featuredImage: draft.featuredImage,
        altImage: draft.altImage,
        category: draft.category,
        subcategory: draft.subcategory,
        tags: draft.tags,
        seo: draft.seo,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt
      };
      onPostSaved(post);
    }
    
    if (!editingPost) {
      resetForm();
    }

    toast({
      title: "Draft Saved",
      description: "Your draft has been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {editingPost ? 'Edit Draft' : 'Create Draft'}
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                {editingPost 
                  ? 'Continue working on your draft' 
                  : 'Save your work as a draft to continue later'
                }
              </p>
            </div>
          </div>
        </div>

        <BlogFormLayout
          formHook={formHook}
          onSubmit={handleSubmit}
          submitButtonText={editingPost ? 'Update Draft' : 'Save Draft'}
          submitButtonIcon={<FileText className="w-4 h-4 mr-2" />}
          showDraftButton={false} // Hide draft button since this IS the draft form
          isEditing={!!editingPost}
        />
      </div>
    </div>
  );
};

export default DraftPostForm;

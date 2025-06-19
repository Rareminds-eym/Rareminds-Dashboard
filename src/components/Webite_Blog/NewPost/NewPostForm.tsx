import React from 'react';
import { Save, Sparkles } from 'lucide-react';
import { BlogPost } from '../../../types/blog';
import { BlogFormProps } from '../shared/BlogFormTypes';
import { useBlogForm } from '../shared/useBlogForm';
import { BlogFormLayout } from '../shared/BlogFormLayout';
import { useToast } from '../../../hooks/use-toast';

const NewPostForm: React.FC<BlogFormProps> = ({ onPostSaved, editingPost }) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields to publish the post.",
        variant: "destructive"
      });
      return;
    }

    const post: BlogPost = {
      id: editingPost?.id || `post-${Date.now()}`,
      title,
      content: editor?.getHTML() || '',
      excerpt: generateExcerpt(editor?.getText() || ''),
      featuredImage: featuredImage || '',
      altImage: altImage || '',
      category,
      subcategory,
      tags,
      seo,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await onPostSaved(post);
      
      if (!editingPost) {
        resetForm();
      }

      toast({
        title: "Post Published",
        description: "Post is submitted successfully.",
      });
    } catch (error) {
      console.error('Error publishing post:', error);
      toast({
        title: "Publish Failed",
        description: "Failed to submit the post. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-xl shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  Create New Post
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                Write and publish your latest blog post
              </p>
            </div>
          </div>
        </div>

        <BlogFormLayout
          formHook={formHook}
          onSubmit={handleSubmit}
          submitButtonText="Publish Post"
          submitButtonIcon={<Save className="w-4 h-4 mr-2" />}
          showDraftButton={true}
          isEditing={false}
        />
      </div>
    </div>
  );
};

export default NewPostForm;

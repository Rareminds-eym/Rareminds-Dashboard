import React from 'react';
import { Send, Edit3 } from 'lucide-react';
import { BlogPost } from '../../../types/blog';
import { BlogFormProps } from '../shared/BlogFormTypes';
import { useBlogForm } from '../shared/useBlogForm';
import { BlogFormLayout } from '../shared/BlogFormLayout';
import { useToast } from '../../../hooks/use-toast';

interface UpdatePostFormProps extends BlogFormProps {
  editingPost: BlogPost; // Make editingPost required for update form
}

const UpdatePostForm: React.FC<UpdatePostFormProps> = ({ onPostSaved, editingPost }) => {
  console.log('✏️ UpdatePostForm received editingPost:', editingPost);
  
  const { toast } = useToast();
  const formHook = useBlogForm(editingPost);
  const { 
    title, 
    editor, 
    validateForm, 
    generateExcerpt, 
    setShowValidation,
    featuredImage,
    altImage,
    category,
    subcategory,
    tags,
    seo
  } = formHook;

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 HandleSubmit called in UpdatePostForm');
    e.preventDefault();
    setShowValidation(true);
    
    // Test toast - remove this after testing
    toast({
      title: "Test Toast",
      description: "This is a test to see if toasts are working",
    });
    
    if (!validateForm()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields to update the post.",
        variant: "destructive"
      });
      return;
    }

    const updatedPost: BlogPost = {
      id: editingPost.id,
      title,
      content: editor?.getHTML() || '',
      excerpt: generateExcerpt(editor?.getText() || ''),
      featuredImage: featuredImage || '',
      altImage: altImage || '',
      category,
      subcategory,
      tags,
      seo,
      createdAt: editingPost.createdAt,
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('About to call onPostSaved with:', updatedPost);
      await onPostSaved(updatedPost);
      console.log('onPostSaved completed successfully');
      
      toast({
        title: "Post Updated",
        description: "Post is submitted successfully.",
      });
      console.log('Success toast called');
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: "Update Failed",
        description: "Failed to submit the post. Please try again.",
        variant: "destructive"
      });
      console.log('Error toast called');
    }
  };

  return (
    <>
      {/* Header Section */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-sm">
                <Edit3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Edit Post
              </h1>
            </div>
            <p className="text-slate-600 text-lg">
              Update your existing blog post
            </p>
          </div>
        </div>
      </div>

      <BlogFormLayout
        formHook={formHook}
        onSubmit={handleSubmit}
        submitButtonText="Publish Post"
        submitButtonIcon={<Send className="w-4 h-4 mr-2" />}
        showDraftButton={true}
        isEditing={true}
      />
    </>
  );
};

export default UpdatePostForm;

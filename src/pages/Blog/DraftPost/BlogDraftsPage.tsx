import { useNavigate, useLocation } from 'react-router-dom';
import { useBlogDrafts } from '../../../hooks/useBlogDrafts';
import { useBlogPosts } from '../../../hooks/useBlogPosts';
import { useToast } from '../../../hooks/use-toast';
import DraftsSection from '../../../components/Webite_Blog/DraftPost/DraftsSection';
import { BlogDraft } from '../../../types/blog';
import { useEffect } from 'react';

const BlogDraftsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { 
    drafts, 
    loading: draftsLoading, 
    deleteDraft,
    saveDraft,
    fetchDrafts 
  } = useBlogDrafts();
  
  const { 
    createPost,
    loading: postsLoading 
  } = useBlogPosts();

  // Force refresh drafts when navigating back to this page
  useEffect(() => {
    console.log('📍 BlogDraftsPage mounted, location:', location.pathname);
    if (location.pathname === '/blog/drafts') {
      console.log('🔄 Force refreshing drafts on page mount');
      fetchDrafts();
    }
  }, [location.pathname, fetchDrafts]);

  const handleEditDraft = (draft: BlogDraft) => {
    // Navigate to new post page with draft data
    navigate('/blog/new-post', { 
      state: { 
        editingDraft: true, 
        draftData: draft 
      } 
    });
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraft(draftId);
      toast({
        title: "Success",
        description: "Draft deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePublishDraft = async (draft: BlogDraft) => {
    try {
      // Validate required fields
      if (!draft.title.trim()) {
        toast({
          title: "Error",
          description: "Title is required to publish the post",
          variant: "destructive",
        });
        return;
      }

      if (!draft.content.trim()) {
        toast({
          title: "Error",
          description: "Content is required to publish the post",
          variant: "destructive",
        });
        return;
      }

      if (!draft.category.trim()) {
        toast({
          title: "Error",
          description: "Category is required to publish the post",
          variant: "destructive",
        });
        return;
      }

      // Create the post
      const postData = {
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        featuredImage: draft.featuredImage,
        altImage: draft.altImage || '',
        category: draft.category,
        subcategory: draft.subcategory,
        tags: draft.tags,
        seo: draft.seo
      };

      await createPost(postData);

      // Delete the draft after successful publishing
      await deleteDraft(draft.id);

      toast({
        title: "Success",
        description: "Draft published successfully!",
      });

      // Optionally navigate to the posts page
      navigate('/blog/posts');
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast({
        title: "Error",
        description: "Failed to publish draft. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (draftsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // Add error boundary for drafts
  if (!drafts) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Failed to load drafts</p>
          <button 
            onClick={() => fetchDrafts()} 
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <DraftsSection
      key={`drafts-${location.pathname}-${drafts.length}`}
      drafts={drafts}
      onEditDraft={handleEditDraft}
      onDeleteDraft={handleDeleteDraft}
      onPublishDraft={handlePublishDraft}
    />
  );
};

export default BlogDraftsPage;

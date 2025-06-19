import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import NewPostSection from '../../components/Webite_Blog/NewPost/NewPostSection';
import { BlogPost, BlogDraft } from '../../types/blog';
import { useBlogPosts } from '../../hooks/useBlogPosts';

const BlogNewPostPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { createPost, updatePost } = useBlogPosts();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Check if we're editing a post or draft from navigation state
  useEffect(() => {
    if (location.state?.editingPost) {
      console.log('📝 Setting editing post from navigation:', location.state.editingPost);
      setEditingPost(location.state.editingPost);
    } else if (location.state?.editingDraft && location.state?.draftData) {
      console.log('📝 Converting draft to editing post:', location.state.draftData);
      const draft: BlogDraft = location.state.draftData;
      
      // Convert BlogDraft to BlogPost format for editing
      const postForEdit: BlogPost = {
        id: draft.id,
        title: draft.title,
        content: draft.content,
        excerpt: draft.excerpt,
        featuredImage: draft.featuredImage || '',
        altImage: draft.altImage,
        category: draft.category,
        subcategory: draft.subcategory,
        tags: draft.tags,
        seo: draft.seo,
        createdAt: draft.createdAt,
        updatedAt: draft.updatedAt
      };
      
      setEditingPost(postForEdit);
    }
  }, [location.state]);

  const handlePostSaved = async (post: BlogPost) => {
    if (editingPost) {
      await updatePost(editingPost.id, post);
      setEditingPost(null);
    } else {
      await createPost(post);
    }
    navigate('/blog');
  };

  return (
    <div className="animate-in fade-in duration-500">
      <NewPostSection 
        onPostSaved={handlePostSaved}
        editingPost={editingPost}
      />
    </div>
  );
};

export default BlogNewPostPage;

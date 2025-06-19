import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PostedPostsSection from '../../components/Webite_Blog/PostedPosts/PostedPostsSection';
import { BlogPost } from '../../types/blog';
import { useBlogPosts } from '../../hooks/useBlogPosts';

const BlogPostsPage = () => {
  const navigate = useNavigate();
  const { posts, loading: postsLoading, deletePost } = useBlogPosts();
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    navigate('/blog/new-post', { state: { editingPost: post } });
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  if (postsLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-900 dark:text-white font-medium">Loading your content</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait while we fetch your posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500">
      <PostedPostsSection 
        posts={posts}
        onEditPost={handleEditPost}
        onDeletePost={handleDeletePost}
      />
    </div>
  );
};

export default BlogPostsPage;

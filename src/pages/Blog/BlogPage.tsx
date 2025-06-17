import { useState } from 'react';
import { Plus, FileText, Eye } from 'lucide-react';
import DashboardOverview from '../../components/Webite_Blog/Dashboard/DashboardOverview';
import NewPostSection from '../../components/Webite_Blog/NewPost/NewPostSection';
import PostedPostsSection from '../../components/Webite_Blog/PostedPosts/PostedPostsSection';
import { BlogPost } from '../../types/blog';
import { useBlogPosts } from '../../hooks/useBlogPosts';

const BlogPage = () => {
  const { posts, loading: postsLoading, createPost, updatePost, deletePost } = useBlogPosts();
  const [activeSection, setActiveSection] = useState('overview');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  const handlePostSaved = async (post: BlogPost) => {
    if (editingPost) {
      await updatePost(editingPost.id, post);
      setEditingPost(null);
    } else {
      await createPost(post);
    }
    setActiveSection('overview');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setActiveSection('new-post');
  };

  const handleDeletePost = async (postId: string) => {
    await deletePost(postId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Blog Management</h1>
              <p className="text-slate-600 dark:text-slate-400">Create and manage your blog posts</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/60 rounded-full p-1">
              <button
                onClick={() => setActiveSection('overview')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => {
                  setEditingPost(null);
                  setActiveSection('new-post');
                }}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'new-post'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Post
              </button>
              <button
                onClick={() => setActiveSection('posts')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'posts'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Posts
                <span className="ml-1 px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 rounded-full">
                  {posts.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {postsLoading ? (
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
        ) : (
          <div className="space-y-8">
            {activeSection === 'overview' && (
              <div className="animate-in fade-in duration-500">
                <DashboardOverview 
                  posts={posts} 
                  onNewPost={() => {
                    setEditingPost(null);
                    setActiveSection('new-post');
                  }}
                  onViewPosts={() => setActiveSection('posts')}
                />
              </div>
            )}
            {activeSection === 'new-post' && (
              <div className="animate-in fade-in duration-500">
                <NewPostSection 
                  onPostSaved={handlePostSaved}
                  editingPost={editingPost}
                />
              </div>
            )}
            {activeSection === 'posts' && (
              <div className="animate-in fade-in duration-500">
                <PostedPostsSection 
                  posts={posts}
                  onEditPost={handleEditPost}
                  onDeletePost={handleDeletePost}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPage;

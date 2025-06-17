
import { useState } from 'react';
import { Plus, FileText, Eye, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import DashboardOverview from '../components/Webite_Blog/Dashboard/DashboardOverview';
import NewPostSection from '../components/Webite_Blog/NewPost/NewPostSection';
import PostedPostsSection from '../components/Webite_Blog/PostedPosts/PostedPostsSection';
import AuthPage from '../components/Auth/AuthPage';
import { BlogPost } from '../types/blog';
import { useAuth } from '../hooks/useAuth';
import { useBlogPosts } from '../hooks/useBlogPosts';

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { posts, loading: postsLoading, createPost, updatePost, deletePost } = useBlogPosts();
  const [activeSection, setActiveSection] = useState('overview');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
            <p className="text-slate-500 dark:text-slate-400">Preparing your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user) {
    return <AuthPage />;
  }

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

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="https://rareminds.in/RareMinds.webp" 
                alt="RareMinds" 
                className="h-10 w-auto object-contain" 
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-8">
              <nav className="hidden md:flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/60 rounded-full p-1">
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
              </nav>

              {/* Mobile Navigation */}
              <nav className="md:hidden flex gap-2">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    activeSection === 'overview'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Eye className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingPost(null);
                    setActiveSection('new-post');
                  }}
                  className={`p-3 rounded-xl transition-all duration-300 ${
                    activeSection === 'new-post'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Plus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveSection('posts')}
                  className={`relative p-3 rounded-xl transition-all duration-300 ${
                    activeSection === 'posts'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  {posts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {posts.length > 9 ? '9+' : posts.length}
                    </span>
                  )}
                </button>
              </nav>

              {/* Sign Out Button */}
              <Button 
                variant="ghost" 
                onClick={handleSignOut}
                className="gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl px-4 py-2.5 transition-all duration-300"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
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

export default Index;


import { useState } from 'react';
import { Plus, FileText, Eye, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import DashboardOverview from '../components/DashboardOverview';
import NewPostSection from '../components/NewPostSection';
import PostedPostsSection from '../components/PostedPostsSection';
import AuthPage from '../components/AuthPage';
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">Blog Dashboard</h1>
            <div className="flex items-center gap-2">
              <nav className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveSection('overview')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'overview'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
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
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'new-post'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <Plus className="w-4 h-4 inline mr-2" />
                  New Post
                </button>
                <button
                  onClick={() => setActiveSection('posts')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeSection === 'posts'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                  }`}
                >
                  <FileText className="w-4 h-4 inline mr-2" />
                  Posts ({posts.length})
                </button>
              </nav>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {postsLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : (
          <>
            {activeSection === 'overview' && (
              <DashboardOverview 
                posts={posts} 
                onNewPost={() => {
                  setEditingPost(null);
                  setActiveSection('new-post');
                }}
                onViewPosts={() => setActiveSection('posts')}
              />
            )}
            {activeSection === 'new-post' && (
              <NewPostSection 
                onPostSaved={handlePostSaved}
                editingPost={editingPost}
              />
            )}
            {activeSection === 'posts' && (
              <PostedPostsSection 
                posts={posts}
                onEditPost={handleEditPost}
                onDeletePost={handleDeletePost}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Index;

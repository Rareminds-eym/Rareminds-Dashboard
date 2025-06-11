
import { useState, useEffect } from 'react';
import { Plus, FileText, Eye, Search } from 'lucide-react';
import DashboardOverview from '../components/DashboardOverview';
import NewPostSection from '../components/NewPostSection';
import PostedPostsSection from '../components/PostedPostsSection';
import { BlogPost } from '../types/blog';

const Index = () => {
  const [activeSection, setActiveSection] = useState('overview');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    const savedPosts = localStorage.getItem('blog-posts');
    if (savedPosts) {
      setPosts(JSON.parse(savedPosts));
    }
  }, []);

  const handlePostSaved = (post: BlogPost) => {
    let updatedPosts;
    if (editingPost) {
      updatedPosts = posts.map(p => p.id === post.id ? post : p);
      setEditingPost(null);
    } else {
      updatedPosts = [...posts, post];
    }
    setPosts(updatedPosts);
    localStorage.setItem('blog-posts', JSON.stringify(updatedPosts));
    setActiveSection('overview');
  };

  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setActiveSection('new-post');
  };

  const handleDeletePost = (postId: string) => {
    const updatedPosts = posts.filter(p => p.id !== postId);
    setPosts(updatedPosts);
    localStorage.setItem('blog-posts', JSON.stringify(updatedPosts));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold text-foreground">Blog Dashboard</h1>
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
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
      </main>
    </div>
  );
};

export default Index;

import React, { useState } from 'react';
import { BlogPost, SEOSettings } from '../../types/blog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Save, FileText, Edit3 } from 'lucide-react';
import DraftPostForm from './DraftPost/DraftPostForm';
import NewPostForm from './NewPost/NewPostForm';
import UpdatePostForm from './UpdatePost/UpdatePostForm';

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

/**
 * BlogFormManager - A demo component showing how to use the three separate form components
 * 
 * This component demonstrates:
 * 1. DraftPostForm - For creating and editing drafts
 * 2. NewPostForm - For creating new published posts
 * 3. UpdatePostForm - For updating existing published posts
 */

const BlogFormManager: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [drafts, setDrafts] = useState<DraftData[]>([]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState('new');

  // Handle saving a new or updated published post
  const handlePostSaved = (post: BlogPost) => {
    if (editingPost) {
      // Update existing post
      setPosts(prevPosts => 
        prevPosts.map(p => p.id === post.id ? post : p)
      );
      setEditingPost(null);
    } else {
      // Add new post
      setPosts(prevPosts => [...prevPosts, post]);
    }
    
    console.log('Post saved:', post);
  };

  // Handle saving a draft
  const handleDraftSaved = (draft: DraftData) => {
    setDrafts(prevDrafts => {
      const existingIndex = prevDrafts.findIndex(d => d.id === draft.id);
      if (existingIndex >= 0) {
        // Update existing draft
        const updated = [...prevDrafts];
        updated[existingIndex] = draft;
        return updated;
      } else {
        // Add new draft
        return [...prevDrafts, draft];
      }
    });
    
    console.log('Draft saved:', draft);
  };

  // Handle editing an existing post
  const handleEditPost = (post: BlogPost) => {
    setEditingPost(post);
    setActiveTab('update');
  };

  // Convert draft to published post
  const handlePublishDraft = (draft: DraftData) => {
    const post: BlogPost = {
      id: draft.id.replace('draft-', 'post-'),
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
      updatedAt: new Date().toISOString()
    };
    
    setPosts(prevPosts => [...prevPosts, post]);
    setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== draft.id));
    
    console.log('Draft published as post:', post);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Blog Content Management</h1>
          <p className="text-gray-600">Manage your blog posts with separate forms for drafts, new posts, and updates.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              New Post
            </TabsTrigger>
            <TabsTrigger value="draft" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Draft
            </TabsTrigger>
            <TabsTrigger value="update" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Update Post
            </TabsTrigger>
            <TabsTrigger value="manage" className="flex items-center gap-2">
              Manage Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new">
            <NewPostForm onPostSaved={handlePostSaved} />
          </TabsContent>

          <TabsContent value="draft">
            <DraftPostForm 
              onPostSaved={handlePostSaved} 
              onDraftSaved={handleDraftSaved}
            />
          </TabsContent>

          <TabsContent value="update">
            {editingPost ? (
              <UpdatePostForm 
                onPostSaved={handlePostSaved} 
                editingPost={editingPost}
              />
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Post Selected</h3>
                <p className="text-gray-600 mb-4">Select a post from the "Manage Content" tab to edit it.</p>
                <Button onClick={() => setActiveTab('manage')}>
                  Go to Manage Content
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="manage">
            <div className="space-y-6">
              {/* Published Posts */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Published Posts ({posts.length})</h3>
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{post.title}</h4>
                          <p className="text-sm text-gray-600">{post.category} • {post.subcategory}</p>
                          <p className="text-xs text-gray-500">Updated: {new Date(post.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <Button onClick={() => handleEditPost(post)} size="sm">
                          Edit Post
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No published posts yet.</p>
                )}
              </div>

              {/* Drafts */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Drafts ({drafts.length})</h3>
                {drafts.length > 0 ? (
                  <div className="space-y-4">
                    {drafts.map((draft) => (
                      <div key={draft.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg">
                        <div>
                          <h4 className="font-medium text-gray-900">{draft.title}</h4>
                          <p className="text-sm text-gray-600">{draft.category} • {draft.subcategory}</p>
                          <p className="text-xs text-gray-500">Updated: {new Date(draft.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => handlePublishDraft(draft)} size="sm">
                            Publish
                          </Button>
                          <Button 
                            onClick={() => {
                              // Convert draft to BlogPost format for editing
                              const postForEdit: BlogPost = {
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
                              setEditingPost(postForEdit);
                              setActiveTab('draft');
                            }} 
                            variant="outline" 
                            size="sm"
                          >
                            Edit Draft
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No drafts yet.</p>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BlogFormManager;

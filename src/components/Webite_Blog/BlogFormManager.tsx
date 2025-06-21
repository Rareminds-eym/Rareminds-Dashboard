import React, { useState } from 'react';
import { BlogPost, SEOSettings } from '../../types/blog';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Save, FileText, Edit3, Trash2 } from 'lucide-react';
import { Modal, ConfirmModal } from '../ui/modal';
import DraftPostForm from './DraftPost/DraftPostForm';
import NewPostForm from './NewPost/NewPostForm';
import UpdatePostForm from './UpdatePost/UpdatePostForm';
import { useUserRole } from '../../hooks/useUserRole';
import { canEditAndDeletePosts } from '../../lib/role-utils';

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
  // Sample data for demonstration
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: 'post-1',
      title: 'Getting Started with React',
      content: 'This is a sample blog post about React...',
      excerpt: 'Learn the basics of React development',
      featuredImage: '',
      altImage: '',
      category: 'Technology',
      subcategory: 'Frontend',
      tags: ['React', 'JavaScript', 'Web Development'],
      seo: {
        metaTitle: 'Getting Started with React',
        metaDescription: 'Learn React basics',
        slug: 'getting-started-with-react'
      },
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString()
    }
  ]);
  const [drafts, setDrafts] = useState<DraftData[]>([
    {
      id: 'draft-1',
      title: 'Advanced React Patterns',
      content: 'This is a draft about advanced React patterns...',
      excerpt: 'Explore advanced React development patterns',
      featuredImage: '',
      altImage: '',
      category: 'Technology',
      subcategory: 'Frontend',
      tags: ['React', 'Advanced', 'Patterns'],
      seo: {
        metaTitle: 'Advanced React Patterns',
        metaDescription: 'Advanced React patterns',
        slug: 'advanced-react-patterns'
      },
      status: 'draft' as const,
      createdAt: new Date('2024-01-20').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString()
    }
  ]);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState('manage'); // Start with manage tab to show the modal demo
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: 'post' | 'draft';
    item: BlogPost | DraftData | null;
  }>({
    open: false,
    type: 'post',
    item: null
  });
  const { userRole } = useUserRole();

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

  // Handle delete confirmation modal
  const handleDeleteClick = (type: 'post' | 'draft', item: BlogPost | DraftData) => {
    setDeleteModal({
      open: true,
      type,
      item
    });
  };

  // Handle actual deletion
  const handleConfirmDelete = () => {
    if (!deleteModal.item) return;

    if (deleteModal.type === 'post') {
      setPosts(prevPosts => prevPosts.filter(p => p.id !== deleteModal.item!.id));
      console.log('Post deleted:', deleteModal.item.id);
    } else {
      setDrafts(prevDrafts => prevDrafts.filter(d => d.id !== deleteModal.item!.id));
      console.log('Draft deleted:', deleteModal.item.id);
    }

    setDeleteModal({ open: false, type: 'post', item: null });
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
              Drafts
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
                      <div key={post.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{post.title}</h4>
                          <p className="text-sm text-gray-600">{post.category} • {post.subcategory}</p>
                          <p className="text-xs text-gray-500">Updated: {new Date(post.updatedAt).toLocaleDateString()}</p>
                        </div>
                        {canEditAndDeletePosts(userRole) && (
                          <div className="flex gap-2">
                            <Button onClick={() => handleEditPost(post)} size="sm" variant="outline">
                              <Edit3 className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              onClick={() => handleDeleteClick('post', post)} 
                              size="sm" 
                              variant="outline"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
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
                      <div key={draft.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{draft.title}</h4>
                          <p className="text-sm text-gray-600">{draft.category} • {draft.subcategory}</p>
                          <p className="text-xs text-gray-500">Updated: {new Date(draft.updatedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handlePublishDraft(draft)} 
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
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
                            <Edit3 className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            onClick={() => handleDeleteClick('draft', draft)}
                            variant="outline" 
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          open={deleteModal.open}
          onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}
          title={`Delete ${deleteModal.type === 'post' ? 'Post' : 'Draft'}`}
          description={`Are you sure you want to delete "${deleteModal.item?.title}"? This action cannot be undone.`}
          onConfirm={handleConfirmDelete}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default BlogFormManager;

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '../types/blog';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { useUserRole } from './useUserRole';
import type { Json } from '@/integrations/supabase/types';

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();

  // Fetch posts from database
  const fetchPosts = useCallback(async () => {
    if (!user) {
      setPosts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching posts:', error);
        toast({
          title: "Error",
          description: "Failed to fetch posts",
          variant: "destructive"
        });
      } else {
        // Transform database data to match BlogPost interface
        const transformedPosts: BlogPost[] = data.map(post => ({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          featuredImage: post.featured_image,
          altImage: post.alt_image || '',
          category: post.category,
          subcategory: post.subcategory || '',
          tags: post.tags || [],
          seo: {
            metaTitle: post.meta_title,
            metaDescription: post.meta_description,
            slug: post.slug
          },
          createdAt: post.created_at,
          updatedAt: post.updated_at
        }));
        setPosts(transformedPosts);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Set up realtime subscription
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchPosts();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('blog_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blog_posts'
        },
        () => {
          // Refetch posts when any change occurs
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchPosts]);

  const createPost = async (postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          user_id: user.id,
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          featured_image: postData.featuredImage,
          alt_image: postData.altImage || '',
          category: postData.category,
          subcategory: postData.subcategory,
          tags: postData.tags,
          meta_title: postData.seo.metaTitle,
          meta_description: postData.seo.metaDescription,
          slug: postData.seo.slug
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating post:', error);
        toast({
          title: "Error",
          description: "Failed to create post",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success!",
        description: "Post created successfully"
      });

      return data;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  };

  const updatePost = async (id: string, postData: Partial<BlogPost>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .update({
          title: postData.title,
          content: postData.content,
          excerpt: postData.excerpt,
          featured_image: postData.featuredImage,
          alt_image: postData.altImage || '',
          category: postData.category,
          subcategory: postData.subcategory,
          tags: postData.tags,
          meta_title: postData.seo?.metaTitle,
          meta_description: postData.seo?.metaDescription,
          slug: postData.seo?.slug
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating post:', error);
        toast({
          title: "Error",
          description: "Failed to update post",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success!",
        description: "Post updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating post:', error);
      return null;
    }
  };

  const deletePost = async (id: string) => {
    if (!user) {
      console.error('No user found for deletion');
      toast({
        title: "Error",
        description: "You must be logged in to delete posts",
        variant: "destructive"
      });
      return false;
    }

    try {
      console.log('Attempting to delete post with ID:', id);
      console.log('Current user:', user.id);

      // First, check if the post exists and belongs to the user
      const { data: existingPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching post before deletion:', fetchError);
        toast({
          title: "Error",
          description: `Failed to find post: ${fetchError.message}`,
          variant: "destructive"
        });
        return false;
      }

      if (!existingPost) {
        console.error('Post not found with ID:', id);
        toast({
          title: "Error",
          description: "Post not found",
          variant: "destructive"
        });
        return false;
      }

      console.log('Found post:', existingPost);

      // Check if user owns the post or is an owner (can delete any post)
      if (existingPost.user_id !== user.id && userRole !== 'owner') {
        console.error('User does not own this post and is not an owner');
        toast({
          title: "Error",
          description: "You can only delete your own posts",
          variant: "destructive"
        });
        return false;
      }

      // Now attempt the deletion
      let deleteQuery = supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      // If user is not an owner, add additional security check
      if (userRole !== 'owner') {
        deleteQuery = deleteQuery.eq('user_id', user.id);
      }

      const { data, error } = await deleteQuery;

      if (error) {
        console.error('Error deleting post:', error);
        toast({
          title: "Error",
          description: `Failed to delete post: ${error.message}`,
          variant: "destructive"
        });
        return false;
      }

      console.log('Delete operation response:', data);

      toast({
        title: "Success!",
        description: "Post deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Exception during post deletion:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the post",
        variant: "destructive"
      });
      return false;
    }
  };

  return {
    posts,
    loading,
    createPost,
    updatePost,
    deletePost,
    refetch: fetchPosts
  };
};

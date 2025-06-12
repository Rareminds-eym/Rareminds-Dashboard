import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BlogPost } from '../types/blog';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useBlogPosts = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch posts from database
  const fetchPosts = async () => {
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
          category: post.category,
          subcategory: post.subcategory || '',
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
  };

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
  }, [user]);

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
          category: postData.category,
          subcategory: postData.subcategory,
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
          category: postData.category,
          subcategory: postData.subcategory,
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
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting post:', error);
        toast({
          title: "Error",
          description: "Failed to delete post",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success!",
        description: "Post deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
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

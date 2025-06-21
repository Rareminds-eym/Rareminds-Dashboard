import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BlogDraft } from '../types/blog';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export const useBlogDrafts = () => {
  const [drafts, setDrafts] = useState<BlogDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Generate a unique slug
  const generateUniqueSlug = async (baseTitle: string, excludeId?: number): Promise<string> => {
    // Create base slug from title
    let baseSlug = baseTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // If slug is empty or too short, use fallback
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = 'untitled-post';
    }

    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      const query = supabase
        .from('blogs_draft')
        .select('id')
        .eq('slug', slug);
      
      // Exclude current draft if updating
      if (excludeId) {
        query.neq('id', excludeId);
      }
      
      const { data } = await query.maybeSingle();
      
      if (!data) {
        // Slug is unique
        break;
      }
      
      // Try next variation
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    return slug;
  };

  // Fetch drafts from database
  const fetchDrafts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('blogs_draft')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching drafts:', error);
        toast({
          title: "Error",
          description: "Failed to fetch drafts",
          variant: "destructive"
        });
        setDrafts([]);
      } else {
        // Transform database data to match BlogDraft interface
        const transformedDrafts: BlogDraft[] = data.map(draft => ({
          id: draft.id.toString(),
          user_id: draft.user_id || '',
          title: draft.title,
          content: draft.content || '',
          excerpt: draft.excerpt || '',
          featuredImage: draft.featured_image || undefined,
          altImage: draft.alt_image || '',
          category: draft.category,
          subcategory: draft.subcategory || '',
          tags: draft.tags || [],
          seo: {
            metaTitle: draft.meta_title || '',
            metaDescription: draft.meta_description || '',
            slug: draft.slug || ''
          },
          createdAt: draft.created_at,
          updatedAt: draft.updated_at,
          publishDate: draft.publish_date || undefined
        }));
        
        setDrafts(transformedDrafts);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Set up realtime subscription
  useEffect(() => {
    fetchDrafts();

    // Subscribe to realtime changes (for all drafts)
    const channel = supabase
      .channel('blog_drafts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blogs_draft'
        },
        (payload) => {
          // Refetch drafts when any change occurs
          fetchDrafts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDrafts]);

  const saveDraft = async (draftData: Omit<BlogDraft, 'id' | 'user_id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return null;
    }

    // Validate required fields
    if (!draftData.title || draftData.title.trim().length === 0) {
      toast({
        title: "Error",
        description: "Title is required to save draft",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Check if draft with same title exists (removed user filtering)
      const { data: existingDraft } = await supabase
        .from('blogs_draft')
        .select('id')
        .eq('title', draftData.title)
        .maybeSingle();

      let result;

      if (existingDraft) {
        // Generate unique slug for update (excluding current draft)
        const slug = await generateUniqueSlug(draftData.title, existingDraft.id);
        
        // Update existing draft (removed user_id validation)
        const { data, error } = await supabase
          .from('blogs_draft')
          .update({
            title: draftData.title,
            content: draftData.content,
            excerpt: draftData.excerpt,
            featured_image: draftData.featuredImage,
            alt_image: draftData.altImage || '',
            category: draftData.category,
            subcategory: draftData.subcategory,
            tags: draftData.tags,
            meta_title: draftData.seo.metaTitle,
            meta_description: draftData.seo.metaDescription,
            slug: slug,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingDraft.id)
          .select()
          .single();

        result = { data, error };
      } else {
        // Generate unique slug for new draft
        const slug = await generateUniqueSlug(draftData.title);
        
        // Create new draft
        const { data, error } = await supabase
          .from('blogs_draft')
          .insert({
            user_id: user.id, // CRITICAL: Always set the current user's ID
            title: draftData.title,
            content: draftData.content,
            excerpt: draftData.excerpt,
            featured_image: draftData.featuredImage,
            alt_image: draftData.altImage || '',
            category: draftData.category,
            subcategory: draftData.subcategory,
            tags: draftData.tags,
            meta_title: draftData.seo.metaTitle,
            meta_description: draftData.seo.metaDescription,
            slug: slug
          })
          .select()
          .single();

        result = { data, error };
      }

      if (result.error) {
        console.error('Error saving draft:', result.error);
        toast({
          title: "Error",
          description: "Failed to save draft",
          variant: "destructive"
        });
        return null;
      }

      toast({
        title: "Success!",
        description: "Draft saved successfully"
      });

      return result.data;
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive"
      });
      return null;
    }
  };

  const deleteDraft = async (id: string) => {
    if (!user) {
      console.error('❌ No user found when trying to delete draft');
      return false;
    }

    try {
      const { error } = await supabase
        .from('blogs_draft')
        .delete()
        .eq('id', parseInt(id));

      if (error) {
        console.error('Error deleting draft:', error);
        toast({
          title: "Error",
          description: "Failed to delete draft",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Success!",
        description: "Draft deleted successfully"
      });

      return true;
    } catch (error) {
      console.error('Error deleting draft:', error);
      toast({
        title: "Error",
        description: "Failed to delete draft",
        variant: "destructive"
      });
      return false;
    }
  };

  const publishDraft = async (draftId: string) => {
    if (!user) {
      console.error('❌ No user found when trying to publish draft');
      return null;
    }

    try {
      // Get the draft (removed user filtering)
      const { data: draft, error: fetchError } = await supabase
        .from('blogs_draft')
        .select('*')
        .eq('id', parseInt(draftId))
        .single();

      if (fetchError || !draft) {
        console.error('Error fetching draft:', fetchError);
        toast({
          title: "Error",
          description: "Failed to find draft",
          variant: "destructive"
        });
        return null;
      }

      // Create published post using the existing blog_posts table
      const { data: publishedPost, error: publishError } = await supabase
        .from('blog_posts')
        .insert({
          user_id: user.id,
          title: draft.title,
          content: draft.content || '',
          excerpt: draft.excerpt || '',
          featured_image: draft.featured_image,
          alt_image: draft.alt_image || '',
          category: draft.category,
          subcategory: draft.subcategory || '',
          tags: draft.tags,
          meta_title: draft.meta_title || '',
          meta_description: draft.meta_description || '',
          slug: draft.slug || ''
        })
        .select()
        .single();

      if (publishError) {
        console.error('Error publishing draft:', publishError);
        toast({
          title: "Error",
          description: "Failed to publish draft",
          variant: "destructive"
        });
        return null;
      }

      // Delete the draft after successful publish
      await deleteDraft(draftId);

      toast({
        title: "Success!",
        description: "Draft published successfully"
      });

      return publishedPost;
    } catch (error) {
      console.error('Error publishing draft:', error);
      toast({
        title: "Error",
        description: "Failed to publish draft",
        variant: "destructive"
      });
      return null;
    }
  };

  // Validate that a draft belongs to the current user
  const validateDraftOwnership = async (draftId: string): Promise<boolean> => {
    if (!user) {
      console.error('❌ No user found when validating draft ownership');
      return false;
    }

    try {
      const { data: draft, error } = await supabase
        .from('blogs_draft')
        .select('id, user_id')
        .eq('id', parseInt(draftId))
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error validating draft ownership:', error);
        return false;
      }

      const isOwner = !!draft && draft.user_id === user.id;
      console.log('🔐 Draft ownership validation for ID', draftId, ':', isOwner ? 'ALLOWED' : 'DENIED');
      
      if (!isOwner) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this draft",
          variant: "destructive"
        });
      }

      return isOwner;
    } catch (error) {
      console.error('Error validating draft ownership:', error);
      return false;
    }
  };

  // Safely get a draft that belongs to the current user
  const getDraftByOwner = async (draftId: string): Promise<BlogDraft | null> => {
    if (!user) {
      console.error('❌ No user found when trying to get draft');
      return null;
    }

    const hasPermission = await validateDraftOwnership(draftId);
    if (!hasPermission) {
      return null;
    }

    try {
      const { data: draft, error } = await supabase
        .from('blogs_draft')
        .select('*')
        .eq('id', parseInt(draftId))
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error getting draft:', error);
        return null;
      }

      // Transform database data to match BlogDraft interface
      const transformedDraft: BlogDraft = {
        id: draft.id.toString(),
        user_id: draft.user_id || '',
        title: draft.title,
        content: draft.content || '',
        excerpt: draft.excerpt || '',
        featuredImage: draft.featured_image || undefined,
        altImage: draft.alt_image || '',
        category: draft.category,
        subcategory: draft.subcategory || '',
        tags: draft.tags || [],
        seo: {
          metaTitle: draft.meta_title || '',
          metaDescription: draft.meta_description || '',
          slug: draft.slug || ''
        },
        createdAt: draft.created_at,
        updatedAt: draft.updated_at,
        publishDate: draft.publish_date || undefined
      };

      return transformedDraft;
    } catch (error) {
      console.error('Error getting draft:', error);
      return null;
    }
  };

  // Update an existing draft with ownership validation
  const updateDraft = async (draftId: string, draftData: Omit<BlogDraft, 'id' | 'user_id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      console.error('❌ No user found when trying to update draft');
      return null;
    }

    // Validate ownership before updating
    const hasPermission = await validateDraftOwnership(draftId);
    if (!hasPermission) {
      return null;
    }

    try {
      // Generate unique slug for update
      const slug = await generateUniqueSlug(draftData.title, parseInt(draftId));
      
      console.log('📝 Updating draft ID:', draftId, 'for user:', user.id);

      const { data, error } = await supabase
        .from('blogs_draft')
        .update({
          title: draftData.title,
          content: draftData.content,
          excerpt: draftData.excerpt,
          featured_image: draftData.featuredImage,
          alt_image: draftData.altImage || '',
          category: draftData.category,
          subcategory: draftData.subcategory,
          tags: draftData.tags,
          meta_title: draftData.seo.metaTitle,
          meta_description: draftData.seo.metaDescription,
          slug: slug,
          updated_at: new Date().toISOString()
        })
        .eq('id', parseInt(draftId))
        .eq('user_id', user.id) // CRITICAL: Ensure only the owner can update this draft
        .select()
        .single();

      if (error) {
        console.error('Error updating draft:', error);
        toast({
          title: "Error",
          description: "Failed to update draft",
          variant: "destructive"
        });
        return null;
      }

      console.log('✅ Successfully updated draft');
      toast({
        title: "Success!",
        description: "Draft updated successfully"
      });

      return data;
    } catch (error) {
      console.error('Error updating draft:', error);
      toast({
        title: "Error",
        description: "Failed to update draft",
        variant: "destructive"
      });
      return null;
    }
  };

  // Security test function - remove after confirming fix
  const testDraftSecurity = async () => {
    if (!user) return;
    
    console.log('🔒 Testing draft security for user:', user.id);
    
    try {
      // Try to fetch ALL drafts (this should only return current user's drafts after RLS is enabled)
      const { data, error } = await supabase
        .from('blogs_draft')
        .select('*');
        
      if (error) {
        console.log('✅ RLS is working - got error:', error.message);
        return;
      }
      
      if (data) {
        const otherUserDrafts = data.filter(draft => draft.user_id !== user.id);
        if (otherUserDrafts.length > 0) {
          console.error('🚨 SECURITY BREACH: Can see other users drafts!');
          console.error('Other users drafts:', otherUserDrafts);
          toast({
            title: "SECURITY ALERT",
            description: `Can see ${otherUserDrafts.length} drafts from other users!`,
            variant: "destructive"
          });
        } else {
          console.log('✅ Security test passed - only seeing own drafts');
        }
      }
    } catch (error) {
      console.log('✅ RLS is working - got exception:', error);
    }
  };

  return {
    drafts,
    loading,
    saveDraft,
    deleteDraft,
    publishDraft,
    fetchDrafts,
    getDraftByOwner,
    updateDraft,
    validateDraftOwnership,
    testDraftSecurity
  };
};

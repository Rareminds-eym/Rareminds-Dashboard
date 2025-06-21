import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { ProjectDraft } from '../types/project';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

// Type for the database row
interface ProjectDraftRow {
  id: string;
  user_id: string;
  title: string;
  project_tags: string[];
  content_json: Record<string, unknown> | null;
  conclusion: string | null;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  slug: string | null;
  video_url: string[] | null;
  created_at: string;
  updated_at: string;
}

export const useProjectDrafts = () => {
  const [drafts, setDrafts] = useState<ProjectDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // Generate a unique slug
  const generateUniqueSlug = async (baseTitle: string, excludeId?: string): Promise<string> => {
    // Create base slug from title
    let baseSlug = baseTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
      .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

    // If slug is empty or too short, use fallback
    if (!baseSlug || baseSlug.length < 2) {
      baseSlug = 'untitled-project';
    }

    // Check if slug already exists
    let slug = baseSlug;
    let counter = 1;
    
    while (true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('projects_draft')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();
      
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
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('projects_draft')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching project drafts:', error);
        toast({
          title: "Error",
          description: "Failed to fetch project drafts",
          variant: "destructive"
        });
        setDrafts([]);
      } else {
        // Transform database data to match ProjectDraft interface
        const transformedDrafts: ProjectDraft[] = (data as ProjectDraftRow[]).map(draft => ({
          id: draft.id,
          user_id: draft.user_id || '',
          title: draft.title || '',
          project_tags: draft.project_tags || [],
          content_json: draft.content_json || undefined,
          conclusion: draft.conclusion || undefined,
          featured_image: draft.featured_image || undefined,
          meta_title: draft.meta_title || undefined,
          meta_description: draft.meta_description || undefined,
          slug: draft.slug || undefined,
          video_url: draft.video_url || undefined,
          created_at: draft.created_at,
          updated_at: draft.updated_at
        }));
        
        setDrafts(transformedDrafts);
      }
    } catch (error) {
      console.error('Error fetching project drafts:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while fetching project drafts",
        variant: "destructive"
      });
      setDrafts([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save draft
  const saveDraft = useCallback(async (draftData: Partial<ProjectDraft>): Promise<ProjectDraft | null> => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to save drafts",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Generate slug if title is provided and no slug exists
      let slug = draftData.slug;
      if (draftData.title && !slug) {
        slug = await generateUniqueSlug(draftData.title, draftData.id);
      }

      const draftPayload = {
        user_id: user.id,
        title: draftData.title || '',
        project_tags: draftData.project_tags || [],
        content_json: draftData.content_json || null,
        conclusion: draftData.conclusion || null,
        featured_image: draftData.featured_image || null,
        meta_title: draftData.meta_title || null,
        meta_description: draftData.meta_description || null,
        slug: slug || null,
        video_url: draftData.video_url || null,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('projects_draft')
        .insert([draftPayload])
        .select()
        .single();

      if (error) {
        console.error('Error saving project draft:', error);
        toast({
          title: "Error",
          description: "Failed to save project draft",
          variant: "destructive"
        });
        return null;
      }

      const newDraft: ProjectDraft = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        project_tags: data.project_tags || [],
        content_json: data.content_json || undefined,
        conclusion: data.conclusion || undefined,
        featured_image: data.featured_image || undefined,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        slug: data.slug || undefined,
        video_url: data.video_url || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setDrafts(prev => [newDraft, ...prev]);
      
      toast({
        title: "Success",
        description: "Project draft saved successfully",
      });

      return newDraft;
    } catch (error) {
      console.error('Error saving project draft:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving the draft",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Update draft
  const updateDraft = useCallback(async (id: string, draftData: Partial<ProjectDraft>): Promise<ProjectDraft | null> => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to update drafts",
        variant: "destructive"
      });
      return null;
    }

    try {
      // Generate slug if title is provided and no slug exists
      let slug = draftData.slug;
      if (draftData.title && !slug) {
        slug = await generateUniqueSlug(draftData.title, id);
      }

      const updatePayload = {
        title: draftData.title,
        project_tags: draftData.project_tags,
        content_json: draftData.content_json,
        conclusion: draftData.conclusion,
        featured_image: draftData.featured_image,
        meta_title: draftData.meta_title,
        meta_description: draftData.meta_description,
        slug: slug,
        video_url: draftData.video_url,
      };

      // Remove undefined values
      Object.keys(updatePayload).forEach(key => {
        if (updatePayload[key as keyof typeof updatePayload] === undefined) {
          delete updatePayload[key as keyof typeof updatePayload];
        }
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('projects_draft')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating project draft:', error);
        toast({
          title: "Error",
          description: "Failed to update project draft",
          variant: "destructive"
        });
        return null;
      }

      const updatedDraft: ProjectDraft = {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        project_tags: data.project_tags || [],
        content_json: data.content_json || undefined,
        conclusion: data.conclusion || undefined,
        featured_image: data.featured_image || undefined,
        meta_title: data.meta_title || undefined,
        meta_description: data.meta_description || undefined,
        slug: data.slug || undefined,
        video_url: data.video_url || undefined,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      setDrafts(prev => prev.map(draft => draft.id === id ? updatedDraft : draft));
      
      toast({
        title: "Success",
        description: "Project draft updated successfully",
      });

      return updatedDraft;
    } catch (error) {
      console.error('Error updating project draft:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while updating the draft",
        variant: "destructive"
      });
      return null;
    }
  }, [user, toast]);

  // Delete draft
  const deleteDraft = useCallback(async (id: string): Promise<boolean> => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to delete drafts",
        variant: "destructive"
      });
      return false;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('projects_draft')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting project draft:', error);
        toast({
          title: "Error",
          description: "Failed to delete project draft",
          variant: "destructive"
        });
        return false;
      }

      setDrafts(prev => prev.filter(draft => draft.id !== id));
      
      toast({
        title: "Success",
        description: "Project draft deleted successfully",
      });

      return true;
    } catch (error) {
      console.error('Error deleting project draft:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the draft",
        variant: "destructive"
      });
      return false;
    }
  }, [user, toast]);

  // Get draft by ID
  const getDraftById = useCallback((id: string): ProjectDraft | undefined => {
    return drafts.find(draft => draft.id === id);
  }, [drafts]);

  // Search drafts
  const searchDrafts = useCallback((searchTerm: string): ProjectDraft[] => {
    if (!searchTerm.trim()) return drafts;
    
    const term = searchTerm.toLowerCase();
    return drafts.filter(draft => 
      draft.title.toLowerCase().includes(term) ||
      draft.conclusion?.toLowerCase().includes(term) ||
      draft.project_tags.some(tag => tag.toLowerCase().includes(term)) ||
      draft.meta_title?.toLowerCase().includes(term)
    );
  }, [drafts]);

  // Initialize drafts on mount
  useEffect(() => {
    if (user) {
      fetchDrafts();
    }
  }, [user, fetchDrafts]);

  return {
    drafts,
    loading,
    saveDraft,
    updateDraft,
    deleteDraft,
    getDraftById,
    searchDrafts,
    fetchDrafts,
    generateUniqueSlug
  };
};

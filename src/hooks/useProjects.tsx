import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { ProjectPost, ProjectFormData, TipTapDocument } from '../types/project';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';
import type { Json } from '../integrations/supabase/types';

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { userRole } = useUserRole();
  const { toast } = useToast();

  // Helper function to convert database row to ProjectPost
  const dbRowToProjectPost = (row: {
    id: string;
    user_id: string;
    title: string;
    featured_image: string | null;
    meta_title: string;
    meta_description: string;
    slug: string;
    videos_url: string[] | null;
    project_tags: string | null;
    content_json: Json | null;
    conclusion: string | null;
    created_at: string;
    updated_at: string;
  }): ProjectPost => {
    return {
      id: row.id,
      user_id: row.user_id,
      title: row.title,
      featured_image: row.featured_image,
      meta_title: row.meta_title,
      meta_description: row.meta_description,
      slug: row.slug,
      videos_url: row.videos_url || undefined,
      project_tags: row.project_tags ? row.project_tags.split(',').map((tag: string) => tag.trim()) : [],
      content_json: row.content_json as unknown as TipTapDocument,
      conclusion: row.conclusion,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  };

  // Fetch all projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('project_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const projectsWithParsedTags = data?.map(dbRowToProjectPost) || [];
      setProjects(projectsWithParsedTags);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new project
  const createProject = async (projectData: ProjectFormData): Promise<ProjectPost | null> => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Convert tags array to comma-separated string
      const tagsString = projectData.project_tags.join(', ');

      const newProject = {
        user_id: user.id,
        title: projectData.title,
        featured_image: projectData.featured_image || null,
        meta_title: projectData.seo.meta_title,
        meta_description: projectData.seo.meta_description,
        slug: projectData.seo.slug,
        videos_url: projectData.videos_url || null,
        project_tags: tagsString || null,
        content_json: projectData.content_json as unknown as Json,
        conclusion: projectData.conclusion || null,
      };

      const { data, error } = await supabase
        .from('project_posts')
        .insert(newProject)
        .select()
        .single();

      if (error) throw error;

      const createdProject = dbRowToProjectPost(data);
      setProjects(prev => [createdProject, ...prev]);
      
      toast({
        title: "Success",
        description: "Project created successfully!",
        variant: "default"
      });

      return createdProject;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing project
  const updateProject = async (id: string, projectData: ProjectFormData): Promise<ProjectPost | null> => {
    try {
      setLoading(true);
      setError(null);

      // Convert tags array to comma-separated string
      const tagsString = projectData.project_tags.join(', ');

      const updatedProject = {
        title: projectData.title,
        featured_image: projectData.featured_image || null,
        meta_title: projectData.seo.meta_title,
        meta_description: projectData.seo.meta_description,
        slug: projectData.seo.slug,
        videos_url: projectData.videos_url || null,
        project_tags: tagsString || null,
        content_json: projectData.content_json as unknown as Json,
        conclusion: projectData.conclusion || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('project_posts')
        .update(updatedProject)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedProjectWithTags = dbRowToProjectPost(data);
      setProjects(prev => prev.map(project => 
        project.id === id ? updatedProjectWithTags : project
      ));
      
      toast({
        title: "Success",
        description: "Project updated successfully!",
        variant: "default"
      });

      return updatedProjectWithTags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete projects",
        variant: "destructive"
      });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // First, check if the project exists and get its owner
      const { data: existingProject, error: fetchError } = await supabase
        .from('project_posts')
        .select('id, user_id, title')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Error fetching project before deletion:', fetchError);
        toast({
          title: "Error",
          description: `Failed to find project: ${fetchError.message}`,
          variant: "destructive"
        });
        return false;
      }

      if (!existingProject) {
        toast({
          title: "Error",
          description: "Project not found",
          variant: "destructive"
        });
        return false;
      }

      // Check if user owns the project or is an owner (can delete any project)
      if (existingProject.user_id !== user.id && userRole !== 'owner') {
        toast({
          title: "Error",
          description: "You can only delete your own projects",
          variant: "destructive"
        });
        return false;
      }

      // Now attempt the deletion
      let deleteQuery = supabase
        .from('project_posts')
        .delete()
        .eq('id', id);

      // If user is not an owner, add additional security check
      if (userRole !== 'owner') {
        deleteQuery = deleteQuery.eq('user_id', user.id);
      }

      const { error } = await deleteQuery;

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== id));
      
      toast({
        title: "Success",
        description: "Project deleted successfully!",
        variant: "default"
      });

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Get a single project by ID
  const getProjectById = async (id: string): Promise<ProjectPost | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('project_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      const projectWithTags = dbRowToProjectPost(data);
      return projectWithTags;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch project';
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Load projects on hook initialization
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
  };
};

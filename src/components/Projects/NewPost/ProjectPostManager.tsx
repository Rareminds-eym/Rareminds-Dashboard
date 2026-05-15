import { useState, useEffect } from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { ProjectPost, ProjectFormData } from '../../../types/project';
import NewPostSection from './NewPostSection';
import { useToast } from '../../../hooks/use-toast';

interface ProjectPostManagerProps {
  editingProject?: ProjectPost | null;
}

const ProjectPostManager = ({ editingProject: externalEditingProject }: ProjectPostManagerProps) => {
  const [editingPost, setEditingPost] = useState<ProjectPost | null>(null);
  const { createProject, updateProject } = useProjects();
  const { toast } = useToast();

  // Update internal editing state when external prop changes
  useEffect(() => {
    setEditingPost(externalEditingProject || null);
  }, [externalEditingProject]);

  const handlePostSaved = async (postData: ProjectPost) => {
    // Convert ProjectPost to ProjectFormData format
    const formData: ProjectFormData = {
      title: postData.title,
      featured_image: postData.featured_image,
      videos_url: postData.videos_url,
      project_tags: postData.project_tags || [],
      content_json: postData.content_json || { type: 'doc', content: [] },
      conclusion: postData.conclusion,
      seo: {
        meta_title: postData.meta_title,
        meta_description: postData.meta_description,
        slug: postData.slug,
      },
    };

    try {
      if (editingPost) {
        // Update existing project
        const updatedProject = await updateProject(editingPost.id, formData);
        if (updatedProject) {
          setEditingPost(null);
          toast({
            title: "Success",
            description: "Project updated successfully!",
            variant: "default"
          });
        }
      } else {
        // Create new project
        const newProject = await createProject(formData);
        if (newProject) {
          toast({
            title: "Success",
            description: "Project created successfully!",
            variant: "default"
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save project. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <NewPostSection
      onPostSaved={handlePostSaved}
      editingPost={editingPost}
    />
  );
};

export default ProjectPostManager;

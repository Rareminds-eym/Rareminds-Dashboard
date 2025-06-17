import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Plus, List, Edit3 } from 'lucide-react';
import ProjectList from './PostedPosts/ProjectList';
import ProjectPostManager from './NewPost/ProjectPostManager';
import { ProjectPost } from '../../types/project';

const ProjectManagement = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [editingProject, setEditingProject] = useState<ProjectPost | null>(null);

  const handleEditProject = (project: ProjectPost) => {
    setEditingProject(project);
    setActiveTab('new');
  };

  const handleNewProject = () => {
    setEditingProject(null);
    setActiveTab('new');
  };

  const handleBackToList = () => {
    setEditingProject(null);
    setActiveTab('list');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
      <ProjectPostManager
        editingProject={editingProject}
      />
      </div>
    </div>
  );
};

export default ProjectManagement;

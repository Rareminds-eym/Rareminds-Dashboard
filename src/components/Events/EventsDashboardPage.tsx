import { useState } from 'react';
import { Plus, FileText, Eye } from 'lucide-react';
import DashboardOverview from './Dashboard/DashboardOverview';
import PostedPostsSection from './PostedPosts/PostedPostsSection';
import ProjectPostManager from './NewPost/ProjectPostManager';
import { ProjectPost } from '../../types/project';
import { useProjects } from '../../hooks/useProjects';

const ProjectsDashboardPage = () => {
  const { projects, loading: projectsLoading, deleteProject } = useProjects();
  const [activeSection, setActiveSection] = useState('overview');
  const [editingProject, setEditingProject] = useState<ProjectPost | null>(null);

  const handleProjectSaved = () => {
    setEditingProject(null);
    setActiveSection('overview');
  };

  const handleEditProject = (project: ProjectPost) => {
    setEditingProject(project);
    setActiveSection('new-post');
  };

  const handleDeleteProject = async (projectId: string) => {
    await deleteProject(projectId);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage and track your Events</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/60 rounded-full p-1">
              <button
                onClick={() => setActiveSection('overview')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setActiveSection('new-post');
                }}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'new-post'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Project
              </button>
              <button
                onClick={() => setActiveSection('projects')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'projects'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Events
                <span className="ml-1 px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 rounded-full">
                  {projects.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {projectsLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-900 dark:text-white font-medium">Loading your projects</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Please wait while we fetch your projects...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {activeSection === 'overview' && (
              <div className="animate-in fade-in duration-500">
                <DashboardOverview 
                  projects={projects} 
                  onNewProject={() => {
                    setEditingProject(null);
                    setActiveSection('new-post');
                  }}
                  onViewProjects={() => setActiveSection('projects')}
                />
              </div>
            )}
            {activeSection === 'new-post' && (
              <div className="animate-in fade-in duration-500">
                <ProjectPostManager 
                  editingProject={editingProject}
                />
              </div>
            )}
            {activeSection === 'projects' && (
              <div className="animate-in fade-in duration-500">
                <PostedPostsSection 
                  posts={projects}
                  onEditPost={handleEditProject}
                  onDeletePost={handleDeleteProject}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default ProjectsDashboardPage;

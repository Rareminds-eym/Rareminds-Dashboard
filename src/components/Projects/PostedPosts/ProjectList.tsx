import { useEffect } from 'react';
import { useProjects } from '../../../hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Skeleton } from '../../ui/skeleton';
import { Edit, Trash2, ExternalLink, Calendar, Video, Tag } from 'lucide-react';
import { ProjectPost } from '../../../types/project';

interface ProjectListProps {
  onEditProject?: (project: ProjectPost) => void;
}

const ProjectList = ({ onEditProject }: ProjectListProps) => {
  const { projects, loading, error, fetchProjects, deleteProject } = useProjects();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateText = (text: string, maxLength: number) => {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-slate-200/50">
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full mb-4" />
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">Error loading projects: {error}</p>
        <Button onClick={fetchProjects} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-slate-50 rounded-2xl p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">No Projects Yet</h3>
          <p className="text-slate-600 mb-4">
            Start by creating your first project to showcase your work.
          </p>
          <Button onClick={() => window.location.hash = '#new-project'}>
            Create Your First Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <Card key={project.id} className="border-slate-200/50 shadow-sm hover:shadow-md transition-all duration-200 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-slate-800 mb-2 line-clamp-2">
                  {project.title}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 text-sm text-slate-500">
                  <Calendar className="w-4 h-4" />
                  {formatDate(project.created_at)}
                </CardDescription>
              </div>
              <div className="flex gap-1 ml-2">
                {onEditProject && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEditProject(project)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(project.id)}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Featured Image */}
            {project.featured_image && (
              <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                <img
                  src={project.featured_image}
                  alt={project.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Meta Description */}
            {project.meta_description && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {truncateText(project.meta_description, 120)}
              </p>
            )}

            {/* Video URLs */}
            {project.videos_url && project.videos_url.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-purple-600">
                <Video className="w-4 h-4" />
                <span>Has {project.videos_url.length} Video{project.videos_url.length === 1 ? '' : 's'}</span>
              </div>
            )}

            {/* Tags */}
            {project.project_tags && project.project_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.project_tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200"
                  >
                    {tag}
                  </Badge>
                ))}
                {project.project_tags.length > 3 && (
                  <Badge
                    variant="secondary"
                    className="text-xs px-2 py-1 bg-slate-50 text-slate-600 border border-slate-200"
                  >
                    +{project.project_tags.length - 3} more
                  </Badge>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-sm border-slate-200 hover:border-slate-300"
                onClick={() => window.open(`/projects/${project.slug}`, '_blank')}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View
              </Button>
              {onEditProject && (
                <Button
                  size="sm"
                  className="flex-1 text-sm bg-blue-600 hover:bg-blue-700"
                  onClick={() => onEditProject(project)}
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ProjectList;

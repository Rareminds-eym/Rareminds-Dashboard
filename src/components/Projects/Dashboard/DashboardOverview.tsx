
import { ProjectPost } from '../../../types/project';
import { Plus, FileText, Calendar, TrendingUp, Video, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface DashboardOverviewProps {
  projects: ProjectPost[];
  onNewProject: () => void;
  onViewProjects: () => void;
}

const DashboardOverview = ({ projects, onNewProject, onViewProjects }: DashboardOverviewProps) => {
  const recentProjects = projects.slice(0, 3);
  const totalProjects = projects.length;
  const thisMonthProjects = projects.filter(project => {
    const projectDate = new Date(project.created_at);
    const now = new Date();
    return projectDate.getMonth() === now.getMonth() && projectDate.getFullYear() === now.getFullYear();
  }).length;

  // Get unique tags count
  const allTags = projects.flatMap(project => project.project_tags || []);
  const uniqueTags = new Set(allTags).size;

  return (
    <div className="space-y-8 p-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Projects</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              All published projects
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">This Month</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{thisMonthProjects}</div>
            <p className="text-xs text-muted-foreground">
              Projects this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Tags</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <Tag className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">
              {uniqueTags}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique project tags
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onNewProject} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <Plus className="w-4 h-4 mr-3" />
              New Project
            </Button>
            <Button onClick={onViewProjects} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 mr-3" />
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 rounded-3xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-light text-foreground">Recent Projects</CardTitle>
          <CardDescription className="text-muted-foreground">Your latest published projects</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentProjects.length > 0 ? (
            <div className="space-y-6">
              {recentProjects.map((project) => (
                <div key={project.id} className="group flex items-start space-x-4 p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-transparent hover:border-border/50">
                  {project.featured_image && (
                    <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                      <img
                        src={project.featured_image}
                        alt={project.title}
                        className="w-20 h-20 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-medium text-foreground truncate text-lg group-hover:text-primary transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {project.meta_description || 'No description available'}
                    </p>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {project.project_tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-primary/10 text-primary"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {(project.project_tags?.length || 0) > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600"
                          >
                            +{(project.project_tags?.length || 0) - 2} more
                          </Badge>
                        )}
                      </div>
                      {project.videos_url && project.videos_url.length > 0 && (
                        <div className="flex items-center gap-1 text-purple-600">
                          <Video className="w-3 h-3" />
                          <span>{project.videos_url.length} Video{project.videos_url.length === 1 ? '' : 's'}</span>
                        </div>
                      )}
                      <span className="text-muted-foreground">
                        {new Date(project.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-6 text-lg">No projects yet. Create your first project to get started!</p>
              <Button onClick={onNewProject} className="bg-primary hover:bg-primary/90 shadow-lg px-8 py-3 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create First Project
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;

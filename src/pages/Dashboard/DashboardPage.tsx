import { useNavigate } from 'react-router-dom';
import { FileText, FolderOpen, TrendingUp, Users, Calendar, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { useProjects } from '../../hooks/useProjects';
import { TrendCalculator } from '../../components/Dashboard/TrendCalculator';

const DashboardPage = () => {
  const navigate = useNavigate();
  const { posts, loading } = useBlogPosts();
  const { projects } = useProjects();

  const postsTrend = TrendCalculator.calculatePostsTrend(posts);
  const projectsTrend = TrendCalculator.calculateProjectsTrend(projects);

  const stats = [
    {
      title: 'Total Posts',
      value: posts.length,
      description: 'Published blog posts',
      icon: FileText,
      trend: postsTrend,
      color: TrendCalculator.getTrendColor(postsTrend, 'text-blue-600', 'text-red-600', 'text-gray-600')
    },
    {
      title: 'Projects',
      value: projects.length,
      description: 'Active projects',
      icon: FolderOpen,
      trend: projectsTrend,
      color: TrendCalculator.getTrendColor(projectsTrend, 'text-green-600', 'text-red-600', 'text-gray-600')
    },
    {
      title: 'Views',
      value: '12.4K',
      description: 'Total page views',
      icon: TrendingUp,
      trend: '+23%',
      color: 'text-purple-600'
    },
    {
      title: 'Engagement',
      value: '89%',
      description: 'User engagement rate',
      icon: Users,
      trend: '+8%',
      color: 'text-orange-600'
    }
  ];

  const recentPosts = posts.slice(0, 5);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Welcome back! Here's what's happening with your content.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
              </div>
              <div className="space-y-2">
                <p className="text-slate-900 dark:text-white font-medium">Loading dashboard</p>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Gathering your latest data...</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.title} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-muted-foreground">
                          {stat.description}
                        </p>
                        <span className="text-xs text-green-600 font-medium">
                          {stat.trend}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Blog Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Blog Management
                  </CardTitle>
                  <CardDescription>
                    Create and manage your blog content
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Recent Activity</p>
                      <p className="text-sm text-muted-foreground">
                        {posts.length} posts published
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/blog')}
                      className="flex-1"
                    >
                      Manage Blog
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => navigate('/blog')}
                    >
                      New Post
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Projects Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Project Portfolio
                  </CardTitle>
                  <CardDescription>
                    Track and showcase your projects
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Active Projects</p>
                      <p className="text-sm text-muted-foreground">
                        3 projects in development
                      </p>
                    </div>
                    <FolderOpen className="w-8 h-8 text-green-500" />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate('/projects')}
                      className="flex-1"
                    >
                      View Projects
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate('/projects')}
                    >
                      New Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Posts */}
            {recentPosts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Posts</CardTitle>
                  <CardDescription>
                    Your latest blog posts and their performance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <div className="space-y-1">
                          <h4 className="font-medium">{post.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            Published {new Date(post.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="text-sm font-medium">Status</p>
                            <p className="text-xs text-muted-foreground">Published</p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => navigate('/blog')}
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {posts.length > 5 && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => navigate('/blog')}
                      >
                        View All Posts
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Empty State for New Users */}
            {posts.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                      <FileText className="w-8 h-8 text-slate-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Welcome to RareMinds Dashboard
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        Get started by creating your first blog post or setting up a new project.
                      </p>
                    </div>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => navigate('/blog')}>
                        Create First Post
                      </Button>
                      <Button variant="outline" onClick={() => navigate('/projects')}>
                        Add Project
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardPage;

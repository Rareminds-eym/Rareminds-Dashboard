
import { BlogPost } from '../types/blog';
import { Plus, FileText, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface DashboardOverviewProps {
  posts: BlogPost[];
  onNewPost: () => void;
  onViewPosts: () => void;
}

const DashboardOverview = ({ posts, onNewPost, onViewPosts }: DashboardOverviewProps) => {
  const recentPosts = posts.slice(0, 3);
  const totalPosts = posts.length;
  const thisMonthPosts = posts.filter(post => {
    const postDate = new Date(post.createdAt);
    const now = new Date();
    return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-2">Manage your blog content and track your progress</p>
        </div>
        <Button onClick={onNewPost} className="w-fit">
          <Plus className="w-4 h-4 mr-2" />
          Create New Post
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              All published content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{thisMonthPosts}</div>
            <p className="text-xs text-muted-foreground">
              Posts published this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(posts.map(p => p.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique categories used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button onClick={onNewPost} variant="outline" size="sm" className="w-full">
              <Plus className="w-3 h-3 mr-2" />
              New Post
            </Button>
            <Button onClick={onViewPosts} variant="outline" size="sm" className="w-full">
              <FileText className="w-3 h-3 mr-2" />
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Posts</CardTitle>
          <CardDescription>Your latest published content</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id} className="flex items-start space-x-4 pb-4 border-b last:border-b-0">
                  {post.featuredImage && (
                    <img
                      src={post.featuredImage}
                      alt={post.title}
                      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-foreground truncate">{post.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                      <span className="bg-secondary px-2 py-1 rounded">{post.category}</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts yet. Create your first post to get started!</p>
              <Button onClick={onNewPost} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Create First Post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;

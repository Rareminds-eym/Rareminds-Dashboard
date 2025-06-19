
import { BlogPost } from '../../../types/blog';
import { Plus, FileText, Calendar, TrendingUp, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';

interface DashboardOverviewProps {
  posts: BlogPost[];
  onNewPost: () => void;
  onViewPosts: () => void;
}

const DashboardOverview = ({ posts, onNewPost, onViewPosts }: DashboardOverviewProps) => {
  const recentPosts = posts.slice(0, 10);
  const totalPosts = posts.length;
  const thisMonthPosts = posts.filter(post => {
    const postDate = new Date(post.createdAt);
    const now = new Date();
    return postDate.getMonth() === now.getMonth() && postDate.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-background to-secondary/20 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-light text-foreground tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-lg font-light">Manage your content with ease</p>
        </div>
        <Button onClick={onNewPost} className="bg-primary hover:bg-primary/90 shadow-xl px-6 py-3 rounded-xl shadow-black/10">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Posts</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{totalPosts}</div>
            <p className="text-xs text-muted-foreground">
              All published content
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
            <div className="text-3xl font-light text-foreground mb-1">{thisMonthPosts}</div>
            <p className="text-xs text-muted-foreground">
              Posts this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Categories</CardTitle>
            <div className="p-2 bg-purple-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">
              {new Set(posts.map(p => p.category)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique categories
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onNewPost} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <Plus className="w-4 h-4 mr-3" />
              New Post
            </Button>
            <Button onClick={onViewPosts} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 mr-3" />
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0  rounded-3xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="border-b mt-10 border-border/50 pb-4">
          <CardTitle className="text-xl font-light text-foreground">Recent Posts</CardTitle>
          <CardDescription className="text-muted-foreground">Your latest published content</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentPosts.length > 0 ? (
            <div className="space-y-6">
              {recentPosts.map((post) => (
                <div 
                  key={post.id} 
                  className="group relative flex items-start space-x-4 p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-transparent hover:border-border/50 cursor-pointer"
                  onClick={onViewPosts}
                >
                  {post.featuredImage && (
                    <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                      <img
                        src={post.featuredImage}
                        alt={post.title}
                        className="w-20 h-20 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-medium text-foreground truncate text-lg group-hover:text-primary transition-colors">
                      {post.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
                        {post.category}
                        {post.subcategory && post.subcategory !== "None" && ` / ${post.subcategory}`}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* View Project Button - appears on hover */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 o">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 rounded-3xl backdrop-blur-sm border-border/50 hover:bg-primary hover:text-white shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewPosts();
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-6 text-lg">No posts yet. Create your first post to get started!</p>
              <Button onClick={onNewPost} className="bg-primary hover:bg-primary/90 shadow-lg px-8 py-3 rounded-xl">
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

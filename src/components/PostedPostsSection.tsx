import { useState } from 'react';
import { BlogPost } from '../types/blog';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Edit, Trash2, Eye, Search, Calendar, Tag } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface PostedPostsSectionProps {
  posts: BlogPost[];
  onEditPost: (post: BlogPost) => void;
  onDeletePost: (postId: string) => void;
}

const PostedPostsSection = ({ posts, onEditPost, onDeletePost }: PostedPostsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const { toast } = useToast();

  const categories = [...new Set(posts.map(post => post.category))];
  
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeletePost = (postId: string, postTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      onDeletePost(postId);
    }
  };

  const renderContent = (content: string) => {
    return content
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2 text-foreground">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2 text-foreground">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
      .replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" class="text-primary underline hover:text-primary/80">$1</a>')
      .replace(/\n/gim, '<br>');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Published Posts</h2>
          <p className="text-muted-foreground mt-2">
            Manage your published blog posts ({filteredPosts.length} of {posts.length})
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search posts by title or content..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-lg transition-shadow">
              <div className="relative">
                {post.featuredImage && (
                  <img
                    src={post.featuredImage}
                    alt={post.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                )}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditPost(post)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePost(post.id, post.title)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {post.category}
                    {post.subcategory && ` / ${post.subcategory}`}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-foreground">
                  {post.title}
                </h3>
                
                <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setSelectedPost(post)}
                      >
                        <Eye className="w-3 h-3 mr-2" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl">{selectedPost?.title}</DialogTitle>
                        <DialogDescription className="flex items-center gap-4 text-sm">
                          <Badge variant="secondary">
                            <Tag className="w-3 h-3 mr-1" />
                            {selectedPost?.category}
                          </Badge>
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {selectedPost && new Date(selectedPost.createdAt).toLocaleDateString()}
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      
                      {selectedPost && (
                        <div className="space-y-6">
                          {selectedPost.featuredImage && (
                            <img
                              src={selectedPost.featuredImage}
                              alt={selectedPost.title}
                              className="w-full max-h-96 object-cover rounded-lg"
                            />
                          )}
                          
                          <div
                            className="prose prose-sm max-w-none"
                            dangerouslySetInnerHTML={{ __html: renderContent(selectedPost.content) }}
                          />
                          
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-2">SEO Information</h4>
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">Meta Title:</span>{' '}
                                <span className="text-muted-foreground">
                                  {selectedPost.seo.metaTitle || 'Not set'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">Meta Description:</span>{' '}
                                <span className="text-muted-foreground">
                                  {selectedPost.seo.metaDescription || 'Not set'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium">URL Slug:</span>{' '}
                                <span className="text-muted-foreground font-mono">
                                  /blog/{selectedPost.seo.slug}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 pt-4 border-t">
                            <Button
                              onClick={() => onEditPost(selectedPost)}
                              className="flex-1"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Post
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeletePost(selectedPost.id, selectedPost.title)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditPost(post)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Posts Found</h3>
            <p className="text-muted-foreground">
              {posts.length === 0
                ? "You haven't created any posts yet."
                : "No posts match your current filters."}
            </p>
            {searchTerm || filterCategory !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                }}
                className="mt-4"
              >
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostedPostsSection;

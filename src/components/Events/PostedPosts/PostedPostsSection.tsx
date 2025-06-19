import { useState } from 'react';
import { ProjectPost } from '../../../types/project';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { VideoPlayer } from '../../ui/video-player';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit, Trash2, Eye, Search, Calendar, Tag, Pin, Filter, TrendingUp } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface PostedPostsSectionProps {
  posts: ProjectPost[];
  onEditPost: (post: ProjectPost) => void;
  onDeletePost: (postId: string) => void;
}

const PostedPostsSection = ({ posts, onEditPost, onDeletePost }: PostedPostsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [selectedPost, setSelectedPost] = useState<ProjectPost | null>(null);
  const { toast } = useToast();

  // Generate excerpt from TipTap JSON content
  const generateExcerpt = (contentJson: Record<string, unknown>): string => {
    if (!contentJson || !contentJson.content) return '';
    
    const extractText = (node: Record<string, unknown>): string => {
      if (node.type === 'text') {
        return node.text as string || '';
      }
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join('');
      }
      return '';
    };

    const content = contentJson.content as Record<string, unknown>[];
    const text = content.map(extractText).join(' ').trim();
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  };

  // Get all unique tags from posts
  const allTags = [...new Set(posts.flatMap(post => post.project_tags || []))];

  const filteredPosts = posts.filter(post => {
    const excerpt = generateExcerpt(post.content_json);
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = filterTag === 'all' || (post.project_tags && post.project_tags.includes(filterTag));
    return matchesSearch && matchesTag;
  });

  const handleDeletePost = (postId: string, postTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${postTitle}"? This action cannot be undone.`)) {
      onDeletePost(postId);
    }
  };

  // Render TipTap JSON content as HTML
  const renderTipTapContent = (contentJson: Record<string, unknown>): string => {
    if (!contentJson || !contentJson.content) return '';
    
    const renderNode = (node: Record<string, unknown>): string => {
      switch (node.type) {
        case 'paragraph': {
          const pContent = node.content && Array.isArray(node.content) ? 
            node.content.map(renderNode).join('') : '';
          return `<p class="mb-4">${pContent}</p>`;
        }
        case 'heading': {
          const hContent = node.content && Array.isArray(node.content) ? 
            node.content.map(renderNode).join('') : '';
          const attrs = node.attrs as Record<string, unknown> || {};
          const level = attrs.level as number || 1;
          const headingClass = level === 1 ? 'text-2xl font-bold mt-4 mb-2' : 
                              level === 2 ? 'text-xl font-semibold mt-4 mb-2' : 
                              'text-lg font-semibold mt-4 mb-2';
          return `<h${level} class="${headingClass} text-foreground">${hContent}</h${level}>`;
        }
        case 'bulletList': {
          const listItems = node.content && Array.isArray(node.content) ? 
            node.content.map(renderNode).join('') : '';
          return `<ul class="list-disc ml-4 mb-4">${listItems}</ul>`;
        }
        case 'listItem': {
          const liContent = node.content && Array.isArray(node.content) ? 
            node.content.map(renderNode).join('') : '';
          return `<li>${liContent}</li>`;
        }
        case 'text': {
          let text = node.text as string || '';
          if (node.marks && Array.isArray(node.marks)) {
            node.marks.forEach((mark: Record<string, unknown>) => {
              if (mark.type === 'bold') {
                text = `<strong class="font-semibold">${text}</strong>`;
              } else if (mark.type === 'italic') {
                text = `<em class="italic">${text}</em>`;
              } else if (mark.type === 'link') {
                const attrs = mark.attrs as Record<string, unknown> || {};
                text = `<a href="${attrs.href}" class="text-primary underline hover:text-primary/80">${text}</a>`;
              }
            });
          }
          return text;
        }
        default:
          return node.content && Array.isArray(node.content) ? 
            node.content.map(renderNode).join('') : '';
      }
    };

    const content = contentJson.content as Record<string, unknown>[];
    return content.map(renderNode).join('');
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0  rounded-xl blur-3xl" />
        <div className="relative ">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Published Events
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your published Events • {filteredPosts.length} of {posts.length} projects
              </p>
            </div>
          </div>
          <Card className="border-0 shadow- bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                  <Input
                    placeholder="Search projects by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                </div>
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-full md:w-56 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-2xl">
                    <SelectItem value="all" className="rounded-lg">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag} className="rounded-lg">
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 mt-16 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg overflow-hidden rounded-2xl  ">
              <div className="relative overflow-hidden">
                {post.featured_image ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={post.featured_image}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <div className="text-slate-400 dark:text-slate-500">
                      <Tag className="w-12 h-12" />
                    </div>
                  </div>
                )}

                {/* Floating Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditPost(post)}
                    className="h-9 w-9 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePost(post.id, post.title)}
                    className="h-9 w-9 p-0 bg-red-500/90 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Meta Information */}
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    {post.project_tags && post.project_tags.length > 0 && post.project_tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 rounded-full px-3 py-1">
                        <Pin className="w-3 h-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(post.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {post.title}
                </h3>

                {/* Excerpt */}
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {generateExcerpt(post.content_json || {})}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 bg-white/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl transition-all duration-300 group/btn"
                        onClick={() => setSelectedPost(post)}
                      >
                        <Eye className="w-4 h-4 mr-2 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" />
                        <span className="group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">View</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                      <DialogHeader className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                          {selectedPost?.title}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-6 text-sm">
                          <div className="flex flex-wrap gap-2">
                            {selectedPost?.project_tags && selectedPost.project_tags.length > 0 && selectedPost.project_tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 rounded-full">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <span className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                            <Calendar className="w-3 h-3 mr-1" />
                            {selectedPost && new Date(selectedPost.created_at).toLocaleDateString()}
                          </span>
                        </DialogDescription>
                      </DialogHeader>

                      {selectedPost && (
                        <div className="space-y-8 py-6">
                          {selectedPost.featured_image && (
                            <div className="relative overflow-hidden rounded-xl">
                              <img
                                src={selectedPost.featured_image}
                                alt={selectedPost.title}
                                className="w-full max-h-96 object-cover"
                              />
                            </div>
                          )}

                          <VideoPlayer 
                            videoUrls={selectedPost.videos_url || []}
                            title="Project Videos"
                            showTitles={true}
                          />

                          <div
                            className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: renderTipTapContent(selectedPost.content_json || {}) }}
                          />

                          {selectedPost.conclusion && (
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                              <h4 className="font-semibold mb-3 text-slate-900 dark:text-white">Conclusion</h4>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedPost.conclusion}</p>
                            </div>
                          )}

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Project Information</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Meta Title:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedPost.meta_title || 'Not set'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Meta Description:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedPost.meta_description || 'Not set'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">URL Slug:</span>
                                <span className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                                  /projects/{selectedPost.slug}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <Button
                              onClick={() => onEditPost(selectedPost)}
                              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Project
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeletePost(selectedPost.id, selectedPost.title)}
                              className="h-11 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
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
                    className="h-9 w-9 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl transition-all duration-300 group/edit"
                  >
                    <Edit className="w-4 h-4 group-hover/edit:text-orange-600 dark:group-hover/edit:text-orange-400 transition-colors" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl overflow-hidden">
          <CardContent className="text-center py-16 px-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full blur-3xl opacity-50 w-24 h-24 mx-auto" />
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 shadow-lg">
                <Search className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">No Projects Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
              {posts.length === 0
                ? "You haven't created any projects yet. Start by creating your first project!"
                : "No projects match your current filters. Try adjusting your search criteria."}
            </p>
            {searchTerm || filterTag !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterTag('all');
                }}
                className="bg-white/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl"
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

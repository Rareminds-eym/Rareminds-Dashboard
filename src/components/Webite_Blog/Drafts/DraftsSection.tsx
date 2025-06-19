import { useState } from 'react';
import { BlogDraft } from '../../../types/blog';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit, Trash2, Eye, Search, Calendar, Tag, Pin, Filter, FileText, Clock, Send } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { useUserRole } from '../../../hooks/useUserRole';
import { canEditAndDelete } from '../../../lib/role-utils';

interface DraftsSectionProps {
  drafts: BlogDraft[];
  onEditDraft: (draft: BlogDraft) => void;
  onDeleteDraft: (draftId: string) => void;
  onPublishDraft: (draft: BlogDraft) => void;
}

const DraftsSection = ({ drafts, onEditDraft, onDeleteDraft, onPublishDraft }: DraftsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedDraft, setSelectedDraft] = useState<BlogDraft | null>(null);
  const { toast } = useToast();
  const { userRole, loading: roleLoading } = useUserRole();

  const categories = [...new Set(drafts.map(draft => draft.category))];

  // Show loading if role is still being fetched
  if (roleLoading) {
    return (
      <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      draft.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || draft.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const handleDeleteDraft = (draftId: string, draftTitle: string) => {
    if (window.confirm(`Are you sure you want to delete the draft "${draftTitle}"? This action cannot be undone.`)) {
      onDeleteDraft(draftId);
    }
  };

  const handlePublishDraft = (draft: BlogDraft) => {
    if (window.confirm(`Are you sure you want to publish "${draft.title}"? This will move it from drafts to published posts.`)) {
      onPublishDraft(draft);
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 rounded-xl blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl shadow-lg">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Draft Posts
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your draft blog posts • {filteredDrafts.length} of {drafts.length} drafts
              </p>
            </div>
          </div>
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-orange-500" />
                  <Input
                    placeholder="Search drafts by title or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-56 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-2xl">
                    <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category} className="rounded-lg">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drafts Grid */}
      {filteredDrafts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 mt-16 lg:grid-cols-3 gap-6">
          {filteredDrafts.map((draft) => (
            <Card key={draft.id} className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg overflow-hidden rounded-2xl">
              <div className="relative overflow-hidden">
                {draft.featuredImage ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={draft.featuredImage}
                      alt={draft.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-orange-100 to-amber-200 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center">
                    <div className="text-orange-400 dark:text-orange-500">
                      <FileText className="w-12 h-12" />
                    </div>
                  </div>
                )}

                {/* Draft Status Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-orange-500/90 hover:bg-orange-600 text-white border-0 shadow-lg backdrop-blur-sm">
                    <Clock className="w-3 h-3 mr-1" />
                    Draft
                  </Badge>
                </div>

                {/* Floating Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {canEditAndDelete(userRole) && (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onEditDraft(draft)}
                        className="h-9 w-9 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handlePublishDraft(draft)}
                        className="h-9 w-9 p-0 bg-green-500/90 hover:bg-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDraft(draft.id, draft.title)}
                        className="h-9 w-9 p-0 bg-red-500/90 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Meta Information */}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 rounded-full px-3 py-1">
                    <Pin className="w-3 h-3 mr-1" />
                    {draft.category}
                    {draft.subcategory && draft.subcategory !== "None" && ` / ${draft.subcategory}`}
                  </Badge>
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatRelativeTime(draft.updatedAt)}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300">
                  {draft.title}
                </h3>

                {/* Excerpt */}
                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                  {draft.excerpt || 'No excerpt available...'}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 bg-white/50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl transition-all duration-300 group/btn"
                        onClick={() => setSelectedDraft(draft)}
                      >
                        <Eye className="w-4 h-4 mr-2 group-hover/btn:text-orange-600 dark:group-hover/btn:text-orange-400 transition-colors" />
                        <span className="group-hover/btn:text-orange-600 dark:group-hover/btn:text-orange-400 transition-colors">Preview</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                      <DialogHeader className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                          {selectedDraft?.title}
                          <Badge className="ml-3 bg-orange-500/90 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            Draft
                          </Badge>
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-6 text-sm">
                          <Badge variant="secondary" className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800 rounded-full">
                            <Tag className="w-3 h-3 mr-1" />
                            {selectedDraft?.category}
                          </Badge>
                          <span className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                            <Calendar className="w-3 h-3 mr-1" />
                            Last updated: {selectedDraft && formatRelativeTime(selectedDraft.updatedAt)}
                          </span>
                        </DialogDescription>
                      </DialogHeader>

                      {selectedDraft && (
                        <div className="space-y-8 py-6">
                          {selectedDraft.featuredImage && (
                            <div className="relative overflow-hidden rounded-xl">
                              <img
                                src={selectedDraft.featuredImage}
                                alt={selectedDraft.title}
                                className="w-full max-h-96 object-cover"
                              />
                            </div>
                          )}

                          <div
                            className="prose prose-slate dark:prose-invert prose-sm max-w-none prose-headings:font-semibold prose-a:text-orange-600 dark:prose-a:text-orange-400 prose-a:no-underline hover:prose-a:underline"
                            dangerouslySetInnerHTML={{ __html: renderContent(selectedDraft.content) }}
                          />

                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">SEO Information</h4>
                            <div className="space-y-3 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Meta Title:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedDraft.seo.metaTitle || 'Not set'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Meta Description:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedDraft.seo.metaDescription || 'Not set'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Alt Image Text:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedDraft.altImage || 'Not set'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">URL Slug:</span>
                                <span className="text-orange-600 dark:text-orange-400 font-mono bg-orange-50 dark:bg-orange-900/20 px-3 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
                                  /blog/{selectedDraft.seo.slug}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                            {canEditAndDelete(userRole) && (
                              <>
                                <Button
                                  onClick={() => onEditDraft(selectedDraft)}
                                  className="flex-1 h-11 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Draft
                                </Button>
                                <Button
                                  onClick={() => handlePublishDraft(selectedDraft)}
                                  className="h-11 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Publish
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() => handleDeleteDraft(selectedDraft.id, selectedDraft.title)}
                                  className="h-11 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {canEditAndDelete(userRole) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEditDraft(draft)}
                      className="h-9 w-9 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl transition-all duration-300 group/edit"
                    >
                      <Edit className="w-4 h-4 group-hover/edit:text-orange-600 dark:group-hover/edit:text-orange-400 transition-colors" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl overflow-hidden">
          <CardContent className="text-center py-16 px-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-100 to-amber-200 dark:from-orange-800 dark:to-amber-700 rounded-full blur-3xl opacity-50 w-24 h-24 mx-auto" />
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 shadow-lg">
                <FileText className="w-12 h-12 text-orange-400 dark:text-orange-500 mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">No Drafts Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
              {drafts.length === 0
                ? "You haven't saved any drafts yet. Start writing and save your work as drafts to continue later!"
                : "No drafts match your current filters. Try adjusting your search criteria."}
            </p>
            {searchTerm || filterCategory !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategory('all');
                }}
                className="bg-white/50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl"
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

export default DraftsSection;

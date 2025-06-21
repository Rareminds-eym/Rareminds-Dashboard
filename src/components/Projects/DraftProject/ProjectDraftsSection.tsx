import React, { useState } from 'react';
import { ProjectDraft } from '../../../types/project';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { ConfirmModal } from '../../ui/modal';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit, Trash2, Eye, Search, Calendar, Tag, Pin, Filter, FileText, Clock, Send } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface ProjectDraftsSectionProps {
  drafts: ProjectDraft[];
  onEditDraft: (draft: ProjectDraft) => void;
  onDeleteDraft: (draftId: string) => void;
  onPublishDraft: (draft: ProjectDraft) => void;
}

const ProjectDraftsSection = ({ drafts, onEditDraft, onDeleteDraft, onPublishDraft }: ProjectDraftsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [selectedDraft, setSelectedDraft] = useState<ProjectDraft | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    draft: ProjectDraft | null;
  }>({
    open: false,
    draft: null
  });
  const [publishModal, setPublishModal] = useState<{
    open: boolean;
    draft: ProjectDraft | null;
  }>({
    open: false,
    draft: null
  });
  const { toast } = useToast();

  const tags = [...new Set(drafts.flatMap(draft => draft.project_tags))];

  // Safety check for drafts array
  if (!Array.isArray(drafts)) {
    return (
      <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <p className="text-red-500 mb-4">Error: Invalid drafts data</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const filteredDrafts = drafts.filter(draft => {
    const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.conclusion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         draft.project_tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTag = filterTag === 'all' || draft.project_tags.includes(filterTag);
    
    return matchesSearch && matchesTag;
  });

  const handleDeleteDraft = (draft: ProjectDraft) => {
    setDeleteModal({ open: true, draft });
  };

  const confirmDeleteDraft = () => {
    if (deleteModal.draft) {
      onDeleteDraft(deleteModal.draft.id);
      setDeleteModal({ open: false, draft: null });
      toast({
        title: "Draft Deleted",
        description: "Your project draft has been deleted successfully.",
      });
    }
  };

  const handlePublishDraft = (draft: ProjectDraft) => {
    setPublishModal({ open: true, draft });
  };

  const confirmPublishDraft = () => {
    if (publishModal.draft) {
      onPublishDraft(publishModal.draft);
      setPublishModal({ open: false, draft: null });
      toast({
        title: "Draft Published",
        description: "Your project draft has been published successfully.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const generateExcerpt = (content: Record<string, unknown> | undefined, maxLength = 150) => {
    if (!content) return 'No content available...';
    
    // Extract text from TipTap JSON content
    const extractText = (node: Record<string, unknown> | string): string => {
      if (typeof node === 'string') return node;
      if (node.text && typeof node.text === 'string') return node.text;
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(' ');
      }
      return '';
    };

    const text = extractText(content);
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  if (drafts.length === 0) {
    return (
      <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-600 mb-2">No Project Drafts Yet</h3>
            <p className="text-slate-500 mb-6">Start creating your first project draft to see it here.</p>
            <Button variant="default">
              <FileText className="w-4 h-4 mr-2" />
              Create New Draft
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500 rounded-xl shadow-sm">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Project Drafts
              </h1>
            </div>
            <p className="text-slate-600 text-lg">
              Manage your work in progress • {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white/60 backdrop-blur-sm border border-slate-200/30 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search drafts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/80 border-slate-200/50"
            />
          </div>
          <Select value={filterTag} onValueChange={setFilterTag}>
            <SelectTrigger className="w-full lg:w-[200px] bg-white/80 border-slate-200/50">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map(tag => (
                <SelectItem key={tag} value={tag}>{tag}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredDrafts.map((draft) => (
          <Card key={draft.id} className="group bg-white/70 backdrop-blur-sm border-slate-200/50 hover:border-orange-200 transition-all duration-300 hover:shadow-lg hover:scale-[1.02] overflow-hidden">
            <CardContent className="p-0">
              {/* Featured Image */}
              {draft.featured_image && (
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={draft.featured_image} 
                    alt={draft.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              )}
              
              <div className="p-6 space-y-4">
                {/* Title and Meta */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-slate-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                    {draft.title || 'Untitled Draft'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(draft.updated_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Content Preview */}
                <p className="text-slate-600 text-sm line-clamp-3 leading-relaxed">
                  {generateExcerpt(draft.content_json)}
                </p>

                {/* Tags */}
                {draft.project_tags && draft.project_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {draft.project_tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs bg-orange-50 text-orange-700 hover:bg-orange-100">
                        <Tag className="w-2 h-2 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                    {draft.project_tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{draft.project_tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedDraft(draft)}
                      className="text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditDraft(draft)}
                      className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                    >
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePublishDraft(draft)}
                      className="text-green-600 hover:text-green-800 hover:bg-green-50"
                    >
                      <Send className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteDraft(draft)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredDrafts.length === 0 && drafts.length > 0 && (
        <div className="text-center py-16">
          <Filter className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-600 mb-2">No drafts match your filters</h3>
          <p className="text-slate-500 mb-6">Try adjusting your search terms or filters.</p>
          <Button variant="outline" onClick={() => { setSearchTerm(''); setFilterTag('all'); }}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Preview Modal */}
      <Dialog open={!!selectedDraft} onOpenChange={() => setSelectedDraft(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{selectedDraft?.title}</DialogTitle>
            <DialogDescription>
              Last updated: {selectedDraft && formatDate(selectedDraft.updated_at)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {selectedDraft?.featured_image && (
              <img 
                src={selectedDraft.featured_image} 
                alt={selectedDraft.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}
            <div className="prose max-w-none">
              <p>{generateExcerpt(selectedDraft?.content_json, 500)}</p>
            </div>
            {selectedDraft?.project_tags && selectedDraft.project_tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedDraft.project_tags.map(tag => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => !open && setDeleteModal({ open: false, draft: null })}
        onConfirm={confirmDeleteDraft}
        title="Delete Draft"
        description={`Are you sure you want to delete "${deleteModal.draft?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      {/* Publish Confirmation Modal */}
      <ConfirmModal
        open={publishModal.open}
        onOpenChange={(open) => !open && setPublishModal({ open: false, draft: null })}
        onConfirm={confirmPublishDraft}
        title="Publish Draft"
        description={`Are you sure you want to publish "${publishModal.draft?.title}"? This will make it publicly available.`}
        confirmText="Publish"
        cancelText="Cancel"
        variant="default"
      />
    </div>
  );
};

export default ProjectDraftsSection;

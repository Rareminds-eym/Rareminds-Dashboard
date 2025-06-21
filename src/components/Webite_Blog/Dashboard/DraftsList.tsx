import React, { useState } from 'react';
import { BlogDraft } from '../../../types/blog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { ConfirmModal } from '../../ui/modal';
import { Edit, Trash2, Globe, Clock, FileText } from 'lucide-react';
import { useBlogDrafts } from '../../../hooks/useBlogDrafts';
import { useToast } from '../../../hooks/use-toast';

interface DraftsListProps {
  onEditDraft: (draft: BlogDraft) => void;
}

const DraftsList = ({ onEditDraft }: DraftsListProps) => {
  const { drafts, loading, deleteDraft, publishDraft } = useBlogDrafts();
  const { toast } = useToast();
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    draft: BlogDraft | null;
  }>({
    open: false,
    draft: null
  });

  const handlePublishDraft = async (draftId: string) => {
    const result = await publishDraft(draftId);
    if (result) {
      toast({
        title: "Success!",
        description: "Draft published successfully"
      });
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
    setDeleteModal({ open: false, draft: null });
  };

  const openDeleteModal = (draft: BlogDraft) => {
    setDeleteModal({ open: true, draft });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-slate-200 rounded w-3/4"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No drafts yet</h3>
          <p className="text-slate-500">Start writing and your drafts will be saved automatically.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Your Drafts</h2>
        <Badge variant="secondary" className="text-sm">
          {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
        </Badge>
      </div>
      
      {drafts.map((draft) => (
        <Card key={draft.id} className="hover:shadow-md transition-shadow duration-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold text-slate-800 mb-1">
                  {draft.title}
                </CardTitle>
                <CardDescription className="text-slate-500">
                  {draft.excerpt}
                </CardDescription>
              </div>
              <Badge variant="outline" className="ml-4 text-xs">
                {draft.category}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Updated {new Date(draft.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {draft.tags.length > 0 && (
                  <div className="flex gap-1">
                    {draft.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {draft.tags.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{draft.tags.length - 2}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditDraft(draft)}
                  className="h-8 px-3"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePublishDraft(draft.id)}
                  className="h-8 px-3 text-green-600 border-green-200 hover:bg-green-50"
                >
                  <Globe className="w-3 h-3 mr-1" />
                  Publish
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDeleteModal(draft)}
                  className="h-8 px-3 text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ ...deleteModal, open })}
        title="Delete Draft"
        description={`Are you sure you want to delete "${deleteModal.draft?.title}"? This action cannot be undone.`}
        onConfirm={() => deleteModal.draft && handleDeleteDraft(deleteModal.draft.id)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
};

export default DraftsList;

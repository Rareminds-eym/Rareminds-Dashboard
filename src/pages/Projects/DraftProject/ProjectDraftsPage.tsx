import React, { useState } from 'react';
import { ProjectDraftsSection, ProjectDraftForm } from '../../../components/Projects';
import { ProjectDraft } from '../../../types/project';
import { useProjectDrafts } from '../../../hooks/useProjectDrafts';
import { Button } from '../../../components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';

const ProjectDraftsPage: React.FC = () => {
  const { drafts, loading, deleteDraft } = useProjectDrafts();
  const [editingDraft, setEditingDraft] = useState<ProjectDraft | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEditDraft = (draft: ProjectDraft) => {
    setEditingDraft(draft);
    setShowForm(true);
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
  };

  const handlePublishDraft = (draft: ProjectDraft) => {
    // TODO: Implement publish functionality
    console.log('Publishing draft:', draft);
    // This would typically convert the draft to a published project
  };

  const handleDraftSaved = () => {
    setShowForm(false);
    setEditingDraft(null);
  };

  const handlePostSaved = () => {
    setShowForm(false);
    setEditingDraft(null);
  };

  const handleBackToList = () => {
    setShowForm(false);
    setEditingDraft(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (showForm) {
    return (
      <div>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToList}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Drafts
          </Button>
        </div>
        <ProjectDraftForm
          editingPost={editingDraft}
          onDraftSaved={handleDraftSaved}
          onPostSaved={handlePostSaved}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Drafts</h1>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-orange-500 hover:bg-orange-600"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Draft
        </Button>
      </div>
      
      <ProjectDraftsSection
        drafts={drafts}
        onEditDraft={handleEditDraft}
        onDeleteDraft={handleDeleteDraft}
        onPublishDraft={handlePublishDraft}
      />
    </div>
  );
};

export default ProjectDraftsPage;

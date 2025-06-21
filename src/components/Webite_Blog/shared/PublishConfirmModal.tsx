import React from 'react';
import { ConfirmModal } from '../../ui/modal';
import { Send, FileCheck } from 'lucide-react';

interface PublishConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
  postTitle?: string;
}

const PublishConfirmModal: React.FC<PublishConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isEditing = false,
  isLoading = false,
  postTitle = ''
}) => {
  const action = isEditing ? 'update' : 'publish';
  const actionCapitalized = isEditing ? 'Update' : 'Publish';
  
  return (
    <ConfirmModal
      open={isOpen}
      onOpenChange={onClose}
      onConfirm={onConfirm}
      onCancel={onClose}
      title={`${actionCapitalized} Post`}
      description={
        postTitle 
          ? `Are you sure you want to ${action} "${postTitle}"? This action will save the post to the database and make it ${isEditing ? 'updated and' : ''} publicly available.`
          : `Are you sure you want to ${action} this post? This action will save the post to the database and make it ${isEditing ? 'updated and' : ''} publicly available.`
      }
      confirmText={actionCapitalized}
      cancelText="Cancel"
      variant="default"
      isLoading={isLoading}
      size="md"
    />
  );
};

export default PublishConfirmModal;

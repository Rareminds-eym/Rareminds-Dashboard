import React from 'react';
import { BlogPost } from '../../../types/blog';
import NewPostForm from './NewPostForm';
import UpdatePostForm from '../UpdatePost/UpdatePostForm';

interface NewPostSectionProps {
  onPostSaved: (post: BlogPost) => void;
  editingPost?: BlogPost | null;
}

const NewPostSection: React.FC<NewPostSectionProps> = ({ onPostSaved, editingPost }) => {
  console.log('🎯 NewPostSection received editingPost:', editingPost);
  
  // If editingPost is provided, render UpdatePostForm, otherwise render NewPostForm
  if (editingPost) {
    return <UpdatePostForm onPostSaved={onPostSaved} editingPost={editingPost} />;
  }
  
  return <NewPostForm onPostSaved={onPostSaved} />;
};

export default NewPostSection;

import { useState, useEffect } from 'react';
import { usePrograms } from '../../../hooks/usePrograms';
import { Program, ProgramFormData } from '../../../types/program';
import NewPostSection from './NewPostSection';
import { useToast } from '../../../hooks/use-toast';

interface ProgramPostManagerProps {
  editingProgram?: Program | null;
}

const ProjectPostManager = ({ editingProgram: externalEditingProgram }: ProgramPostManagerProps) => {
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const { createProgram, updateProgram } = usePrograms();
  const { toast } = useToast();

  useEffect(() => {
    setEditingProgram(externalEditingProgram || null);
  }, [externalEditingProgram]);

  const handleProgramSaved = async (formData: ProgramFormData) => {
    try {
      if (editingProgram) {
        const updated = await updateProgram(editingProgram.id, formData);
        if (updated) {
          setEditingProgram(null);
          toast({
            title: 'Success',
            description: 'Program updated successfully!',
            variant: 'default',
          });
        }
      } else {
        const created = await createProgram(formData);
        if (created) {
          toast({
            title: 'Success',
            description: 'Program created successfully!',
            variant: 'default',
          });
        }
      }
    } catch (error) {
      console.error('Failed to save program:', error);
      toast({
        title: 'Error',
        description: 'Failed to save program. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <NewPostSection
      onProgramSaved={handleProgramSaved}
      editingProgram={editingProgram}
    />
  );
};

export default ProjectPostManager;

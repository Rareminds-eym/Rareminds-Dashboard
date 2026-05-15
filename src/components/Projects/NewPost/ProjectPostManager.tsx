import { useState, useEffect } from 'react';
import { usePrograms } from '../../../hooks/usePrograms';
import { Program, ProgramFormData } from '../../../types/program';
import NewPostSection from './NewPostSection';
import { useToast } from '../../../hooks/use-toast';

interface ProgramPostManagerProps {
  editingProgram?: Program | null;
  onProgramSaved?: () => void;
}

const ProjectPostManager = ({ editingProgram: externalEditingProgram, onProgramSaved }: ProgramPostManagerProps) => {
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const { createProgram, updateProgram } = usePrograms();
  const { toast } = useToast();

  useEffect(() => {
    setEditingProgram(externalEditingProgram || null);
  }, [externalEditingProgram]);

  const handleProgramSaved = async (formData: ProgramFormData): Promise<boolean> => {
    try {
      if (editingProgram) {
        const updated = await updateProgram(editingProgram.id, formData);
        if (updated) {
          toast({ title: 'Success', description: 'Program updated successfully!', variant: 'default' });
          onProgramSaved?.();
          return true;
        }
      } else {
        const created = await createProgram(formData);
        if (created) {
          toast({ title: 'Success', description: 'Program created successfully!', variant: 'default' });
          onProgramSaved?.();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to save program:', error);
      toast({ title: 'Error', description: 'Failed to save program. Please try again.', variant: 'destructive' });
      return false;
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

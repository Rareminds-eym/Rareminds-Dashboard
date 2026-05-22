import { useState, useEffect } from 'react';
import { usePrograms } from '../../../hooks/usePrograms';
import { Program, ProgramFormData } from '../../../types/program';
import NewPostSection from './NewPostSection';
import { useToast } from '../../../hooks/use-toast';

interface ProgramPostManagerProps {
  editingProgram?: Program | null;
  onProgramSaved?: () => void | Promise<void>;
}

const ProgramPostManager = ({ editingProgram: externalEditingProgram, onProgramSaved }: ProgramPostManagerProps) => {
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
          await onProgramSaved?.();
          return true;
        }
      } else {
        const created = await createProgram(formData);
        if (created) {
          toast({ title: 'Success', description: 'Program created successfully!', variant: 'default' });
          await onProgramSaved?.();
          return true;
        }
      }
      return false;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save program. Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
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

export default ProgramPostManager;

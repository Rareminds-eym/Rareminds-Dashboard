import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Form, FormField, FormWithFields, FormData, FormFieldData } from '../types/form';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

export const useForms = () => {
  const [forms, setForms] = useState<FormWithFields[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch all forms with their fields
  const fetchForms = useCallback(async () => {
    if (!user) {
      setForms([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch forms
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      // Fetch all form fields for these forms
      const formIds = formsData?.map(f => f.id) || [];
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .in('form_id', formIds)
        .order('sort_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      // Combine forms with their fields
      const formsWithFields: FormWithFields[] = (formsData || []).map(form => ({
        ...form,
        fields: (fieldsData || []).filter(field => field.form_id === form.id) as FormField[]
      }));

      setForms(formsWithFields);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch forms';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Get a single form by ID with fields
  const getFormById = useCallback(async (formId: string): Promise<FormWithFields | null> => {
    try {
      setLoading(true);
      setError(null);

      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      if (!formData) return null;

      const { data: fieldsData, error: fieldsError } = await supabase
        .from('form_fields')
        .select('*')
        .eq('form_id', formId)
        .order('sort_order', { ascending: true });

      if (fieldsError) throw fieldsError;

      return {
        ...formData,
        fields: (fieldsData || []) as FormField[]
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch form';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Create a new form
  const createForm = useCallback(async (formData: FormData): Promise<Form | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('forms')
        .insert({
          created_by: user.id,
          title: formData.title,
          description: formData.description || null,
          is_active: formData.is_active
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Success', description: 'Form created successfully!', variant: 'default' });
      await fetchForms();
      return data as Form;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create form';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchForms]);  // toast and fetchForms are stable

  // Update an existing form
  const updateForm = useCallback(async (formId: string, formData: FormData): Promise<Form | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('forms')
        .update({
          title: formData.title,
          description: formData.description || null,
          is_active: formData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)
        .select()
        .single();

      if (error) throw error;

      toast({ title: 'Success', description: 'Form updated successfully!', variant: 'default' });
      await fetchForms();
      return data as Form;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update form';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, fetchForms]);  // toast and fetchForms are stable

  // Delete a form
  const deleteForm = useCallback(async (formId: string): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Form deleted successfully!', variant: 'default' });
      await fetchForms();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete form';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user, fetchForms]);  // toast and fetchForms are stable

  // Duplicate a form with all its fields
  const duplicateForm = useCallback(async (formId: string): Promise<Form | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Get the original form with fields
      const original = await getFormById(formId);
      if (!original) throw new Error('Form not found');

      // Create new form
      const { data: newForm, error: formError } = await supabase
        .from('forms')
        .insert({
          created_by: user.id,
          title: `${original.title} (Copy)`,
          description: original.description,
          is_active: false // New duplicates start as inactive
        })
        .select()
        .single();

      if (formError) throw formError;

      // Duplicate all fields
      if (original.fields.length > 0) {
        const newFields = original.fields.map(field => ({
          form_id: newForm.id,
          field_name: field.field_name,
          field_label: field.field_label,
          field_type: field.field_type,
          is_required: field.is_required,
          options: field.options,
          sort_order: field.sort_order
        }));

        const { error: fieldsError } = await supabase
          .from('form_fields')
          .insert(newFields);

        if (fieldsError) throw fieldsError;
      }

      toast({ title: 'Success', description: 'Form duplicated successfully!', variant: 'default' });
      await fetchForms();
      return newForm as Form;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to duplicate form';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, getFormById, fetchForms]);  // toast, getFormById, and fetchForms are stable

  // Create a form field
  const createFormField = useCallback(async (fieldData: FormFieldData): Promise<FormField | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('form_fields')
        .insert({
          form_id: fieldData.form_id!,
          field_name: fieldData.field_name,
          field_label: fieldData.field_label,
          field_type: fieldData.field_type,
          is_required: fieldData.is_required,
          options: fieldData.options,
          sort_order: fieldData.sort_order
        })
        .select()
        .single();

      if (error) throw error;

      return data as FormField;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create field';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Update a form field
  const updateFormField = useCallback(async (fieldId: string, fieldData: Partial<FormFieldData>): Promise<FormField | null> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // Only send updatable fields, exclude id and form_id
      const updatePayload: Partial<FormFieldData> = {};
      if (fieldData.field_name !== undefined) updatePayload.field_name = fieldData.field_name;
      if (fieldData.field_label !== undefined) updatePayload.field_label = fieldData.field_label;
      if (fieldData.field_type !== undefined) updatePayload.field_type = fieldData.field_type;
      if (fieldData.is_required !== undefined) updatePayload.is_required = fieldData.is_required;
      if (fieldData.options !== undefined) updatePayload.options = fieldData.options;
      if (fieldData.sort_order !== undefined) updatePayload.sort_order = fieldData.sort_order;

      const { data, error } = await supabase
        .from('form_fields')
        .update(updatePayload)
        .eq('id', fieldId)
        .select()
        .single();

      if (error) throw error;

      return data as FormField;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update field';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Delete a form field
  const deleteFormField = useCallback(async (fieldId: string): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      const { error, count } = await supabase
        .from('form_fields')
        .delete({ count: 'exact' })
        .eq('id', fieldId);

      if (error) throw error;
      if (count === 0) {
        throw new Error('Field was not deleted. Please refresh and try again.');
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete field';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);  // toast is stable

  // Reorder form fields
  const reorderFormFields = useCallback(async (formId: string, orderedFieldIds: string[]): Promise<boolean> => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in', variant: 'destructive' });
      return false;
    }

    try {
      setLoading(true);
      setError(null);

      // Update sort_order for each field sequentially
      for (let index = 0; index < orderedFieldIds.length; index++) {
        const fieldId = orderedFieldIds[index];
        const { error } = await supabase
          .from('form_fields')
          .update({ sort_order: index })
          .eq('id', fieldId);
        
        if (error) throw error;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder fields';
      setError(errorMessage);
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);  // toast is stable

  useEffect(() => {
    if (user) {
      fetchForms();
    }
  }, [user]); // Remove fetchForms from dependencies to prevent infinite loop

  return {
    forms,
    loading,
    error,
    createForm,
    updateForm,
    deleteForm,
    duplicateForm,
    getFormById,
    createFormField,
    updateFormField,
    deleteFormField,
    reorderFormFields,
    refetch: fetchForms
  };
};

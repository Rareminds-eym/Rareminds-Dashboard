import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Program, ProgramSection, ProgramFormData, SectionKeyType, ContentType } from '../types/program';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

/**
 * Generate a URL-friendly slug from a title string.
 * - Lowercase
 * - Replace non-alphanumeric characters with hyphens
 * - Collapse consecutive hyphens
 * - Trim leading/trailing hyphens
 */
export const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

export const usePrograms = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { userRole } = useUserRole();
    const { toast } = useToast();

    // Helper to map a database row + nested sections to a Program
    const dbRowToProgram = (row: Record<string, unknown>): Program => {
        const sections = Array.isArray(row.program_sections)
            ? (row.program_sections as Record<string, unknown>[]).map(
                (s): ProgramSection => ({
                    id: s.id as string,
                    program_id: s.program_id as string,
                    section_key: s.section_key as SectionKeyType,
                    content_type: (s.content_type as ContentType) ?? 'text', // NEW FIELD
                    title: (s.title as string) ?? null,
                    preamble: (s.preamble as string) ?? null, // NEW FIELD
                    content: (s.content as Record<string, unknown>) ?? {}, // NOW JSONB instead of TEXT
                    display_order: (s.display_order as number) ?? 0,
                    created_at: s.created_at as string,
                    updated_at: s.updated_at as string,
                }),
            )
            : [];

        return {
            id: row.id as string,
            title: row.title as string,
            slug: row.slug as string,
            program_type: row.program_type as string, // NOW REQUIRED
            location: row.location as string, // NOW REQUIRED
            date: row.date as string, // NOW REQUIRED
            status: row.status as string, // NOW REQUIRED
            image_url: row.image_url as string, // NOW REQUIRED
            banner_url: (row.banner_url as string) ?? null,
            short_description: row.short_description as string, // NOW REQUIRED
            display_order: (row.display_order as number) ?? 0,
            is_active: (row.is_active as boolean) ?? true,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
            sections,
        };
    };

    // Fetch all programs with their sections
    const fetchPrograms = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('[usePrograms] Fetching programs from Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

            const { data, error } = await supabase
                .from('programs')
                .select('*, program_sections(*)')
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            console.log('[usePrograms] Response data:', data);
            console.log('[usePrograms] Response error:', error);

            if (error) throw error;

            const mapped = data?.map((row) => dbRowToProgram(row as unknown as Record<string, unknown>)) || [];
            console.log('[usePrograms] Mapped programs:', mapped.length);
            setPrograms(mapped);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch programs';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Create a new program with sections
    const createProgram = async (formData: ProgramFormData): Promise<Program | null> => {
        try {
            setLoading(true);
            setError(null);

            const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
            if (authError || !currentUser) {
                throw new Error('User not authenticated');
            }

            // Validate required fields
            if (!formData.program_type || !formData.location || !formData.date || 
                !formData.status || !formData.image_url || !formData.short_description) {
                throw new Error('Missing required fields: program_type, location, date, status, image_url, and short_description are required');
            }

            const { data, error: insertError } = await supabase
                .from('programs')
                .insert({
                    title: formData.title,
                    slug: formData.slug,
                    program_type: formData.program_type, // NOW REQUIRED
                    location: formData.location, // NOW REQUIRED
                    date: formData.date, // NOW REQUIRED
                    status: formData.status, // NOW REQUIRED
                    image_url: formData.image_url, // NOW REQUIRED
                    banner_url: formData.banner_url || null,
                    short_description: formData.short_description, // NOW REQUIRED
                    display_order: formData.display_order,
                    is_active: formData.is_active,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            // Batch-insert sections if any
            let sections: ProgramSection[] = [];
            if (formData.sections.length > 0) {
                const sectionRows = formData.sections.map((s, idx) => ({
                    program_id: data.id,
                    section_key: s.section_key,
                    content_type: s.content_type || 'text', // NEW FIELD with default
                    title: s.title || null,
                    preamble: s.preamble || null, // NEW FIELD
                    content: s.content || {}, // NOW JSONB
                    display_order: idx,
                }));

                const { data: sectionData, error: sectionError } = await supabase
                    .from('program_sections')
                    .insert(sectionRows as any) // Type assertion until Supabase types are regenerated
                    .select();

                if (sectionError) throw sectionError;

                sections = (sectionData || []).map(
                    (s): ProgramSection => ({
                        id: s.id,
                        program_id: s.program_id,
                        section_key: s.section_key as SectionKeyType,
                        content_type: (s as any).content_type ?? 'text', // NEW FIELD
                        title: s.title,
                        preamble: (s as any).preamble, // NEW FIELD
                        content: ((s as any).content ?? {}) as Record<string, unknown>, // NOW JSONB
                        display_order: s.display_order,
                        created_at: s.created_at,
                        updated_at: s.updated_at,
                    }),
                );
            }

            const createdProgram: Program = {
                id: data.id,
                title: data.title,
                slug: data.slug,
                program_type: data.program_type,
                location: data.location,
                date: data.date,
                status: data.status,
                image_url: data.image_url,
                banner_url: data.banner_url,
                short_description: data.short_description,
                display_order: data.display_order,
                is_active: data.is_active,
                created_at: data.created_at,
                updated_at: data.updated_at,
                sections,
            };

            setPrograms((prev) => [createdProgram, ...prev]);

            toast({
                title: 'Success',
                description: 'Program created successfully!',
                variant: 'default',
            });

            return createdProgram;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create program';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Update an existing program and its sections
    const updateProgram = async (id: string, formData: ProgramFormData): Promise<Program | null> => {
        try {
            setLoading(true);
            setError(null);

            console.log('Updating program with ID:', id);
            console.log('Form data:', formData);

            // Update the program row
            const { data, error: updateError } = await supabase
                .from('programs')
                .update({
                    title: formData.title,
                    slug: formData.slug,
                    program_type: formData.program_type, // NOW REQUIRED
                    location: formData.location, // NOW REQUIRED
                    date: formData.date, // NOW REQUIRED
                    status: formData.status, // NOW REQUIRED
                    image_url: formData.image_url, // NOW REQUIRED
                    banner_url: formData.banner_url || null,
                    short_description: formData.short_description, // NOW REQUIRED
                    display_order: formData.display_order,
                    is_active: formData.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .select()
                .single();

            if (updateError) {
                console.error('Update error:', updateError);
                throw updateError;
            }

            console.log('Program updated successfully:', data);

            // Upsert sections that are in the form data
            const newSectionKeys = formData.sections.map((s) => s.section_key);

            if (formData.sections.length > 0) {
                const sectionRows = formData.sections.map((s, idx) => ({
                    program_id: id,
                    section_key: s.section_key,
                    content_type: s.content_type || 'text',
                    title: s.title || null,
                    preamble: s.preamble || null,
                    content: s.content || {},
                    display_order: idx,
                }));

                console.log('Upserting sections:', sectionRows);

                const { error: upsertError } = await supabase
                    .from('program_sections')
                    .upsert(sectionRows as any, { onConflict: 'program_id,section_key' });

                if (upsertError) {
                    console.error('Upsert error:', upsertError);
                    throw upsertError;
                }
            }

            // Delete sections that were removed
            if (newSectionKeys.length > 0) {
                const { error: deleteError } = await supabase
                    .from('program_sections')
                    .delete()
                    .eq('program_id', id)
                    .not('section_key', 'in', `(${newSectionKeys.join(',')})`);

                if (deleteError) throw deleteError;
            } else {
                // All sections removed
                const { error: deleteAllError } = await supabase
                    .from('program_sections')
                    .delete()
                    .eq('program_id', id);

                if (deleteAllError) throw deleteAllError;
            }

            // Re-fetch sections for the updated program
            const { data: sectionData, error: sectionFetchError } = await supabase
                .from('program_sections')
                .select('*')
                .eq('program_id', id)
                .order('display_order', { ascending: true });

            if (sectionFetchError) throw sectionFetchError;

            const sections: ProgramSection[] = (sectionData || []).map(
                (s): ProgramSection => ({
                    id: s.id,
                    program_id: s.program_id,
                    section_key: s.section_key as SectionKeyType,
                    content_type: (s as any).content_type ?? 'text', // NEW FIELD
                    title: s.title,
                    preamble: (s as any).preamble, // NEW FIELD
                    content: ((s as any).content ?? {}) as Record<string, unknown>, // NOW JSONB
                    display_order: s.display_order,
                    created_at: s.created_at,
                    updated_at: s.updated_at,
                }),
            );

            const updatedProgram: Program = {
                id: data.id,
                title: data.title,
                slug: data.slug,
                program_type: data.program_type,
                location: data.location,
                date: data.date,
                status: data.status,
                image_url: data.image_url,
                banner_url: data.banner_url,
                short_description: data.short_description,
                display_order: data.display_order,
                is_active: data.is_active,
                created_at: data.created_at,
                updated_at: data.updated_at,
                sections,
            };

            setPrograms((prev) =>
                prev.map((p) => (p.id === id ? updatedProgram : p)),
            );

            toast({
                title: 'Success',
                description: 'Program updated successfully!',
                variant: 'default',
            });

            return updatedProgram;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update program';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Delete a program (cascade deletes sections automatically)
    const deleteProgram = async (id: string): Promise<boolean> => {
        if (!user) {
            toast({
                title: 'Error',
                description: 'You must be logged in to delete programs',
                variant: 'destructive',
            });
            return false;
        }

        try {
            setLoading(true);
            setError(null);

            // Fetch the program to check ownership
            const { data: existingProgram, error: fetchError } = await supabase
                .from('programs')
                .select('id, title')
                .eq('id', id)
                .single();

            if (fetchError) {
                toast({
                    title: 'Error',
                    description: `Failed to find program: ${fetchError.message}`,
                    variant: 'destructive',
                });
                return false;
            }

            if (!existingProgram) {
                toast({
                    title: 'Error',
                    description: 'Program not found',
                    variant: 'destructive',
                });
                return false;
            }

            // Only authenticated users can delete programs
            // (RLS policies will handle the actual permission check)
            const { error: deleteError } = await supabase
                .from('programs')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            setPrograms((prev) => prev.filter((p) => p.id !== id));

            toast({
                title: 'Success',
                description: 'Program deleted successfully!',
                variant: 'default',
            });

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete program';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return false;
        } finally {
            setLoading(false);
        }
    };

    // Get a single program by ID with nested sections
    const getProgramById = async (id: string): Promise<Program | null> => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await supabase
                .from('programs')
                .select('*, program_sections(*)')
                .eq('id', id)
                .single();

            if (error) throw error;

            return dbRowToProgram(data as unknown as Record<string, unknown>);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch program';
            setError(errorMessage);
            toast({
                title: 'Error',
                description: errorMessage,
                variant: 'destructive',
            });
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Load programs on hook initialization
    useEffect(() => {
        fetchPrograms();
    }, [fetchPrograms]);

    return {
        programs,
        loading,
        error,
        fetchPrograms,
        createProgram,
        updateProgram,
        deleteProgram,
        getProgramById,
    };
};

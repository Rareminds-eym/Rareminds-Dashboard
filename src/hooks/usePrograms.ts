import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../integrations/supabase/client';
import { Json } from '../integrations/supabase/types';
import { Program, ProgramSection, ProgramFormData, SectionKeyType, ContentType } from '../types/program';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';


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

// Runtime-safe coercion helpers for unknown DB values
const asString = (val: unknown, fallback = ''): string =>
    typeof val === 'string' ? val : fallback;

const asNumber = (val: unknown, fallback = 0): number =>
    typeof val === 'number' ? val : fallback;

const asBool = (val: unknown, fallback = true): boolean =>
    typeof val === 'boolean' ? val : fallback;

const VALID_SECTION_KEYS: SectionKeyType[] = [
    'introduction', 'about', 'modules', 'approaches', 'impact',
    'strategic_alignment', 'conclusion', 'header', 'course_enrollment',
    'program_delivery', 'intervention', 'video',
];
const VALID_CONTENT_TYPES: ContentType[] = ['text', 'cards', 'stats', 'courses'];

const asSectionKey = (val: unknown): SectionKeyType => {
    const str = asString(val);
    const found = VALID_SECTION_KEYS.find((k): k is SectionKeyType => k === str);
    return found ?? 'introduction';
};

const asContentType = (val: unknown): ContentType => {
    const str = asString(val);
    const found = VALID_CONTENT_TYPES.find((k): k is ContentType => k === str);
    return found ?? 'text';
};

const parseBannerUrl = (val: unknown): { desktop: string | null; mobile: string | null } | null => {
    if (val === null || val === undefined) return null;
    const obj = typeof val === 'string' ? (() => { try { return JSON.parse(val); } catch { return null; } })() : val;
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) return null;
    const entries = Object.fromEntries(Object.entries(obj));
    return {
        desktop: typeof entries['desktop'] === 'string' ? entries['desktop'] : null,
        mobile: typeof entries['mobile'] === 'string' ? entries['mobile'] : null,
    };
};

const toRecord = (val: unknown): Record<string, unknown> => {
    if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        const result: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(val)) {
            result[k] = v;
        }
        return result;
    }
    return {};
};

export const usePrograms = () => {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast); // ← add this
    useEffect(() => {
        toastRef.current = toast;
    }, [toast]);
    // Helper to map a database row + nested sections to a Program
    const dbRowToProgram = (input: unknown): Program => {
        const row = toRecord(input);
        const sections = Array.isArray(row.program_sections)
            ? row.program_sections
                .filter((s): s is Record<string, unknown> => s !== null && typeof s === 'object' && !Array.isArray(s))
                .map(
                    (s): ProgramSection => ({
                        id: asString(s.id),
                        program_id: asString(s.program_id),
                        section_key: asSectionKey(s.section_key),
                        content_type: asContentType(s.content_type),
                        title: typeof s.title === 'string' ? s.title : null,
                        preamble: typeof s.preamble === 'string' ? s.preamble : null,
                        content: toRecord(s.content),
                        display_order: asNumber(s.display_order),
                        created_at: asString(s.created_at),
                        updated_at: asString(s.updated_at),
                    }),
                )
            : [];

        return {
            id: asString(row.id),
            title: asString(row.title),
            slug: asString(row.slug),
            program_type: asString(row.program_type),
            location: asString(row.location),
            date: asString(row.date),
            status: asString(row.status),
            image_url: asString(row.image_url),
            banner_url: parseBannerUrl(row.banner_url),
            short_description: asString(row.short_description),
            hero_title: asString(row.hero_title),
            hero_description: asString(row.hero_description),
            display_order: asNumber(row.display_order),
            is_active: asBool(row.is_active),
            created_at: asString(row.created_at),
            updated_at: asString(row.updated_at),
            sections,
        };
    };

    // Fetch all programs with their sections
    const fetchPrograms = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error } = await supabase
                .from('programs')
                .select('*, program_sections(*)')
                .order('display_order', { ascending: true })
                .order('created_at', { ascending: false });

            if (error) throw error;

            const mapped = data?.map((row) => dbRowToProgram(row)) || [];
            setPrograms(mapped);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch programs';
            setError(errorMessage);
            toastRef.current({
            title: 'Error',
            description: errorMessage,
            variant: 'destructive',
        });
        } finally {
            setLoading(false);
        }
    }, []);

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
                    banner_url: formData.banner_url ?? null,
                    short_description: formData.short_description, // NOW REQUIRED
                    hero_title: formData.hero_title || '',
                    hero_description: formData.hero_description || '',
                    display_order: formData.display_order,
                    is_active: formData.is_active,
                })
                .select()
                .single();

            if (insertError || !data) throw insertError || new Error('No data returned');

            // Batch-insert sections if any
            let sections: ProgramSection[] = [];
            if (Array.isArray(formData.sections) && formData.sections.length > 0) {
                const sectionRows = formData.sections.map((s, idx) => ({
                    program_id: data.id,
                    section_key: s.section_key,
                    content_type: s.content_type || 'text',
                    title: s.title || null,
                    preamble: s.preamble || null,
                    content: (s.content || {}) as Json,
                    display_order: idx,
                }));

                const { data: sectionData, error: sectionError } = await supabase
                    .from('program_sections')
                    .insert(sectionRows)
                    .select();

                if (sectionError) throw sectionError;

                sections = (sectionData || []).map(
                    (s): ProgramSection => ({
                        id: s.id,
                        program_id: s.program_id,
                        section_key: asSectionKey(s.section_key),
                        content_type: asContentType(s.content_type),
                        title: s.title,
                        preamble: s.preamble,
                        content: toRecord(s.content),
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
                banner_url: parseBannerUrl(data.banner_url),
                short_description: data.short_description,
                hero_title: data.hero_title,
                hero_description: data.hero_description,
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
                    banner_url: formData.banner_url ?? null,
                    short_description: formData.short_description, // NOW REQUIRED
                    hero_title: formData.hero_title || '',
                    hero_description: formData.hero_description || '',
                    display_order: formData.display_order,
                    is_active: formData.is_active,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', id)
                .eq('updated_at', formData.updated_at)
                .select()
                .single();

            if (updateError || !data) throw updateError || new Error('Program was modified by someone else. Please refresh and try again.');
            // Upsert sections that are in the form data
            const newSectionKeys = Array.isArray(formData.sections)
                ? formData.sections.map((s) => s.section_key)
                : [];
            if (Array.isArray(formData.sections) && formData.sections.length > 0) {
                const sectionRows = formData.sections.map((s, idx) => ({
                    program_id: id,
                    section_key: s.section_key,
                    content_type: s.content_type || 'text',
                    title: s.title || null,
                    preamble: s.preamble || null,
                    content: (s.content || {}) as Json,
                    display_order: idx,
                }));
                const { error: upsertError } = await supabase
                    .from('program_sections')
                    .upsert(sectionRows, { onConflict: 'program_id,section_key' });

                if (upsertError) {
                    throw new Error(upsertError.message);
                }
            }

            // Delete sections that were removed — safe parameterized approach
            const { data: existingSections, error: fetchSectionsError } = await supabase
                .from('program_sections')
                .select('id, section_key')
                .eq('program_id', id);

            if (fetchSectionsError) throw fetchSectionsError;

            const idsToDelete = (existingSections || [])
                .filter((s) => !newSectionKeys.includes(s.section_key))
                .map((s) => s.id);

            if (idsToDelete.length > 0) {
                const { error: deleteError } = await supabase
                    .from('program_sections')
                    .delete()
                    .in('id', idsToDelete);

                if (deleteError) throw deleteError;
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
                    section_key: asSectionKey(s.section_key),
                    content_type: asContentType(s.content_type),
                    title: s.title,
                    preamble: s.preamble,
                    content: toRecord(s.content),
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
                banner_url: parseBannerUrl(data.banner_url),
                short_description: data.short_description,
                hero_title: data.hero_title,
                hero_description: data.hero_description,
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

            return dbRowToProgram(data);
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
        let cancelled = false;
        const load = async () => {
            if (!cancelled) await fetchPrograms();
        };
        load().catch(() => { /* errors handled inside fetchPrograms */ });
        return () => { cancelled = true; };
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

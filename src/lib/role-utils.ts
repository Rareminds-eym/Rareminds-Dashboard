import { supabase } from '../integrations/supabase/client';
import type { UserRole } from '../hooks/useUserRole';

/**
 * Create or update a user's role
 * @param userId - The user's UUID
 * @param role - The role to assign ('editor' | 'owner')
 */
export const setUserRole = async (userId: string, role: UserRole) => {
  const { data, error } = await supabase
    .from('user_roles')
    .upsert({ 
      user_id: userId, 
      role,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to set user role: ${error.message}`);
  }

  return data;
};

/**
 * Get a user's role
 * @param userId - The user's UUID
 */
export const getUserRole = async (userId: string): Promise<UserRole> => {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No role found, return default
      return 'editor';
    }
    throw new Error(`Failed to get user role: ${error.message}`);
  }

  return data.role;
};

/**
 * Remove a user's role
 * @param userId - The user's UUID
 */
export const removeUserRole = async (userId: string) => {
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to remove user role: ${error.message}`);
  }
};

/**
 * Check if user has owner permissions
 * @param userRole - The user's role
 */
export const canEditAndDelete = (userRole: UserRole): boolean => {
  return userRole === 'owner';
};

/**
 * Check if user can edit and delete published blog posts
 * Only owner role can edit and delete published posts
 * @param userRole - The user's role
 */
export const canEditAndDeletePosts = (userRole: UserRole): boolean => {
  return userRole === 'owner';
};

/**
 * Check if user can view content
 * @param userRole - The user's role
 */
export const canView = (userRole: UserRole): boolean => {
  return userRole === 'editor' || userRole === 'owner';
};

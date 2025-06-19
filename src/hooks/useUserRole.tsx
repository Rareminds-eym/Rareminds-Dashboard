import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'editor' | 'owner';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<UserRole>('editor');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No role found, default to editor
            setUserRole('editor');
          } else {
            throw error;
          }
        } else {
          setUserRole(data.role);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch user role');
        setUserRole('editor'); // Default to editor on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { userRole, loading, error };
};

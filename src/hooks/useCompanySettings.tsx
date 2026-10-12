import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanySettings } from '../types/companySettings';

/**
 * Fetches company settings from Supabase.
 * Returns the first (and should be only) record from the company_settings table.
 */
async function fetchCompanySettings(): Promise<CompanySettings | null> {
  const { data, error } = await supabase
    .from('company_settings')
    .select('id, office_address, city, state, pincode, logo_url, created_at, updated_at, updated_by')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching company settings:', error);
    return null;
  }

  return data as CompanySettings;
}

/**
 * React Query hook for fetching company settings.
 * 
 * @returns {Object} - Company settings data, loading state, and error state
 * @returns {CompanySettings | null} settings - Saved company settings, or null if unavailable
 * @returns {boolean} isLoading - True while fetching data
 * @returns {Error | null} error - Error object if fetch failed
 */
export function useCompanySettings() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['company-settings'],
    queryFn: fetchCompanySettings,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  return {
    settings: data ?? null,
    isLoading,
    error,
  };
}

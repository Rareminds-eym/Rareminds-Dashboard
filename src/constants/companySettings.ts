import { CompanySettings } from '../types/companySettings';

/**
 * Approved initial company address values for the Dashboard form.
 * The logo is intentionally not defaulted; it must come from saved settings.
 */
export const DEFAULT_COMPANY_SETTINGS: Partial<CompanySettings> = {
  id: null,
  office_address: '#143, 10th Cross Road, Binnamangala, Stage 1, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
  logo_url: null,
  created_at: '',
  updated_at: '',
  updated_by: null,
} as const;

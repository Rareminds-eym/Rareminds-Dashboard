import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ImagePlus, RotateCcw, Save } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/use-toast';
import { supabase } from '../../integrations/supabase/client';
import { uploadToR2 } from '../../lib/r2-upload';

const DEFAULT_COMPANY_SETTINGS = {
  officeAddress: '#143, 10th Cross Road, Binnamangala, Stage 1, Indiranagar',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560038',
};

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

type CompanySettingsForm = typeof DEFAULT_COMPANY_SETTINGS;
type FormErrors = Partial<Record<keyof CompanySettingsForm | 'logo', string>>;

type CompanySettingsRow = {
  id: string;
  office_address: string;
  city: string;
  state: string;
  pincode: string;
  logo_url: string | null;
};

const mapRowToForm = (row: CompanySettingsRow): CompanySettingsForm => ({
  officeAddress: row.office_address,
  city: row.city,
  state: row.state,
  pincode: row.pincode,
});

const CompanySettingsPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [formValues, setFormValues] = useState<CompanySettingsForm>(DEFAULT_COMPANY_SETTINGS);
  const [savedValues, setSavedValues] = useState<CompanySettingsForm>(DEFAULT_COMPANY_SETTINGS);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [savedLogoUrl, setSavedLogoUrl] = useState<string | null>(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedLogoName, setSelectedLogoName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [loadError, setLoadError] = useState('');

  const logoSrc = logoPreviewUrl || savedLogoUrl;

  useEffect(() => {
    let isMounted = true;

    const loadCompanySettings = async () => {
      setSettingsLoading(true);
      setLoadError('');

      const { data, error } = await supabase
        .from('company_settings')
        .select('id, office_address, city, state, pincode, logo_url')
        .limit(1)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        setLoadError('Company settings could not be loaded. Showing the approved default address for now.');
        setFormValues(DEFAULT_COMPANY_SETTINGS);
        setSavedValues(DEFAULT_COMPANY_SETTINGS);
        setSettingsId(null);
        setSavedLogoUrl(null);
        setSettingsLoading(false);
        return;
      }

      if (data) {
        const nextValues = mapRowToForm(data);
        setFormValues(nextValues);
        setSavedValues(nextValues);
        setSettingsId(data.id);
        setSavedLogoUrl(data.logo_url);
      } else {
        setFormValues(DEFAULT_COMPANY_SETTINGS);
        setSavedValues(DEFAULT_COMPANY_SETTINGS);
        setSettingsId(null);
        setSavedLogoUrl(null);
      }

      setSettingsLoading(false);
    };

    loadCompanySettings();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formValues.officeAddress.trim()) {
      nextErrors.officeAddress = 'Office address is required.';
    }

    if (!formValues.city.trim()) {
      nextErrors.city = 'City is required.';
    }

    if (!formValues.state.trim()) {
      nextErrors.state = 'State is required.';
    }

    if (!/^\d{6}$/.test(formValues.pincode.trim())) {
      nextErrors.pincode = 'Pincode must be exactly 6 digits.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleInputChange = (field: keyof CompanySettingsForm, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
    setStatusMessage('');
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const handleLogoChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      setErrors((current) => ({ ...current, logo: 'Choose a PNG, JPG, or WEBP image.' }));
      event.target.value = '';
      return;
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      setErrors((current) => ({ ...current, logo: 'Logo image must be 2 MB or smaller.' }));
      event.target.value = '';
      return;
    }

    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoPreviewUrl(URL.createObjectURL(file));
    setSelectedLogoFile(file);
    setSelectedLogoName(file.name);
    setStatusMessage('');
    setErrors((current) => ({ ...current, logo: undefined }));
  };

  const resetLogoSelection = () => {
    if (logoPreviewUrl) {
      URL.revokeObjectURL(logoPreviewUrl);
    }

    setLogoPreviewUrl(null);
    setSelectedLogoFile(null);
    setSelectedLogoName('');
    setErrors((current) => ({ ...current, logo: undefined }));
    setStatusMessage('');

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormValues(savedValues);
    setErrors({});
    resetLogoSelection();
    setStatusMessage('Form reset to the last saved values.');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      setStatusMessage('');
      toast({
        title: 'Check the highlighted fields',
        description: 'Company settings were not saved. Please fix the highlighted fields.',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    setStatusMessage('');

    let logoUrlToSave: string | null | undefined;

    if (selectedLogoFile) {
      const uploadResult = await uploadToR2(selectedLogoFile, { folder: 'company-settings' });

      if (!uploadResult.success || !uploadResult.url) {
        setSaving(false);
        setStatusMessage('Logo could not be uploaded. Company settings were not saved.');
        toast({
          title: 'Logo upload failed',
          description: uploadResult.error || 'Please try another image or try again.',
          variant: 'destructive',
        });
        return;
      }

      logoUrlToSave = uploadResult.url;
    }

    const payload = {
      office_address: formValues.officeAddress.trim(),
      city: formValues.city.trim(),
      state: formValues.state.trim(),
      pincode: formValues.pincode.trim(),
      updated_by: user?.id ?? null,
      ...(logoUrlToSave ? { logo_url: logoUrlToSave } : {}),
    };

    const request = settingsId
      ? supabase
        .from('company_settings')
        .update(payload)
        .eq('id', settingsId)
        .select('id, office_address, city, state, pincode, logo_url')
        .single()
      : supabase
        .from('company_settings')
        .insert(payload)
        .select('id, office_address, city, state, pincode, logo_url')
        .single();

    const { data, error } = await request;

    if (error) {
      setSaving(false);
      setStatusMessage('Company settings could not be saved. Please try again.');
      toast({
        title: 'Save failed',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    const nextValues = mapRowToForm(data);
    setFormValues(nextValues);
    setSavedValues(nextValues);
    setSettingsId(data.id);
    setSavedLogoUrl(data.logo_url);
    resetLogoSelection();
    queryClient.invalidateQueries({ queryKey: ['company-settings'] });
    setSaving(false);
    setStatusMessage('Company settings saved successfully.');
    toast({
      title: 'Company settings saved',
      description: 'The saved address and logo will remain after refreshing this dashboard.',
    });
  };

  if (settingsLoading) {
    return (
      <div className="container mx-auto py-8 px-4 space-y-6">
        <div className="h-10 w-72 rounded-md bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-80 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company Settings</h1>
              <p className="text-slate-600 dark:text-slate-400">
                Manage the RareMinds address and logo preview.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:ml-auto sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
              <Button type="submit" form="company-settings-form" disabled={saving}>
                <Save className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-8">
        <form id="company-settings-form" onSubmit={handleSubmit} className="space-y-6">
          {statusMessage && (
            <Alert>
              <AlertTitle>Status</AlertTitle>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {loadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Unable to load saved settings</AlertTitle>
              <AlertDescription>{loadError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Logo</CardTitle>
                <CardDescription>
                  Choose a replacement image to preview locally.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="w-full md:w-[420px] lg:w-[460px]">
                    <div className="flex h-32 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                      {logoSrc ? (
                        <img
                          src={logoSrc}
                          alt="RareMinds logo preview"
                          className="max-h-24 max-w-full object-contain"
                        />
                      ) : (
                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                          Logo not configured
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex min-h-32 flex-col items-start justify-center gap-3">
                    <Label className="block">Replacement logo</Label>
                    <Input
                      ref={fileInputRef}
                      id="companyLogo"
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={handleLogoChange}
                      aria-invalid={Boolean(errors.logo)}
                      className="sr-only"
                      tabIndex={-1}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="w-fit"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4" />
                      {selectedLogoName ? 'Choose Different Logo' : 'Choose Logo'}
                    </Button>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      PNG, JPG, or WEBP.
                    </p>
                    {errors.logo && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.logo}</p>
                    )}
                    {selectedLogoName && (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Selected: {selectedLogoName}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Company Address</CardTitle>
                <CardDescription>
                  These values are prefilled from the approved RareMinds office address.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="officeAddress">Office address</Label>
                  <Textarea
                    id="officeAddress"
                    value={formValues.officeAddress}
                    onChange={(event) => handleInputChange('officeAddress', event.target.value)}
                    placeholder="Enter office address"
                    aria-invalid={Boolean(errors.officeAddress)}
                    className="min-h-24"
                  />
                  {errors.officeAddress && (
                    <p className="text-sm text-red-600 dark:text-red-400">{errors.officeAddress}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formValues.city}
                      onChange={(event) => handleInputChange('city', event.target.value)}
                      placeholder="Bengaluru"
                      aria-invalid={Boolean(errors.city)}
                    />
                    {errors.city && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.city}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formValues.state}
                      onChange={(event) => handleInputChange('state', event.target.value)}
                      placeholder="Karnataka"
                      aria-invalid={Boolean(errors.state)}
                    />
                    {errors.state && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.state}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      inputMode="numeric"
                      maxLength={6}
                      value={formValues.pincode}
                      onChange={(event) => handleInputChange('pincode', event.target.value)}
                      placeholder="560038"
                      aria-invalid={Boolean(errors.pincode)}
                    />
                    {errors.pincode && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.pincode}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CompanySettingsPage;

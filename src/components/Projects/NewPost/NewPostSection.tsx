import { useState, useEffect } from 'react';
import { Program, ProgramFormData } from '../../../types/program';
import { generateSlug } from '../../../hooks/usePrograms';
import { supabase } from '../../../integrations/supabase/client';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../../ui/command';
import { Save, Sparkles, Settings, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '../../../lib/utils';
import ProgramSectionsEditor, { SectionItem } from './ProgramSectionsEditor';

const isErrorResponse = (data: unknown): data is { error: string } =>
  typeof data === 'object' && data !== null &&
  'error' in data && typeof data.error === 'string';

const isSuccessResponse = (data: unknown): data is { url: string } =>
  typeof data === 'object' && data !== null &&
  'url' in data && typeof data.url === 'string' &&
  data.url !== '';

const UPLOAD_TIMEOUT_MS = 30000;
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch('/upload', { method: 'POST', body: formData, signal: controller.signal });
 } catch (err) {
  const name = err instanceof Error ? err.name : Object(err).name;
  if (name === 'AbortError') {
    throw new Error('Upload timed out. Please try again.');
  }
  throw new Error('Network error during upload');

  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    throw new Error(`Upload failed: server error ${res.status}`);
  }
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error('Upload failed: server returned an invalid response');
  }
  if (!isSuccessResponse(data)) {
    if (isErrorResponse(data)) {
      throw new Error(`Upload failed: ${data.error}`);
    }
    throw new Error('Upload failed: invalid response format');
  }

  return data.url;
};

// Helper function to remove IDs from content recursively
const removeIds = (obj: Record<string, unknown>): Record<string, unknown> => {
  const processValue = (val: unknown): unknown => {
    if (Array.isArray(val)) return val.map(processValue);
    if (val !== null && typeof val === 'object') {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(val)) {
        if (k !== 'id') result[k] = processValue(v);
      }
      return result;
    }
    return val;
  };

  return Object.fromEntries(
    Object.entries(obj)
      .filter(([k]) => k !== 'id')
      .map(([k, v]) => [k, processValue(v)])
  );
};
interface NewPostSectionProps {
  onProgramSaved: (data: ProgramFormData) => Promise<boolean>;
  editingProgram?: Program | null;
}
const NewPostSection = ({ onProgramSaved, editingProgram }: NewPostSectionProps) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [desktopBannerUrl, setDesktopBannerUrl] = useState('');
  const [mobileBannerUrl, setMobileBannerUrl] = useState('');
  const [programType, setProgramType] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [errors, setErrors] = useState<{
    title?: string;
    slug?: string;
    program_type?: string;
    location?: string;
    date?: string;
    image_url?: string;
    short_description?: string;
  }>({});
  const [formLoadError, setFormLoadError] = useState<string | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [desktopBannerUploadError, setDesktopBannerUploadError] = useState<string | null>(null);
  const [mobileBannerUploadError, setMobileBannerUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDesktopBanner, setUploadingDesktopBanner] = useState(false);
  const [uploadingMobileBanner, setUploadingMobileBanner] = useState(false);
  const [imageInputKey, setImageInputKey] = useState(0);
  const [desktopBannerInputKey, setDesktopBannerInputKey] = useState(0);
  const [mobileBannerInputKey, setMobileBannerInputKey] = useState(0);
  // prevents auto-slug regeneration after manual edit
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');

  // Get unique values from existing programs
  const [existingProgramTypes, setExistingProgramTypes] = useState<string[]>(
    () => (editingProgram?.program_type ? [editingProgram.program_type] : [])
  );
  const [existingLocations, setExistingLocations] = useState<string[]>(
    () => (editingProgram?.location ? [editingProgram.location] : [])
  );
  const [existingStatuses, setExistingStatuses] = useState<string[]>(
    () => (editingProgram?.status ? [editingProgram.status] : ['Active', 'Completed', 'In Progress'])
  );

  // Fetch existing programs to populate dropdowns
  useEffect(() => {
    let isCancelled = false;
    const fetchExistingValues = async () => {
      try {
        const { data, error } = await supabase
          .from('programs')
          .select('program_type, location, status');
        if (isCancelled) return;

        if (error) {
          setFormLoadError(error.message
            ? `Failed to load form options: ${error.message}`
            : 'Unable to load program options. Some dropdown suggestions may be unavailable.');
          setExistingStatuses(['Active', 'Completed', 'In Progress']);
          if (editingProgram) {
            setExistingProgramTypes([editingProgram.program_type]);
            setExistingLocations([editingProgram.location]);
          } else {
            setExistingProgramTypes([]);
            setExistingLocations([]);
          }
          return;
        }

        if (data) {
          const types = [...new Set(data.map((p) => p.program_type).filter(Boolean))];
          const locations = [...new Set(data.map((p) => p.location).filter(Boolean))];
          const statuses = [...new Set(data.map((p) => p.status).filter(Boolean))];

          if (editingProgram?.program_type && !types.includes(editingProgram.program_type)) {
            types.unshift(editingProgram.program_type);
          }
          if (editingProgram?.location && !locations.includes(editingProgram.location)) {
            locations.unshift(editingProgram.location);
          }
          if (editingProgram?.status && !statuses.includes(editingProgram.status)) {
            statuses.unshift(editingProgram.status);
          }

          const finalStatuses = statuses.length > 0 ? statuses : ['Active', 'Completed', 'In Progress'];

          setExistingProgramTypes(types);
          setExistingLocations(locations);
          setExistingStatuses(finalStatuses);
        }
      } catch (err) {
        if (isCancelled) return;
        setFormLoadError('Unable to load program options. Some dropdown suggestions may be unavailable.');
        setExistingStatuses(['Active', 'Completed', 'In Progress']);
        if (editingProgram) {
          setExistingProgramTypes([editingProgram.program_type]);
          setExistingLocations([editingProgram.location]);
        } else {
          setExistingProgramTypes([]);
          setExistingLocations([]);
        }
      }
    };

    fetchExistingValues();
    return () => {
      isCancelled = true;
    };
  }, [editingProgram]);

  // Pre-populate when editing
  useEffect(() => {
    if (editingProgram) {
      setTitle(editingProgram.title);
      setSlug(editingProgram.slug);
      setSlugManuallyEdited(false);
      setShortDescription(editingProgram.short_description || '');
      setImageUrl(editingProgram.image_url || '');
      setDesktopBannerUrl(editingProgram.banner_url?.desktop || '');
      setMobileBannerUrl(editingProgram.banner_url?.mobile || '');
      setProgramType(editingProgram.program_type || '');
      setLocation(editingProgram.location || '');
      setDate(editingProgram.date || '');
      setStatus(editingProgram.status || 'Active');
      setDisplayOrder(editingProgram.display_order);
      setIsActive(editingProgram.is_active);
      setHeroTitle(editingProgram.hero_title || '');
      setHeroDescription(editingProgram.hero_description || '');
      setSections(
        (editingProgram.sections ?? []).map((s) => ({
          id: s.id,
          section_key: s.section_key,
          content_type: s.content_type || 'text',
          title: s.title || '',
          preamble: s.preamble || '',
          content: removeIds(s.content),
        }))
      );
    }
  }, [editingProgram]);

  // Auto-generate slug from title only when creating new and user hasn't manually edited the slug
  useEffect(() => {
    if (!editingProgram && !slugManuallyEdited) {
      const timer = setTimeout(() => {
      setSlug(generateSlug(title));
    }, 300);
    return () => clearTimeout(timer); 
    }
  }, [title, editingProgram, slugManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: {
      title?: string;
      slug?: string;
      program_type?: string;
      location?: string;
      date?: string;
      image_url?: string;
      short_description?: string;
    } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!slug.trim()) newErrors.slug = 'Slug is required';
    if (!programType.trim()) newErrors.program_type = 'Program type is required';
    if (!location.trim()) newErrors.location = 'Location is required';
    if (!date.trim()) newErrors.date = 'Date is required';
    if (!imageUrl.trim()) newErrors.image_url = 'Image is required';
    if (!shortDescription.trim()) newErrors.short_description = 'Short description is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const formData: ProgramFormData = {
        title: title.trim(),
        slug: slug.trim(),
        program_type: programType,
        location,
        date,
        status,
        image_url: imageUrl,
        banner_url: { desktop: desktopBannerUrl || null, mobile: mobileBannerUrl || null },
        short_description: shortDescription,
        hero_title: heroTitle,
        hero_description: heroDescription,
        display_order: displayOrder,
        is_active: isActive,
        updated_at: editingProgram?.updated_at,
        sections: sections.map((s) => ({
          ...s,
          // Ensure text content_type always has content.text (required by DB constraint)
          content: s.content_type === 'text' && !('text' in s.content)
            ? { text: '', ...s.content }
            : s.content,
        })),
      };

      const success = await onProgramSaved(formData);
      // Only reset on successful creation; editingProgram=null is the create vs update signal
      if (success && !editingProgram) {
        setTitle('');
        setSlug('');
        setShortDescription('');
        setImageUrl('');
        setDesktopBannerUrl('');
        setMobileBannerUrl('');
        setProgramType('');
        setLocation('');
        setDate('');
        setStatus('Active');
        setDisplayOrder(0);
        setIsActive(true);
        setSections([]);
        setHeroTitle('');
        setHeroDescription('');
      }
      if (!success) {
        setSubmitError('Failed to save program. Please try again.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingImage) return;
    try {
      setUploadingImage(true);
      setImageUploadError(null);
      const url = await uploadFile(file);
      setImageUrl(url);
    } catch (err) {
      setImageUploadError(err instanceof Error ? err.message : 'Image upload failed');
      setImageInputKey((k) => k + 1);
    } finally {
      setUploadingImage(false);
    }
  };

  // Remove handleBannerUpload entirely

  // Add these two
  const handleDesktopBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingDesktopBanner) return;
    try {
      setUploadingDesktopBanner(true);
      setDesktopBannerUploadError(null);
      const url = await uploadFile(file);
      setDesktopBannerUrl(url);
    } catch (err) {
      setDesktopBannerUploadError(err instanceof Error ? err.message : 'Desktop banner upload failed');
      setDesktopBannerInputKey((k) => k + 1);
    } finally {
      setUploadingDesktopBanner(false);
    }
  };

  const handleMobileBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingMobileBanner) return;
    try {
      setUploadingMobileBanner(true);
      setMobileBannerUploadError(null);
      const url = await uploadFile(file);
      setMobileBannerUrl(url);
    } catch (err) {
      setMobileBannerUploadError(err instanceof Error ? err.message : 'Mobile banner upload failed');
      setMobileBannerInputKey((k) => k + 1);
    } finally {
      setUploadingMobileBanner(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-xl shadow-sm">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {editingProgram ? 'Edit Program' : 'Create New Program'}
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                {editingProgram ? 'Update your existing program' : 'Create and publish a new program'}
              </p>
            </div>
            <Button
              type="submit"
              form="program-form"
                disabled={isSubmitting || uploadingImage || uploadingDesktopBanner || uploadingMobileBanner}
              className="h-11 px-6 bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-600/10 hover:shadow-md transition-all duration-200"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingProgram ? 'Updating...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingProgram ? 'Update Program' : 'Save Program'}
                </>
              )}
            </Button>
            {submitError && (
              <p className="text-sm text-red-600 mt-2">{submitError}</p>
            )}

          </div>
        </div>

        <form id="program-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content - 3 columns */}
          <div className="xl:col-span-3 space-y-6">
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Program Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {formLoadError && (
                  <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                    {formLoadError}
                  </p>
                )}
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Program Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter program title..."
                    className="h-12 text-lg border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                </div>

                {/* Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                    URL Slug *
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value); setSlugManuallyEdited(true); }}
                    placeholder="url-friendly-slug"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  {errors.slug && <p className="text-sm text-red-500">{errors.slug}</p>}
                  <p className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border">
                    URL: /programs/{slug || 'your-program-slug'}
                  </p>
                </div>

                {/* Short Description */}
                <div className="space-y-2">
                  <Label htmlFor="short-description" className="text-sm font-medium text-slate-700">
                    Short Description
                  </Label>
                  <Textarea
                    id="short-description"
                    value={shortDescription}
                    onChange={(e) => setShortDescription(e.target.value)}
                    placeholder="Brief summary of the program..."
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                    rows={3}
                  />
                  {errors.short_description && <p className="text-sm text-red-500">{errors.short_description}</p>}
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image-url" className="text-sm font-medium text-slate-700">
                    Image
                  </Label>
                  {imageUrl && (
                    <img src={imageUrl} alt={`${title || 'Program'} image preview`} className="w-32 h-20 object-cover rounded-lg border border-slate-200" 
                    onError={(e) => {
                      e.currentTarget.onerror = null; 
                      e.currentTarget.src = '/image.png';
                    }} />
                  )}
                  <input
                    key={imageInputKey}
                    id="image-url"
                    name="image"
                    type="file"
                    accept="image/*"
                    aria-label="Upload program image"
                    disabled={uploadingImage}
                    onChange={handleImageUpload}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                  />
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                    </div>
                  )}
                  {imageUploadError && <p className="text-sm text-red-600">{imageUploadError}</p>}
                  {errors.image_url && <p className="text-sm text-red-500">{errors.image_url}</p>}
                </div>
                {/* Desktop Banner Upload */}
                <div className="space-y-2">
                  <Label htmlFor="desktop-banner-url" className="text-sm font-medium text-slate-700">
                    Desktop Banner
                  </Label>
                  {desktopBannerUrl && (
                    <img src={desktopBannerUrl} alt={`${title || 'Program'} desktop banner preview`} className="w-full h-24 object-cover rounded-lg border border-slate-200" 
                    onError={(e) => {
                    e.currentTarget.onerror = null;  
                    e.currentTarget.src = '/image.png'; }} />
                  )}
                  <input
                    key={desktopBannerInputKey}
                    id="desktop-banner-url"
                    name="desktop-banner"
                    type="file"
                    accept="image/*"
                    aria-label="Upload desktop banner"
                    disabled={uploadingDesktopBanner}
                    onChange={handleDesktopBannerUpload}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                  />
                  {uploadingDesktopBanner && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading desktop banner...
                    </div>
                  )}
                  {desktopBannerUploadError && <p className="text-sm text-red-600">{desktopBannerUploadError}</p>}
                </div>

                {/* Mobile Banner Upload */}
                <div className="space-y-2">
                  <Label htmlFor="mobile-banner-url" className="text-sm font-medium text-slate-700">
                    Mobile Banner
                  </Label>
                  {mobileBannerUrl && (
                    <img src={mobileBannerUrl} alt={`${title || 'Program'} mobile banner preview`} className="w-full h-24 object-cover rounded-lg border border-slate-200" 
                    onError={(e) => { 
                    e.currentTarget.onerror = null; 
                    e.currentTarget.src = '/image.png'; }} />
                  )}
                  <input
                    key={mobileBannerInputKey}
                    id="mobile-banner-url"
                    name="mobile-banner"
                    type="file"
                    accept="image/*"
                    aria-label="Upload mobile banner"
                    disabled={uploadingMobileBanner}
                    onChange={handleMobileBannerUpload}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                  />
                  {uploadingMobileBanner && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading mobile banner...
                    </div>
                  )}
                  {mobileBannerUploadError && <p className="text-sm text-red-600">{mobileBannerUploadError}</p>}
                </div>
                {/* Hero Title */}
                <div className="space-y-2">
                  <Label htmlFor="hero-title" className="text-sm font-medium text-slate-700">
                    Hero Title
                  </Label>
                  <Input
                    id="hero-title"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="Title shown on the banner..."
                    className="h-12 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>

                {/* Hero Description */}
                <div className="space-y-2">
                  <Label htmlFor="hero-description" className="text-sm font-medium text-slate-700">
                    Hero Description
                  </Label>
                  <Textarea
                    id="hero-description"
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    placeholder="Description shown on the banner..."
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Sections */}
            <ProgramSectionsEditor sections={sections} onChange={setSections} />
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Settings className="w-4 h-4 text-green-500" />
                  Program Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Program Type */}
                <div className="space-y-2">
                  <Label htmlFor="program-type" className="text-sm font-medium text-slate-700">
                    Program Type
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between border-slate-200 font-normal"
                      >
                        {programType || 'Select program type'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        {/* Single state is intentional — this combobox supports both selecting existing 
                         values and typing a custom new value. The input value IS the final output. */}
                        <CommandInput
                          placeholder="Search or type new..."
                          value={programType}
                          onValueChange={setProgramType}
                        />
                        <CommandList>
                          <CommandEmpty className="py-2 px-3 text-sm text-slate-700">
                            No program type found.
                          </CommandEmpty>
                          <CommandGroup>
                            {existingProgramTypes.map((type) => (
                              <CommandItem
                                key={type}
                                value={type}
                                onSelect={(val) => setProgramType(val)}
                              >
                                <Check className={cn('mr-2 h-4 w-4', programType === type ? 'opacity-100' : 'opacity-0')} />
                                {type}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.program_type && <p className="text-sm text-red-500">{errors.program_type}</p>}
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                    Location
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between border-slate-200 font-normal"
                      >
                        {location || 'Select location'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        {/* Single state is intentional — this combobox supports both selecting existing 
    values and typing a custom new value. The input value IS the final output. */}
                        <CommandInput
                          placeholder="Search or type new..."
                          value={location}
                          onValueChange={setLocation}
                        />
                        <CommandList>
                          <CommandEmpty
                            className="py-2 px-3 text-sm text-slate-700"
                          >
                            Press Enter to use "{location}"
                          </CommandEmpty>
                          <CommandGroup>
                            {existingLocations.map((loc) => (
                              <CommandItem
                                key={loc}
                                value={loc}
                                onSelect={(val) => setLocation(val)}
                              >
                                <Check className={cn('mr-2 h-4 w-4', location === loc ? 'opacity-100' : 'opacity-0')} />
                                {loc}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {errors.location && <p className="text-sm text-red-500">{errors.location}</p>}
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-sm font-medium text-slate-700">
                    Date
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  {errors.date && <p className="text-sm text-red-500">{errors.date}</p>}
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Display Order */}
                <div className="space-y-2">
                  <Label htmlFor="display-order" className="text-sm font-medium text-slate-700">
                    Display Order
                  </Label>
                  <Input
                    id="display-order"
                    type="number"
                    value={displayOrder}
                    onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>

                {/* Active */}
                <div className="flex items-center justify-between">
                  <Label htmlFor="is-active" className="text-sm font-medium text-slate-700">
                    Active
                  </Label>
                  <input
                    id="is-active"
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostSection;

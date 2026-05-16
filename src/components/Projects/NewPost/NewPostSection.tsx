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

const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/upload', { method: 'POST', body: formData });
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error('Upload failed: server returned an invalid response');
  }
  if (!res.ok) {
    const errMsg = data && typeof data === 'object' && 'error' in data && typeof (data as Record<string, unknown>).error === 'string'
      ? (data as Record<string, unknown>).error as string
      : 'Upload failed';
    throw new Error(errMsg);
  }
  if (!data || typeof data !== 'object' || !('url' in data) || typeof (data as Record<string, unknown>).url !== 'string') {
    throw new Error('Upload failed: no URL returned');
  }
  return (data as Record<string, string>).url;
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
  const [bannerUrl, setBannerUrl] = useState('');
  const [programType, setProgramType] = useState('');
  const [location, setLocation] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Active');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [errors, setErrors] = useState<{ title?: string; slug?: string }>({});
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  // Tracks whether the user has manually edited the slug field.
  // When true, title changes no longer auto-regenerate the slug.
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

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
    const fetchExistingValues = async () => {
      const { data, error } = await supabase
        .from('programs')
        .select('program_type, location, status');

      if (error) {
        setUploadError('Failed to load form options. Please refresh and try again.');
        // Fall back to defaults so the form remains usable
        setExistingStatuses(['Active', 'Completed', 'In Progress']);
        return;
      }

      if (data) {
        const types = [...new Set(data.map((p) => p.program_type).filter(Boolean))];
        const locations = [...new Set(data.map((p) => p.location).filter(Boolean))];
        const statuses = [...new Set(data.map((p) => p.status).filter(Boolean))];

        // Ensure the editing program's values are always present in the lists
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

        // Re-apply editing values AFTER options are loaded so Radix Select can match them
        if (editingProgram) {
          setProgramType(editingProgram.program_type || '');
          setLocation(editingProgram.location || '');
          setStatus(editingProgram.status || 'Active');
        }
      }
    };

    fetchExistingValues();
  }, [editingProgram]);

  // Helper function to remove IDs from content recursively
  const removeIds = (obj: Record<string, unknown>): Record<string, unknown> => {
    const process = (val: unknown): unknown => {
      if (Array.isArray(val)) return val.map(process);
      if (val !== null && typeof val === 'object') {
        return Object.fromEntries(
          Object.entries(val as Record<string, unknown>)
            .filter(([k]) => k !== 'id')
            .map(([k, v]) => [k, process(v)])
        );
      }
      return val;
    };
    return process(obj) as Record<string, unknown>;
  };

  // Pre-populate when editing
  useEffect(() => {
    if (editingProgram) {
      setTitle(editingProgram.title);
      setSlug(editingProgram.slug);
      setSlugManuallyEdited(false);
      setShortDescription(editingProgram.short_description || '');
      setImageUrl(editingProgram.image_url || '');
      setBannerUrl(editingProgram.banner_url || '');
      setProgramType(editingProgram.program_type || '');
      setLocation(editingProgram.location || '');
      setDate(editingProgram.date || '');
      setStatus(editingProgram.status || 'Active');
      setDisplayOrder(editingProgram.display_order);
      setIsActive(editingProgram.is_active);
      setSections(
        editingProgram.sections.map((s) => ({
          section_key: s.section_key,
          content_type: s.content_type || 'text',
          title: s.title || '',
          preamble: s.preamble || '',
          content: removeIds(s.content as Record<string, unknown>),
        }))
      );
    }
  }, [editingProgram]);

  // Auto-generate slug from title only when creating new and user hasn't manually edited the slug
  useEffect(() => {
    if (!editingProgram && !slugManuallyEdited) {
      setSlug(generateSlug(title));
    }
  }, [title, editingProgram, slugManuallyEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { title?: string; slug?: string } = {};
    if (!title.trim()) newErrors.title = 'Title is required';
    if (!slug.trim()) newErrors.slug = 'Slug is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    const formData: ProgramFormData = {
      title: title.trim(),
      slug: slug.trim(),
      program_type: programType,
      location,
      date,
      status,
      image_url: imageUrl,
      banner_url: bannerUrl,
      short_description: shortDescription,
      display_order: displayOrder,
      is_active: isActive,
      sections,
    };

    const success = await onProgramSaved(formData);

    // Only reset form on successful creation (not editing)
    if (success && !editingProgram) {
      setTitle('');
      setSlug('');
      setShortDescription('');
      setImageUrl('');
      setBannerUrl('');
      setProgramType('');
      setLocation('');
      setDate('');
      setStatus('Active');
      setDisplayOrder(0);
      setIsActive(true);
      setSections([]);
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
              className="h-11 px-6 bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-600/10 hover:shadow-md transition-all duration-200"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingProgram ? 'Update Program' : 'Save Program'}
            </Button>
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
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image-url" className="text-sm font-medium text-slate-700">
                    Image
                  </Label>
                  {imageUrl && (
                    <img src={imageUrl} alt="Program image" className="w-32 h-20 object-cover rounded-lg border border-slate-200" />
                  )}
                  <input
                    id="image-url"
                    type="file"
                    accept="image/*"
                    disabled={uploadingImage}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true);
                      setUploadError(null);
                      try {
                        const url = await uploadFile(file);
                        setImageUrl(url);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : 'Image upload failed');
                      } finally {
                        setUploadingImage(false);
                      }
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                  />
                  {uploadingImage && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                    </div>
                  )}
                </div>

                {/* Banner Upload */}
                <div className="space-y-2">
                  <Label htmlFor="banner-url" className="text-sm font-medium text-slate-700">
                    Banner
                  </Label>
                  {bannerUrl && (
                    <img src={bannerUrl} alt="Program banner" className="w-full h-24 object-cover rounded-lg border border-slate-200" />
                  )}
                  <input
                    id="banner-url"
                    type="file"
                    accept="image/*"
                    disabled={uploadingBanner}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingBanner(true);
                      setUploadError(null);
                      try {
                        const url = await uploadFile(file);
                        setBannerUrl(url);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : 'Banner upload failed');
                      } finally {
                        setUploadingBanner(false);
                      }
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                  />
                  {uploadingBanner && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading banner...
                    </div>
                  )}
                  {uploadError && (
                    <p className="text-sm text-red-600 mt-1">{uploadError}</p>
                  )}
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
                        <CommandInput
                          placeholder="Search or type new..."
                          value={programType}
                          onValueChange={setProgramType}
                        />
                        <CommandList>
                          <CommandEmpty
                            className="py-2 px-3 text-sm cursor-pointer hover:bg-purple-50 text-slate-700"
                            onClick={() => {/* keep typed value */}}
                          >
                            Press Enter to use &quot;{programType}&quot;
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
                        <CommandInput
                          placeholder="Search or type new..."
                          value={location}
                          onValueChange={setLocation}
                        />
                        <CommandList>
                          <CommandEmpty
                            className="py-2 px-3 text-sm text-slate-700"
                          >
                            Press Enter to use &quot;{location}&quot;
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
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostSection;

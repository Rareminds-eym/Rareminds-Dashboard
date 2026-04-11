import { useState, useEffect } from 'react';
import { Program, ProgramFormData, ProgramSectionFormData, SectionKeyType } from '../../../types/program';
import { generateSlug } from '../../../hooks/usePrograms';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Checkbox } from '../../ui/checkbox';
import { Save, Sparkles, Settings, Plus, X, Layers } from 'lucide-react';

interface NewPostSectionProps {
  onProgramSaved: (data: ProgramFormData) => void;
  editingProgram?: Program | null;
}

const ALL_SECTION_KEYS: SectionKeyType[] = [
  'introduction', 'about', 'modules', 'approaches', 'impact',
  'strategic_alignment', 'conclusion', 'header', 'course_enrollment',
  'programs', 'why', 'cloud_kitchen', 'agri_food', 'inventions',
];

const formatSectionKey = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [sections, setSections] = useState<ProgramSectionFormData[]>([]);
  const [errors, setErrors] = useState<{ title?: string; slug?: string }>({});

  // Pre-populate when editing
  useEffect(() => {
    if (editingProgram) {
      setTitle(editingProgram.title);
      setSlug(editingProgram.slug);
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
          title: s.title || '',
          content: s.content || '',
        }))
      );
    }
  }, [editingProgram]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!editingProgram) {
      setSlug(generateSlug(title));
    }
  }, [title, editingProgram]);

  const availableSectionKeys = ALL_SECTION_KEYS.filter(
    (key) => !sections.some((s) => s.section_key === key)
  );

  const addSection = (key: SectionKeyType) => {
    setSections((prev) => [...prev, { section_key: key, title: '', content: '' }]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: 'title' | 'content', value: string) => {
    setSections((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    onProgramSaved(formData);

    if (!editingProgram) {
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
                    onChange={(e) => setSlug(e.target.value)}
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

                {/* Image URL */}
                <div className="space-y-2">
                  <Label htmlFor="image-url" className="text-sm font-medium text-slate-700">
                    Image URL
                  </Label>
                  <Input
                    id="image-url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>

                {/* Banner URL */}
                <div className="space-y-2">
                  <Label htmlFor="banner-url" className="text-sm font-medium text-slate-700">
                    Banner URL
                  </Label>
                  <Input
                    id="banner-url"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Sections */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Layers className="w-5 h-5 text-purple-500" />
                  Program Sections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Section Dropdown */}
                {availableSectionKeys.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Add Section</Label>
                    <Select onValueChange={(value) => addSection(value as SectionKeyType)}>
                      <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                        <SelectValue placeholder="Select a section to add..." />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSectionKeys.map((key) => (
                          <SelectItem key={key} value={key}>
                            {formatSectionKey(key)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Added Sections */}
                {sections.map((section, index) => (
                  <div
                    key={section.section_key}
                    className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className="bg-purple-50 text-purple-700 border border-purple-200"
                      >
                        {formatSectionKey(section.section_key)}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(index)}
                        className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Section Title</Label>
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                        placeholder="Section title..."
                        className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">Content</Label>
                      <Textarea
                        value={section.content}
                        onChange={(e) => updateSection(index, 'content', e.target.value)}
                        placeholder="Section content..."
                        className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                        rows={4}
                      />
                    </div>
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="text-center py-8 text-slate-400">
                    <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No sections added yet. Use the dropdown above to add sections.</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
                  <Input
                    id="program-type"
                    value={programType}
                    onChange={(e) => setProgramType(e.target.value)}
                    placeholder="e.g., College, Government Body"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., Chennai, Tamil Nadu"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
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
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
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

                {/* Is Active */}
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="is-active"
                    checked={isActive}
                    onCheckedChange={(checked) => setIsActive(checked === true)}
                  />
                  <Label htmlFor="is-active" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Active
                  </Label>
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

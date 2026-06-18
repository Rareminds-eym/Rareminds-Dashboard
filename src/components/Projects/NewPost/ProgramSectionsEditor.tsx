import { useState } from 'react';
import { SectionKeyType, ContentType, CardItem, StatItem, CourseItem, ImageItem } from '../../../types/program';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Plus, X, Layers, Loader2 } from 'lucide-react';

const hasStringError = (val: unknown): val is { error: string } => {
  return (
    typeof val === 'object' &&
    val !== null &&
    'error' in val &&
    typeof (val as { error: unknown }).error === 'string'
  );
};

const hasStringUrl = (val: unknown): val is { url: string } => {
  return (
    typeof val === 'object' &&
    val !== null &&
    'url' in val &&
    typeof (val as { url: unknown }).url === 'string'
  );
};

const isImageLike = (val: unknown): val is { id?: string; url?: string } =>
  typeof val === 'object' && val !== null && !Array.isArray(val) &&
  (('url' in val && typeof (val as { url: unknown }).url === 'string') || !('url' in val));
const isSafeUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    // Explicitly block data: and javascript: URIs
    if (parsed.protocol === 'data:') return false;
    if (parsed.protocol === 'javascript:') return false;
    // Only allow https and http
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
};
const UPLOAD_TIMEOUT_MS = 30000;
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, UPLOAD_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch('/upload', { method: 'POST', body: formData, signal: controller.signal, });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('Upload timed out. Please try again.');
    }
    throw new Error(`Network error: unable to reach upload server (${err instanceof Error ? err.message : String(err)})`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Try to parse JSON regardless of status, so we can extract error messages
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (e.g. HTML error page from a proxy/CDN)
    throw new Error(`Upload failed (${res.status}): server returned an invalid response`);
  }

  if (!res.ok) {
    const errMsg = hasStringError(data) ? data.error : `Upload failed (${res.status})`;
    throw new Error(errMsg);
  }

  if (!hasStringUrl(data)) {
    throw new Error('Upload failed: no URL returned');
  }

  return data.url;

};

export type SectionItem = {
  id?: string;
  section_key: SectionKeyType;
  content_type: ContentType;
  title: string;
  preamble: string;
  content: Record<string, unknown>;
};

interface ProgramSectionsEditorProps {
  sections: SectionItem[];
  onChange: (sections: SectionItem[]) => void;
}

const ALL_SECTION_KEYS: SectionKeyType[] = [
  'introduction', 'about', 'modules', 'approaches', 'impact',
  'strategic_alignment', 'conclusion', 'header', 'course_enrollment',
  'program_delivery', 'intervention', 'video',
];

const formatSectionKey = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ProgramSectionsEditor = ({ sections, onChange }: ProgramSectionsEditorProps) => {
  const [uploadingStates, setUploadingStates] = useState<Record<string, boolean>>({});
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isImageObject = (val: unknown): val is { url?: string; alt?: string } =>
    val !== null && typeof val === 'object' && !Array.isArray(val) &&
    (!('url' in val) || typeof (val as { url: unknown }).url === 'string') &&
    (!('alt' in val) || typeof (val as { alt: unknown }).alt === 'string');

  const isCardItem = (item: unknown): item is CardItem =>
    typeof item === 'object' && item !== null &&
    typeof (item as { title?: unknown }).title === 'string' &&
    typeof (item as { description?: unknown }).description === 'string';

  const isStatItem = (item: unknown): item is StatItem =>
    typeof item === 'object' && item !== null &&
    typeof (item as { value?: unknown }).value === 'string' &&
    typeof (item as { label?: unknown }).label === 'string';

  const isCourseItem = (item: unknown): item is CourseItem =>
    typeof item === 'object' && item !== null &&
    typeof (item as { title?: unknown }).title === 'string' &&
    typeof (item as { total?: unknown }).total === 'number' &&
    Array.isArray((item as { universities?: unknown }).universities);

  const getUniversities = (course: CourseItem) =>
    Array.isArray(course.universities) ? course.universities : [];

  const setUploading = (key: string, val: boolean) =>
    setUploadingStates((prev) => ({ ...prev, [key]: val }));
  const handleFileUpload = async (
    file: File,
    uploadKey: string,
    onSuccess: (url: string) => void,
    errorLabel = 'Upload failed'
  ) => {
    setUploading(uploadKey, true);
    setUploadError(null);
    try {
      const url = await uploadFile(file);
      onSuccess(url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : errorLabel);
    } finally {
      setUploading(uploadKey, false);
    }
  };
  const availableSectionKeys = ALL_SECTION_KEYS.filter(
    (key) => !sections.some((s) => s.section_key === key)
  );

  const addSection = (key: SectionKeyType) => {
    // All sections default to content_type 'text', which requires content.text (DB constraint check_text_shape)
    onChange([...sections, { section_key: key, content_type: 'text', title: '', preamble: '', content: { text: '' } }]);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const updateSection = (index: number, field: 'title' | 'content_type' | 'preamble', value: string) => {
    onChange(sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  const updateContentField = (sectionIndex: number, field: string, value: unknown) => {
    onChange(
      sections.map((s, i) =>
        i === sectionIndex ? { ...s, content: { ...s.content, [field]: value } } : s
      )
    );
  };

  const addArrayItem = (sectionIndex: number, arrayKey: string, newItem: CardItem | StatItem | CourseItem | ImageItem) => {
    // Assign a stable client-side UUID so key={item.id} always works without index fallback
    const itemWithId = { ...newItem, id: crypto.randomUUID() };
    onChange(
      sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        const raw = s.content[arrayKey];
        const current = Array.isArray(raw)
          ? raw.filter((item): item is CardItem | StatItem | CourseItem | ImageItem =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
          )
          : [];
        return { ...s, content: { ...s.content, [arrayKey]: [...current, itemWithId] } };
      })
    );
  };

  const removeArrayItem = (sectionIndex: number, arrayKey: string, itemIndex: number) => {
    onChange(
      sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        const current = Array.isArray(s.content[arrayKey]) ? (s.content[arrayKey] as unknown[]) : [];
        return { ...s, content: { ...s.content, [arrayKey]: current.filter((_, idx) => idx !== itemIndex) } };
      })
    );
  };

  const updateArrayItem = (
    sectionIndex: number,
    arrayKey: string,
    itemIndex: number,
    field: string,
    value: unknown
  ) => {
    onChange(
      sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        const raw = s.content[arrayKey];
        const current = Array.isArray(raw)
          ? raw.filter((item): item is Record<string, unknown> =>
            typeof item === 'object' && item !== null && !Array.isArray(item)
          )
          : [];
        return {
          ...s,
          content: {
            ...s.content,
            [arrayKey]: current.map((item, idx) => (idx === itemIndex ? { ...item, [field]: value } : item)),
          },
        };
      })
    );
  };

  const renderContentForm = (section: SectionItem, sectionIndex: number) => {
    const content = section.content ?? {};
    switch (section.content_type) {
      case 'text': {
        const textContent = typeof content.text === 'string' ? content.text : '';
        const rawImages = Array.isArray(content.images) ? content.images as unknown[] : [];
        const images: ImageItem[] = rawImages.map((img) => {
          if (typeof img === 'string') return { url: img };
          if (isImageLike(img)) return { id: img.id, url: img.url || '' };
          return { url: '' };
        }
        );
        const rawImage = isImageObject(content.image) ? content.image : undefined;
        const image = { url: rawImage?.url || '', alt: rawImage?.alt || '' };
        const isVideo = section.section_key === 'video';
        const isIntroduction = section.section_key === 'introduction';
        const isConclusion = section.section_key === 'conclusion';

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                {isVideo ? 'Video' : 'Text Content'}
              </Label>
              {isVideo ? (
                <>
                  {/* Show existing uploaded videos */}
                  {textContent && textContent.split(',').map((v) => v.trim()).filter(Boolean).map((url) => (
                     // key={idx} is acceptable here: videos are a comma-string with no stable ID,
                    // items are never reordered, and rows contain no controlled inputs
                    <div key={url} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="flex-1 text-xs text-slate-600 truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = textContent.split(',').map((v) => v.trim()).filter((v) => v !== url).join(', ');
                          updateContentField(sectionIndex, 'text', updated);
                        }}
                        className="text-red-400 hover:text-red-600 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <input
                    type="file"
                    accept="video/*"
                    aria-label="Upload video file"
                    disabled={uploadingStates[`video-${sectionIndex}`]}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(
                        file,
                        `video-${sectionIndex}`,
                        (url) => {
                          const existing = typeof content.text === 'string' && content.text.trim() ? content.text.trim() : '';
                          updateContentField(sectionIndex, 'text', existing ? `${existing}, ${url}` : url);
                        },
                        'Video upload failed'
                      );
                    }}
                    className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                  />
                  {uploadingStates[`video-${sectionIndex}`] && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading video...
                    </div>
                  )}
                </>
              ) : (
                <Textarea
                  value={textContent}
                  onChange={(e) => updateContentField(sectionIndex, 'text', e.target.value)}
                  placeholder="Enter text content..."
                  className="border-slate-200 resize-none"
                  rows={6}
                />
              )}
            </div>

            {!isVideo && isIntroduction && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Images (Multiple)</Label>
                {images.map((img, idx) => (
                  <div key={img.id} className="space-y-1">
                    {(() => {
                      const safeUrl = isSafeUrl(img.url) ? img.url : '';
                      return safeUrl ? (
                        <img
                          src={safeUrl}
                          alt={`Introduction section image ${idx + 1}`}
                          className="w-24 h-16 object-cover rounded border border-slate-200"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            if (isSafeUrl('/image.png')) { e.currentTarget.src = '/image.png';} }}
                        />
                      ) : null;
                    })()}
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        aria-label={`Upload introduction image ${idx + 1}`}
                        disabled={uploadingStates[`intro-img-${sectionIndex}-${idx}`]}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            void handleFileUpload(file, `intro-img-${sectionIndex}-${idx}`, (url) => updateContentField(sectionIndex, 'images', images.map((img, i) => i === idx ? { ...img, url } : img)), 'Image upload failed');}
                          }}
                        className="flex-1 text-sm text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                      />
                      {uploadingStates[`intro-img-${sectionIndex}-${idx}`] && (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newImages = images.filter((_, i) => i !== idx);
                          updateContentField(sectionIndex, 'images', newImages);
                        }}
                        className="hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateContentField(sectionIndex, 'images', [...images, { url: '' }])
                  }
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Image
                </Button>
              </div>
            )}

            {!isVideo && isConclusion && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Single Image</Label>
                {(() => {
                  const safeUrl = isSafeUrl(image.url) ? image.url : '';
                  return safeUrl ? (
                    <img
                      src={safeUrl}
                      alt="Conclusion image"
                      className="w-32 h-20 object-cover rounded-lg border border-slate-200"
                      onError={(e) => { 
                        e.currentTarget.onerror = null;
                        if (isSafeUrl('/image.png')) {e.currentTarget.src = '/image.png';} }}
                    />
                  ) : null;
                })()}
                <input
                  type="file"
                  accept="image/*"
                  aria-label="Upload conclusion image"
                  disabled={uploadingStates[`conclusion-img-${sectionIndex}`]}
                 onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleFileUpload(file, `conclusion-img-${sectionIndex}`, (url) => updateContentField(sectionIndex, 'image', { url, alt: image.alt }), 'Image upload failed');}
                  }}
                  className="block w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer disabled:opacity-50"
                />
                {uploadingStates[`conclusion-img-${sectionIndex}`] && (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin" /> Uploading image...
                  </div>
                )}
                <Input
                  value={image.alt}
                  onChange={(e) =>
                    updateContentField(sectionIndex, 'image', { url: image.url, alt: e.target.value })
                  }
                  placeholder="Image alt text"
                />
              </div>
            )}
          </div>
        );
      }

      case 'cards': {
        const items = Array.isArray(content.items) ? content.items.filter(isCardItem) : [];
        const description = typeof content.description === 'string' ? content.description : '';

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => updateContentField(sectionIndex, 'description', e.target.value)}
                placeholder="Overall description..."
                className="border-slate-200 resize-none"
                rows={2}
              />
            </div>
            <Label className="text-sm font-medium text-slate-700">Cards</Label>
            {items.map((card, idx) => (
              <div key={card.id} className="border border-slate-300 rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Card {idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(sectionIndex, 'items', idx)}
                    className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={card.title}
                  onChange={(e) => updateArrayItem(sectionIndex, 'items', idx, 'title', e.target.value)}
                  placeholder="Card title"
                />
                <Textarea
                  value={card.description}
                  onChange={(e) => updateArrayItem(sectionIndex, 'items', idx, 'description', e.target.value)}
                  placeholder="Card description"
                  className="resize-none"
                  rows={3}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(sectionIndex, 'items', { title: '', description: '' })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Card
            </Button>
          </div>
        );
      }

      case 'stats': {
        const items = Array.isArray(content.items) ? content.items.filter(isStatItem) : [];


        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-700">Statistics</Label>
            {items.map((stat, idx) => (
              <div key={stat.id} className="border border-slate-300 rounded-lg p-4 space-y-3 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Stat {idx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(sectionIndex, 'items', idx)}
                    className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={stat.value}
                  onChange={(e) => updateArrayItem(sectionIndex, 'items', idx, 'value', e.target.value)}
                  placeholder="Value (e.g., 85%, 100+)"
                />
                <Input
                  value={stat.label}
                  onChange={(e) => updateArrayItem(sectionIndex, 'items', idx, 'label', e.target.value)}
                  placeholder="Label (e.g., Students reported...)"
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(sectionIndex, 'items', { value: '', label: '' })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stat
            </Button>
          </div>
        );
      }

      case 'courses': {
        const courses = Array.isArray(content.courses) ? content.courses.filter(isCourseItem) : [];

        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-700">Courses</Label>
            {courses.map((course, courseIdx) => (
              <div key={course.id} className="border border-slate-300 rounded-lg p-4 space-y-4 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">Course {courseIdx + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeArrayItem(sectionIndex, 'courses', courseIdx)}
                    className="h-7 w-7 p-0 hover:bg-red-100 hover:text-red-600"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <Input
                  value={course.title}
                  onChange={(e) => updateArrayItem(sectionIndex, 'courses', courseIdx, 'title', e.target.value)}
                  placeholder="Course title"
                />
                <Input
                  type="number"
                  value={course.total}
                  onChange={(e) =>
                    updateArrayItem(sectionIndex, 'courses', courseIdx, 'total', parseInt(e.target.value) || 0)
                  }
                  placeholder="Total students"
                />
                <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                  <Label className="text-xs font-medium text-slate-600">Universities</Label>
                  {getUniversities(course).map((uni, uniIdx) => (
                    <div key={uni.id} className="flex gap-2 items-start">
                      <Input
                        value={uni.name}
                        onChange={(e) => {
                          updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities',
                            getUniversities(course).map((u, i) => i === uniIdx ? { ...u, name: e.target.value } : u)
                          );
                        }}
                        placeholder="University name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={uni.students}
                        onChange={(e) => {
                          updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities',
                            getUniversities(course).map((u, i) => i === uniIdx ? { ...u, students: parseInt(e.target.value) || 0 } : u)
                          );
                        }}
                        placeholder="Students"
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities',
                            getUniversities(course).filter((_, i) => i !== uniIdx)
                          );
                        }}
                        className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities',
                        [...getUniversities(course), { id: crypto.randomUUID(), name: '', students: 0 }]
                      );
                    }}
                    className="w-full"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Add University
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addArrayItem(sectionIndex, 'courses', { title: '', total: 0, universities: [] })}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Course
            </Button>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-slate-800">
          <Layers className="w-5 h-5 text-purple-500" />
          Program Sections
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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

        {sections.map((section, index) => (
          <div
            key={section.id ?? section.section_key}
            className="border border-slate-200 rounded-xl p-4 space-y-4 bg-slate-50/50"
          >
            <div className="flex items-center justify-between">
              <Badge variant="secondary" className="bg-purple-50 text-purple-700 border border-purple-200">
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
              <Label className="text-sm font-medium text-slate-700">Content Type</Label>
              <Select
                value={section.content_type}
                onValueChange={(value) => updateSection(index, 'content_type', value)}
              >
                <SelectTrigger className="border-slate-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="stats">Statistics</SelectItem>
                  <SelectItem value="courses">Courses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Preamble (Optional)</Label>
              <Textarea
                value={section.preamble}
                onChange={(e) => updateSection(index, 'preamble', e.target.value)}
                placeholder="Brief introduction..."
                className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none"
                rows={2}
              />
            </div>

            <div className="pt-2 border-t border-slate-200">
              {renderContentForm(section, index)}
            </div>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Select a section type from the dropdown above to start building your program content.</p>
          </div>
        )}
        {uploadError && (
          <p className="text-sm text-red-600 mt-1">{uploadError}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgramSectionsEditor;

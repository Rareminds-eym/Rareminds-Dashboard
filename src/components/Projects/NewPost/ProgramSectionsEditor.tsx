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

// ── Runtime normalisers — validate each element from unknown DB data ──────────

const normalizeImageItem = (val: unknown): ImageItem => {
  if (typeof val === 'string') return { url: val };
  if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
    const obj = val as Record<string, unknown>;
    return {
      id: typeof obj.id === 'string' ? obj.id : undefined,
      url: typeof obj.url === 'string' ? obj.url : '',
    };
  }
  return { url: '' };
};

const normalizeCardItem = (val: unknown): CardItem | null => {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return null;
  const obj = val as Record<string, unknown>;
  return {
    id: typeof obj.id === 'string' ? obj.id : undefined,
    title: typeof obj.title === 'string' ? obj.title : '',
    description: typeof obj.description === 'string' ? obj.description : '',
  };
};

const normalizeStatItem = (val: unknown): StatItem | null => {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return null;
  const obj = val as Record<string, unknown>;
  return {
    id: typeof obj.id === 'string' ? obj.id : undefined,
    value: typeof obj.value === 'string' ? obj.value : '',
    label: typeof obj.label === 'string' ? obj.label : '',
  };
};

const normalizeCourseItem = (val: unknown): CourseItem | null => {
  if (val === null || typeof val !== 'object' || Array.isArray(val)) return null;
  const obj = val as Record<string, unknown>;
  const universities = Array.isArray(obj.universities)
    ? obj.universities.map((u: unknown) => {
        if (u === null || typeof u !== 'object' || Array.isArray(u)) return null;
        const uni = u as Record<string, unknown>;
        return {
          id: typeof uni.id === 'string' ? uni.id : undefined,
          name: typeof uni.name === 'string' ? uni.name : '',
          students: typeof uni.students === 'number' ? uni.students : 0,
        };
      }).filter((u): u is NonNullable<typeof u> => u !== null)
    : [];
  return {
    id: typeof obj.id === 'string' ? obj.id : undefined,
    title: typeof obj.title === 'string' ? obj.title : '',
    total: typeof obj.total === 'number' ? obj.total : 0,
    universities,
  };
};
const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/upload', { method: 'POST', body: formData });

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
    val !== null && typeof val === 'object' && !Array.isArray(val);

  const getUniversities = (course: CourseItem) =>
    Array.isArray(course.universities) ? course.universities : [];

  const setUploading = (key: string, val: boolean) =>
    setUploadingStates((prev) => ({ ...prev, [key]: val }));
  const availableSectionKeys = ALL_SECTION_KEYS.filter(
    (key) => !sections.some((s) => s.section_key === key)
  );

  const addSection = (key: SectionKeyType) => {
    onChange([...sections, { section_key: key, content_type: 'text', title: '', preamble: '', content: {} }]);
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
    onChange(
      sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        const current = Array.isArray(s.content[arrayKey]) ? (s.content[arrayKey] as unknown[]) : [];
        return { ...s, content: { ...s.content, [arrayKey]: [...current, newItem] } };
      })
    );
  };

  const removeArrayItem = (sectionIndex: number, arrayKey: string, itemIndex: number) => {
    onChange(
      sections.map((s, i) => {
        if (i !== sectionIndex) return s;
        const current = Array.isArray(s.content[arrayKey]) ? s.content[arrayKey] as unknown[] : [];
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
        const current = Array.isArray(s.content[arrayKey])
          ? (s.content[arrayKey] as unknown[]).filter(
              (item): item is Record<string, unknown> =>
                item !== null && typeof item === 'object' && !Array.isArray(item)
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
    switch (section.content_type) {
      case 'text': {
        const textContent = typeof section.content.text === 'string' ? section.content.text : '';
        const images: ImageItem[] = Array.isArray(section.content.images)
          ? section.content.images.map(normalizeImageItem)
          : [];
        const rawImage = isImageObject(section.content.image) ? section.content.image : undefined;
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
                  <input
                    type="file"
                    accept="video/*"
                    disabled={uploadingStates[`video-${sectionIndex}`]}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(`video-${sectionIndex}`, true);
                      try {
                        const url = await uploadFile(file);
                        updateContentField(sectionIndex, 'text', url);
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : 'Video upload failed');
                      } finally {
                        setUploading(`video-${sectionIndex}`, false);
                      }
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
                  <div key={img.id ?? `new-${idx}`} className="space-y-1">
                    {img.url && <img src={img.url} alt={`Image ${idx + 1}`} className="w-24 h-16 object-cover rounded border border-slate-200" />}
                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingStates[`intro-img-${sectionIndex}-${idx}`]}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploading(`intro-img-${sectionIndex}-${idx}`, true);
                          try {
                            const url = await uploadFile(file);
                            updateContentField(
                              sectionIndex,
                              'images',
                              images.map((img, i) => i === idx ? { ...img, url } : img)
                            );
                          } catch (err) {
                            setUploadError(err instanceof Error ? err.message : 'Image upload failed');
                          } finally {
                            setUploading(`intro-img-${sectionIndex}-${idx}`, false);
                          }
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
                {image.url && <img src={image.url} alt="Conclusion image" className="w-32 h-20 object-cover rounded-lg border border-slate-200" />}
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploadingStates[`conclusion-img-${sectionIndex}`]}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploading(`conclusion-img-${sectionIndex}`, true);
                    try {
                      const url = await uploadFile(file);
                      updateContentField(sectionIndex, 'image', { url, alt: image.alt });
                    } catch (err) {
                      setUploadError(err instanceof Error ? err.message : 'Image upload failed');
                    } finally {
                      setUploading(`conclusion-img-${sectionIndex}`, false);
                    }
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
        const items: CardItem[] = Array.isArray(section.content.items)
          ? section.content.items.map(normalizeCardItem).filter((c): c is CardItem => c !== null)
          : [];
        const description = typeof section.content.description === 'string' ? section.content.description : '';

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
              <div key={card.id ?? `new-${idx}`} className="border border-slate-300 rounded-lg p-4 space-y-3 bg-white">
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
        const items: StatItem[] = Array.isArray(section.content.items)
          ? section.content.items.map(normalizeStatItem).filter((s): s is StatItem => s !== null)
          : [];

        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-700">Statistics</Label>
            {items.map((stat, idx) => (
              <div key={stat.id ?? `new-${idx}`} className="border border-slate-300 rounded-lg p-4 space-y-3 bg-white">
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
        const courses: CourseItem[] = Array.isArray(section.content.courses)
          ? section.content.courses.map(normalizeCourseItem).filter((c): c is CourseItem => c !== null)
          : [];

        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium text-slate-700">Courses</Label>
            {courses.map((course, courseIdx) => (
              <div key={course.id ?? `new-${courseIdx}`} className="border border-slate-300 rounded-lg p-4 space-y-4 bg-white">
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
                    <div key={uni.id ?? `new-uni-${uniIdx}`} className="flex gap-2 items-start">
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
                        [...getUniversities(course), { name: '', students: 0 }]
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
                onValueChange={(value) => updateSection(index, 'content_type', value as ContentType)}
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
            <p>No sections added yet. Use the dropdown above to add sections.</p>
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

import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../ui/select';
import { Plus, X, Layers } from 'lucide-react';
import { SectionKeyType, ContentType, CardItem, StatItem, CourseItem, ImageItem } from '../../../types/program';

export interface ProgramSectionData {
  id?: string;
  section_key: SectionKeyType;
  content_type: ContentType;
  title: string;
  preamble: string;
  content: Record<string, unknown>;
}

interface ProgramSectionsProps {
  sections: ProgramSectionData[];
  addSection: (key: SectionKeyType) => void;
  removeSection: (index: number) => void;
  updateSection: (index: number, field: 'title' | 'content_type' | 'preamble', value: string) => void;
  updateContentField: (sectionIndex: number, field: string, value: unknown) => void;
  addArrayItem: (sectionIndex: number, arrayKey: string, newItem: CardItem | StatItem | CourseItem | ImageItem) => void;
  removeArrayItem: (sectionIndex: number, arrayKey: string, itemIndex: number) => void;
  updateArrayItem: (
    sectionIndex: number,
    arrayKey: string,
    itemIndex: number,
    field: string,
    value: unknown
  ) => void;
}
function isImageObject(val: unknown): val is { url?: string; alt?: string } {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}
const ALL_SECTION_KEYS: SectionKeyType[] = [
  'introduction',
  'about',
  'modules',
  'approaches',
  'impact',
  'strategic_alignment',
  'conclusion',
  'header',
  'course_enrollment',
  'program_delivery',
  'intervention',
  'video',
];

const formatSectionKey = (key: string): string =>
  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ProgramSections = ({
  sections,
  addSection,
  removeSection,
  updateSection,
  updateContentField,
  addArrayItem,
  removeArrayItem,
  updateArrayItem,
}: ProgramSectionsProps) => {
  const availableSectionKeys = ALL_SECTION_KEYS.filter(
    (key) => !sections.some((s) => s.section_key === key)
  );

  const renderContentForm = (section: ProgramSectionData, sectionIndex: number) => {
    const contentType = section.content_type;

    switch (contentType) {
      case 'text': {
        const textContent = typeof section.content.text === 'string' ? section.content.text : '';
        const rawImages = Array.isArray(section.content.images) ? section.content.images as ImageItem[] : [];
        const rawImage = isImageObject(section.content.image)
          ? section.content.image
          : undefined;
        const image = { url: rawImage?.url || '', alt: rawImage?.alt || '' };

        const isVideo = section.section_key === 'video';
        const isIntroduction = section.section_key === 'introduction';
        const isConclusion = section.section_key === 'conclusion';

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                {isVideo ? 'Video URLs (comma-separated)' : 'Text Content'}
              </Label>
              <Textarea
                value={textContent}
                onChange={(e) => updateContentField(sectionIndex, 'text', e.target.value)}
                placeholder={isVideo ? 'https://video1.mp4, https://video2.mp4' : 'Enter text content...'}
                className="border-slate-200 resize-none"
                rows={6}
              />
            </div>

            {!isVideo && isIntroduction && (
              <div className="space-y-3">
                <Label className="text-sm font-medium text-slate-700">Images (Multiple)</Label>
                {rawImages.map((img, idx) => (
                  <div key={img.id ?? `new-${idx}`} className="flex gap-2">
                    <Input
                      value={img.url}
                      onChange={(e) => {
                        const newImages = [...rawImages];
                        newImages[idx] = { ...newImages[idx], url: e.target.value };
                        updateContentField(sectionIndex, 'images', newImages);
                      }}
                      placeholder="Image URL"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newImages = rawImages.filter((_, i) => i !== idx);
                        updateContentField(sectionIndex, 'images', newImages);
                      }}
                      className="hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateContentField(sectionIndex, 'images', [...rawImages, { url: '' }])}
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
                <Input
                  value={image.url}
                  onChange={(e) => updateContentField(sectionIndex, 'image', { url: e.target.value, alt: image.alt })}
                  placeholder="Image URL"
                />
                <Input
                  value={image.alt}
                  onChange={(e) => updateContentField(sectionIndex, 'image', { url: image.url, alt: e.target.value })}
                  placeholder="Image alt text"
                />
              </div>
            )}
          </div>
        );
      }

      case 'cards': {
        const items = Array.isArray(section.content.items) ? section.content.items as CardItem[] : [];
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
        const items = Array.isArray(section.content.items) ? section.content.items as StatItem[] : [];

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
        const courses = Array.isArray(section.content.courses) ? section.content.courses as CourseItem[] : [];

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
                  onChange={(e) => updateArrayItem(sectionIndex, 'courses', courseIdx, 'total', parseInt(e.target.value) || 0)}
                  placeholder="Total students"
                />

                <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                  <Label className="text-xs font-medium text-slate-600">Universities</Label>
                  {(Array.isArray(course.universities) ? course.universities : []).map((uni, uniIdx) => (
                    <div key={uni.id ?? `new-uni-${uniIdx}`} className="flex gap-2 items-start">
                      <Input
                        value={uni.name}
                        onChange={(e) => {
                          const newUniversities = [...(Array.isArray(course.universities) ? course.universities : [])];
                          newUniversities[uniIdx] = { ...uni, name: e.target.value };
                          updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities', newUniversities);
                        }}
                        placeholder="University name"
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        value={uni.students}
                        onChange={(e) => {
                          const newUniversities = [...(Array.isArray(course.universities) ? course.universities : [])];
                          newUniversities[uniIdx] = { ...uni, students: parseInt(e.target.value) || 0 };
                          updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities', newUniversities);
                        }}
                        placeholder="Students"
                        className="w-24"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newUniversities = (Array.isArray(course.universities) ? course.universities : []).filter((_, i) => i !== uniIdx);
                          updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities', newUniversities);
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
                      const newUniversities = [...(course.universities || []), { name: '', students: 0 }];
                      updateArrayItem(sectionIndex, 'courses', courseIdx, 'universities', newUniversities);
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
      </CardContent>
    </Card>
  );
};

export default ProgramSections;

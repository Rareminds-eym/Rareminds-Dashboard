import { useState } from 'react';
import { Program } from '../../../types/program';
import { Button } from '../../ui/button';
import { Card, CardContent } from '../../ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Edit, Trash2, Eye, Search, Calendar, MapPin, ImageIcon, TrendingUp } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

// ─── Type Guard Interfaces ────────────────────────────────────────────────────
interface SectionImageItem { id?: string; url: string; }
interface SectionCardItem { id?: string; title?: string; description?: string; }
interface SectionStatItem { id?: string; label?: string; value?: string; }
interface SectionUniversityItem { id?: string; name?: string; students?: number; }
interface SectionCourseItem {
  id?: string; title?: string; name?: string; total?: number;
  universities?: SectionUniversityItem[]; description?: string;
}

interface PostedPostsSectionProps {
  programs: Program[];
  onEditProgram: (program: Program) => void;
  onDeleteProgram: (programId: string) => void;
}
const isAllowedVideoUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return true;
  } catch {
    return false;
  }
};

const PostedPostsSection = ({ programs, onEditProgram, onDeleteProgram }: PostedPostsSectionProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState<Program | null>(null);
  const { toast } = useToast();

  // ─── Type Guards (component-specific) ──────────────────────────────────────
  const isPlainObject = (val: unknown): val is Record<string, unknown> =>
    val !== null && typeof val === 'object' && !Array.isArray(val);
  const isImageItem = (val: unknown): val is SectionImageItem =>
    isPlainObject(val) && typeof val.url === 'string';
  const isCardItem = (val: unknown): val is SectionCardItem =>
    isPlainObject(val) &&
    (val.title === undefined || typeof val.title === 'string') &&
    (val.description === undefined || typeof val.description === 'string');
  const isStatItem = (val: unknown): val is SectionStatItem =>
    isPlainObject(val) &&
    (val.label === undefined || typeof val.label === 'string') &&
    (val.value === undefined || typeof val.value === 'string');
  const isUniversityItem = (val: unknown): val is SectionUniversityItem =>
    isPlainObject(val) &&
    (val.id === undefined || typeof val.id === 'string') &&
    (val.name === undefined || typeof val.name === 'string') &&
    (val.students === undefined || typeof val.students === 'number');
  const isCourseItem = (val: unknown): val is SectionCourseItem => {
    if (!isPlainObject(val)) return false;
    if ('universities' in val) {
      if (!Array.isArray(val['universities'])) return false;
      if (!val['universities'].every(isUniversityItem)) return false;
    }
    return true;
  };

  // Get all unique statuses from programs
  const allStatuses = [...programs.reduce<Set<string>>((set, p) => {
    if (typeof p.status === 'string' && p.status.length > 0) set.add(p.status);
    return set;
  }, new Set<string>())];

  const filteredPosts = programs.filter(program => {
    const matchesSearch =
      program.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.short_description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || program.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeletePost = (programId: string, programTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${programTitle}"? This action cannot be undone.`)) {
      onDeleteProgram(programId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800';
      case 'completed': return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-300 dark:border-blue-800';
      case 'in progress': return 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800';
      default: return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const formatSectionKey = (key: string) =>
    key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const safeFormatDate = (dateStr: string): string => {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
  };
  return (
    <div className="space-y-8 p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 min-h-screen">
      {/* Header Section */}
      <div className="relative">
        <div className="absolute inset-0 rounded-xl blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Published Programs
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Manage your published programs • {filteredPosts.length} of {programs.length} programs
              </p>
            </div>
          </div>
          <Card className="border-0 shadow- bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-blue-500" />
                  <Input
                    placeholder="Search programs by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-full md:w-56 h-12 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200 dark:border-slate-700 shadow-2xl">
                    <SelectItem value="all" className="rounded-lg">All Statuses</SelectItem>
                    {allStatuses.map((status) => (
                      <SelectItem key={status} value={status} className="rounded-lg">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Programs Grid */}
      {filteredPosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 mt-16 lg:grid-cols-3 gap-6">
          {filteredPosts.map((program) => (
            <Card key={program.id} className="group hover:shadow-xl transition-all duration-500 border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg overflow-hidden rounded-2xl">
              <div className="relative overflow-hidden">
                {program.image_url ? (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={program.image_url}
                      alt={program.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                    <div className="text-slate-400 dark:text-slate-500">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  </div>
                )}

                {/* Floating Action Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditProgram(program)}
                    className="h-9 w-9 p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white dark:hover:bg-slate-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeletePost(program.id, program.title)}
                    className="h-9 w-9 p-0 bg-red-500/90 hover:bg-red-600 border-0 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <CardContent className="p-6 space-y-4">
                {/* Meta Information */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-2">
                    {program.program_type && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 rounded-full px-3 py-1">
                        {program.program_type}
                      </Badge>
                    )}
                    {program.status && (
                      <Badge variant="secondary" className={`rounded-full px-3 py-1 ${getStatusColor(program.status)}`}>
                        {program.status}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    {program.location && (
                      <span className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3 mr-1" />
                        {program.location}
                      </span>
                    )}
                    {program.date && (
                      <span className="flex items-center bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-full">
                        <Calendar className="w-3 h-3 mr-1" />
                        {safeFormatDate(program.date)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-lg leading-tight line-clamp-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {program.title}
                </h3>

                {/* Short Description */}
                {program.short_description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {program.short_description}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-9 bg-white/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl transition-all duration-300 group/btn"
                        onClick={() => setSelectedPost(program)}
                      >
                        <Eye className="w-4 h-4 mr-2 group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors" />
                        <span className="group-hover/btn:text-blue-600 dark:group-hover/btn:text-blue-400 transition-colors">View</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl">
                      <DialogHeader className="space-y-4 pb-6 border-b border-slate-200 dark:border-slate-700">
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                          {selectedPost?.title}
                        </DialogTitle>
                        <DialogDescription className="flex items-center gap-4 text-sm flex-wrap">
                          {selectedPost?.program_type && (
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/50 dark:to-purple-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 rounded-full">
                              {selectedPost.program_type}
                            </Badge>
                          )}
                          {selectedPost?.status && (
                            <Badge variant="secondary" className={`rounded-full ${getStatusColor(selectedPost.status)}`}>
                              {selectedPost.status}
                            </Badge>
                          )}
                          {selectedPost?.location && (
                            <span className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                              <MapPin className="w-3 h-3 mr-1" />
                              {selectedPost.location}
                            </span>
                          )}
                          {selectedPost?.date && (
                            <span className="flex items-center text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">
                              <Calendar className="w-3 h-3 mr-1" />
                              {safeFormatDate(selectedPost.date)}
                            </span>
                          )}
                        </DialogDescription>
                      </DialogHeader>

                      {selectedPost && (
                        <div className="space-y-8 py-6">
                          {selectedPost.banner_url?.desktop && (
                            <div className="relative overflow-hidden rounded-xl">
                              <img
                                src={selectedPost.banner_url.desktop}
                                alt={`${selectedPost.title} desktop banner`}
                                className="w-full max-h-96 object-cover"
                              />
                              <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">Desktop</span>
                            </div>
                          )}
                          {selectedPost.banner_url?.mobile && (
                            <div className="relative overflow-hidden rounded-xl">
                              <img
                                src={selectedPost.banner_url.mobile}
                                alt={`${selectedPost.title} mobile banner`}
                                className="w-full max-h-96 object-cover"
                              />
                              <span className="absolute top-2 left-2 text-xs bg-black/50 text-white px-2 py-1 rounded">Mobile</span>
                            </div>
                          )}
                          {selectedPost.short_description && (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-base">
                              {selectedPost.short_description}
                            </p>
                          )}

                          {/* Program Metadata */}
                          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                            <h4 className="font-semibold mb-4 text-slate-900 dark:text-white">Program Information</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Slug:</span>
                                <span className="text-blue-600 dark:text-blue-400 font-mono bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
                                  /programs/{selectedPost.slug}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Display Order:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedPost.display_order}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Active:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {selectedPost.is_active ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="font-medium text-slate-700 dark:text-slate-300">Created:</span>
                                <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {new Date(selectedPost.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {selectedPost.hero_title && (
                                <div className="flex flex-col gap-1 col-span-2">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Hero Title:</span>
                                  <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {selectedPost.hero_title}
                                  </span>
                                </div>
                              )}
                              {selectedPost.hero_description && (
                                <div className="flex flex-col gap-1 col-span-2">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">Hero Description:</span>
                                  <span className="text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
                                    {selectedPost.hero_description}
                                  </span>
                                </div>
                              )}

                            </div>
                          </div>

                          {/* Program Sections */}
                          {selectedPost.sections && selectedPost.sections.length > 0 && (
                            <div className="space-y-4">
                              <h4 className="font-semibold text-slate-900 dark:text-white">Sections</h4>
                              {[...selectedPost.sections]
                                .sort((a, b) => a.display_order - b.display_order)
                                .map((section) => (
                                  <div
                                    key={section.id}
                                    className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800"
                                  >
                                    <div className="flex items-center gap-2 mb-3">
                                      <Badge variant="outline" className="text-xs">
                                        {formatSectionKey(section.section_key)}
                                      </Badge>
                                    </div>
                                    {section.title && (
                                      <h5 className="font-semibold mb-2 text-slate-900 dark:text-white">
                                        {section.title}
                                      </h5>
                                    )}
                                    {section.preamble && (
                                      <p className="text-sm text-slate-600 dark:text-slate-400 italic mb-2">
                                        {section.preamble}
                                      </p>
                                    )}
                                    {section.content && (
                                      <div className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                        {/* Render based on content_type or section_key */}
                                        {section.section_key === 'video' && typeof section.content?.text === 'string' && section.content.text && (
                                          <div className="space-y-4">
                                            {(() => {
                                              const videoText = section.content.text;
                                              return videoText
                                                .split(',')
                                                .map((v) => v.trim())
                                                .filter((v) => isAllowedVideoUrl(v.trim()))
                                                .map((cleanUrl, idx) => (
                                                  <div key={idx} className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                                                    <video
                                                      controls
                                                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                                                      src={String(cleanUrl)}
                                                    >
                                                      Your browser does not support the video tag.
                                                    </video>
                                                  </div>
                                                ));
                                            })()}
                                          </div>
                                        )}
                                        {section.content_type === 'text' && section.section_key !== 'video' && (() => {
                                          const sectionText = typeof section.content?.text === 'string'
                                            ? section.content.text
                                            : null;

                                          return (
                                            <>
                                              {sectionText && (
                                                // Safe: React escapes all text interpolation automatically.
                                                // No dangerouslySetInnerHTML used — raw HTML never executes
                                                <p className="whitespace-pre-wrap mb-4">{sectionText}</p>
                                              )}
                                              {/* images array */}
                                              {Array.isArray(section.content?.images) && section.content.images.length > 0 && (
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                                                  {section.content.images.filter(isImageItem).map((img, idx) => (
                                                    <img key={img.id ?? `img-${idx}`} src={img.url}
                                                      alt={`${section.title || 'Section'} image ${idx + 1}`}
                                                      className="w-full h-48 object-cover rounded-lg"
                                                    />
                                                  ))}
                                                </div>
                                              )}
                                              {/* single image */}
                                              {isImageItem(section.content?.image) && (
                                                <div className="mt-4">
                                                  <img src={section.content.image.url}
                                                    alt={section.title || 'Section image'}
                                                    className="w-full max-w-2xl h-64 object-cover rounded-lg mx-auto"
                                                  />
                                                </div>
                                              )}
                                            </>
                                          );
                                        })()}
                                        {section.content_type === 'cards' && Array.isArray(section.content?.items) && (() => {
                                          const items = section.content.items.filter(isCardItem);
                                          return (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                              {items.map((item, idx) => (
                                                <div key={item.id ?? `card-${idx}`} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                  {item.title && <h6 className="font-semibold mb-1">{item.title}</h6>}
                                                  {item.description && <p className="text-sm">{item.description}</p>}
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                        {section.content_type === 'stats' && Array.isArray(section.content?.items) && (() => {
                                          const items = section.content.items.filter(isStatItem);
                                          return (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                              {items.map((item, idx) => (
                                                <div key={item.id ?? `stat-${idx}`} className="text-center p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                                  {item.value && <div className="text-2xl font-bold text-purple-600">{item.value}</div>}
                                                  {item.label && <div className="text-sm text-slate-600 dark:text-slate-400">{item.label}</div>}
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                        {section.content_type === 'courses' && Array.isArray(section.content?.courses) && (() => {
                                          const courses = section.content.courses.filter(isCourseItem);
                                          return (
                                            <div className="space-y-6 mt-4">
                                              {courses.map((course, idx) => (
                                                <div key={course.id ?? `course-${idx}`} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                                                  <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 flex items-center justify-between">
                                                    <h6 className="font-semibold text-slate-900 dark:text-white">
                                                      {course.title || course.name}
                                                    </h6>
                                                    {course.total && (
                                                      <span className="text-sm font-bold text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-3 py-1 rounded-full">
                                                        {course.total.toLocaleString()} students
                                                      </span>
                                                    )}
                                                  </div>
                                                  {Array.isArray(course.universities) && course.universities.length > 0 && (() => {
                                                    const universities = course.universities.filter(isUniversityItem);
                                                    if (universities.length === 0) return null;
                                                    return (
                                                      <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {universities.map((uni, uIdx) => (
                                                          <div key={uni.id ?? `uni-${uIdx}`} className="flex items-center justify-between px-4 py-2">
                                                            <span className="text-sm text-slate-700 dark:text-slate-300">{uni.name}</span>
                                                            {uni.students && (
                                                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                                                                {uni.students.toLocaleString()}
                                                              </span>
                                                            )}
                                                          </div>
                                                        ))}
                                                      </div>
                                                    );
                                                  })()}
                                                  {course.description && (
                                                    <p className="text-sm px-4 py-2">{course.description}</p>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}

                          <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <Button
                              onClick={() => onEditProgram(selectedPost)}
                              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Program
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => handleDeletePost(selectedPost.id, selectedPost.title)}
                              className="h-11 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditProgram(program)}
                    className="h-9 w-9 p-0 bg-white/50 dark:bg-slate-800/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border-slate-200 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-600 rounded-xl transition-all duration-300 group/edit"
                  >
                    <Edit className="w-4 h-4 group-hover/edit:text-orange-600 dark:group-hover/edit:text-orange-400 transition-colors" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg rounded-2xl overflow-hidden">
          <CardContent className="text-center py-16 px-8">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-full blur-3xl opacity-50 w-24 h-24 mx-auto" />
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl w-24 h-24 mx-auto mb-6 shadow-lg">
                <Search className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">No Programs Found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto leading-relaxed">
              {programs.length === 0
                ? "You haven't created any programs yet. Start by creating your first program!"
                : "No programs match your current filters. Try adjusting your search criteria."}
            </p>
            {searchTerm || filterStatus !== 'all' ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
                className="bg-white/50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 rounded-xl px-6 py-2 transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Clear Filters
              </Button>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PostedPostsSection;

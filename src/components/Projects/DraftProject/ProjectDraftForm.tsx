import React, { useState } from 'react';
import { Edit3, FileText, Save } from 'lucide-react';
import { ProjectDraft, ProjectSEOSettings } from '../../../types/project';
import { ProjectFormProps } from '../shared/ProjectFormTypes';
import { useToast } from '../../../hooks/use-toast';
import { useProjectDrafts } from '../../../hooks/useProjectDrafts';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Separator } from '../../ui/separator';
import { commonProjectTags } from '../shared/ProjectFormTypes';

interface ProjectDraftFormProps extends ProjectFormProps {
  onDraftSaved?: (draft: ProjectDraft) => void;
}

const ProjectDraftForm: React.FC<ProjectDraftFormProps> = ({ 
  onPostSaved, 
  editingPost, 
  onDraftSaved 
}) => {
  const { toast } = useToast();
  const { saveDraft, updateDraft } = useProjectDrafts();
  
  // Form state
  const [title, setTitle] = useState(editingPost?.title || '');
  const [featuredImage, setFeaturedImage] = useState(
    editingPost && 'featured_image' in editingPost ? editingPost.featured_image || '' : ''
  );
  const [conclusion, setConclusion] = useState(
    editingPost && 'conclusion' in editingPost ? editingPost.conclusion || '' : ''
  );
  const [projectTags, setProjectTags] = useState<string[]>(
    editingPost && 'project_tags' in editingPost ? editingPost.project_tags || [] : []
  );
  const [videoUrls, setVideoUrls] = useState<string[]>(
    editingPost && 'video_url' in editingPost ? editingPost.video_url || [] : ['']
  );
  const [content, setContent] = useState(''); // Simplified content for draft
  const [tagInput, setTagInput] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  
  // SEO state
  const [metaTitle, setMetaTitle] = useState(
    editingPost && 'meta_title' in editingPost ? editingPost.meta_title || '' : ''
  );
  const [metaDescription, setMetaDescription] = useState(
    editingPost && 'meta_description' in editingPost ? editingPost.meta_description || '' : ''
  );
  const [slug, setSlug] = useState(
    editingPost && 'slug' in editingPost ? editingPost.slug || '' : ''
  );

  const validateForm = () => {
    return title.trim() !== '';
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !projectTags.includes(trimmedTag)) {
      setProjectTags([...projectTags, trimmedTag]);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setProjectTags(projectTags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  const addVideoUrl = () => {
    setVideoUrls([...videoUrls, '']);
  };

  const updateVideoUrl = (index: number, url: string) => {
    const newUrls = [...videoUrls];
    newUrls[index] = url;
    setVideoUrls(newUrls);
  };

  const removeVideoUrl = (index: number) => {
    setVideoUrls(videoUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowValidation(true);
    
    if (!validateForm()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields to save the draft.",
        variant: "destructive"
      });
      return;
    }

    const draftData: Partial<ProjectDraft> = {
      title,
      featured_image: featuredImage || undefined,
      conclusion: conclusion || undefined,
      project_tags: projectTags,
      video_url: videoUrls.filter(url => url.trim() !== ''),
      content_json: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: content }] }] },
      meta_title: metaTitle || undefined,
      meta_description: metaDescription || undefined,
      slug: slug || undefined,
    };

    try {
      let savedDraft: ProjectDraft | null = null;
      
      if (editingPost && 'id' in editingPost) {
        // Update existing draft
        savedDraft = await updateDraft(editingPost.id, draftData);
      } else {
        // Create new draft
        savedDraft = await saveDraft(draftData);
      }

      if (savedDraft) {
        if (onDraftSaved) {
          onDraftSaved(savedDraft);
        }
        
        if (!editingPost) {
          // Reset form for new draft
          setTitle('');
          setFeaturedImage('');
          setConclusion('');
          setProjectTags([]);
          setVideoUrls(['']);
          setContent('');
          setMetaTitle('');
          setMetaDescription('');
          setSlug('');
        }

        toast({
          title: editingPost ? "Draft Updated" : "Draft Saved",
          description: editingPost 
            ? "Your project draft has been updated successfully." 
            : "Your project draft has been saved successfully.",
        });
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save the draft. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl shadow-sm">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {editingPost ? 'Edit Project Draft' : 'Create Project Draft'}
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                {editingPost 
                  ? 'Continue working on your draft' 
                  : 'Save your work as a draft to continue later'
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="xl:col-span-2 space-y-8">
              {/* Basic Information */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Edit3 className="w-5 h-5" />
                    Project Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="title" className="flex items-center gap-2">
                      Title <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter project title..."
                      className={showValidation && !title.trim() ? 'border-red-500' : ''}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="featured_image">Featured Image URL</Label>
                    <Input
                      id="featured_image"
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content Notes</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Add some notes about your project..."
                      rows={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="conclusion">Conclusion</Label>
                    <Textarea
                      id="conclusion"
                      value={conclusion}
                      onChange={(e) => setConclusion(e.target.value)}
                      placeholder="Project conclusion or summary..."
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Video URLs */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>Video URLs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {videoUrls.map((url, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={url}
                        onChange={(e) => updateVideoUrl(index, e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                      />
                      {videoUrls.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeVideoUrl(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addVideoUrl}
                    className="w-full"
                  >
                    Add Video URL
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Project Tags */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>Project Tags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder="Add tags..."
                    />
                  </div>
                  
                  {/* Current Tags */}
                  {projectTags.length > 0 && (
                    <div className="space-y-2">
                      <Label>Current Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {projectTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="cursor-pointer hover:bg-red-100"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Separator />

                  {/* Suggested Tags */}
                  <div className="space-y-2">
                    <Label>Suggested Tags:</Label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {commonProjectTags
                        .filter(tag => !projectTags.includes(tag))
                        .map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="cursor-pointer hover:bg-orange-50"
                            onClick={() => addTag(tag)}
                          >
                            {tag} +
                          </Badge>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Settings */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardHeader>
                  <CardTitle>SEO Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta Title</Label>
                    <Input
                      id="meta_title"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="SEO optimized title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta Description</Label>
                    <Textarea
                      id="meta_description"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="Brief description for search engines..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="url-friendly-slug"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/50">
                <CardContent className="pt-6">
                  <Button
                    type="submit"
                    className="w-full bg-orange-500 hover:bg-orange-600"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Update Draft' : 'Save Draft'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectDraftForm;

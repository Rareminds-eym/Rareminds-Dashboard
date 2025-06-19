import React from 'react';
import { EditorContent } from '@tiptap/react';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Upload, Bold, Italic, List, Link2, Heading1, Heading2, Heading3, Image as ImageIcon, X, Hash, Globe } from 'lucide-react';
import { useBlogForm } from './useBlogForm';

interface BlogFormLayoutProps {
  formHook: ReturnType<typeof useBlogForm>;
  onSubmit: (e: React.FormEvent) => void;
  submitButtonText: string;
  submitButtonIcon: React.ReactNode;
  showDraftButton?: boolean;
  isEditing?: boolean;
}

export const BlogFormLayout: React.FC<BlogFormLayoutProps> = ({
  formHook,
  onSubmit,
  submitButtonText,
  submitButtonIcon,
  showDraftButton = true,
  isEditing = false
}) => {
  const {
    title, setTitle,
    featuredImage, setFeaturedImage,
    altImage, setAltImage,
    category, setCategory,
    subcategory, setSubcategory,
    tags,
    tagInput, setTagInput,
    seo, setSeo,
    lastSaved,
    validationErrors,
    showValidation,
    fileInputRef,
    editor,
    handleImageUpload,
    insertImage,
    addTag,
    removeTag,
    handleTagKeyDown,
    handleSaveAsDraft,
    handleManualSave,
    categories,
    subcategories
  } = formHook;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <form onSubmit={onSubmit} className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content - Takes 3 columns */}
          <div className="xl:col-span-3 space-y-6">
            {/* Post Content Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <CardTitle className="flex items-center gap-2 text-slate-800">
                    Post Content
                    {lastSaved && (
                      <span className="text-sm text-green-600 font-normal">
                        Last saved: {lastSaved.toLocaleTimeString()}
                      </span>
                    )}
                  </CardTitle>
                  <div className="flex gap-3">
                    {showDraftButton && (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleManualSave}
                          className="h-11 px-6 border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700 transition-all duration-200"
                        >
                          Quick Save
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleSaveAsDraft}
                          className="h-11 px-6 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                        >
                          Save as Draft
                        </Button>
                      </>
                    )}
                    <Button 
                      type="submit"
                      className="h-11 px-6 bg-black shadow-xl shadow-black/10 hover:shadow-md transition-all duration-200"
                    >
                      {submitButtonIcon}
                      {submitButtonText}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title Input */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your post title..."
                    className={`h-12 text-lg transition-all duration-200 ${
                      showValidation && validationErrors.title
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                    required
                  />
                  {showValidation && validationErrors.title && (
                    <p className="text-sm text-red-500">Title is required</p>
                  )}
                </div>

                {/* Featured Image */}
                <div className="space-y-3">
                  <Label htmlFor="featured-image" className="text-sm font-medium text-slate-700">
                    Featured Image *
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        value={featuredImage}
                        onChange={(e) => setFeaturedImage(e.target.value)}
                        placeholder="Image URL or upload a file..."
                        className={`flex-1 transition-all duration-200 ${
                          showValidation && validationErrors.featuredImage
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                        }`}
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-10 px-4 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <input
                      ref={fileInputRef}
                      name="featuredImage"
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {showValidation && validationErrors.featuredImage && (
                      <p className="text-sm text-red-500">Featured image is required</p>
                    )}
                    {featuredImage && (
                      <div className="relative group">
                        <img
                          src={featuredImage}
                          alt={altImage || "Featured preview"}
                          className="w-full max-w-lg h-48 object-cover rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-300" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Alt Text for Image */}
                <div className="space-y-3">
                  <Label htmlFor="alt-image" className="text-sm font-medium text-slate-700">
                    Image Alt Text *
                  </Label>
                  <Input
                    id="alt-image"
                    value={altImage}
                    onChange={(e) => setAltImage(e.target.value)}
                    placeholder="Describe the image for accessibility..."
                    className={`transition-all duration-200 ${
                      showValidation && validationErrors.altImage
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                    required
                  />
                  {showValidation && validationErrors.altImage && (
                    <p className="text-sm text-red-500">Image alt text is required</p>
                  )}
                  <p className="text-xs text-slate-500">
                    Provide a clear description of the image for screen readers and SEO.
                  </p>
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="content" className="text-sm font-medium text-slate-700">
                      Content *
                    </Label>
                    <div className="flex gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200">
                      {[
                        { icon: Bold, action: () => editor?.chain().focus().toggleBold().run(), isActive: editor?.isActive('bold'), title: 'Bold' },
                        { icon: Italic, action: () => editor?.chain().focus().toggleItalic().run(), isActive: editor?.isActive('italic'), title: 'Italic' },
                        { icon: Heading1, action: () => editor?.chain().focus().toggleHeading({ level: 1 }).run(), isActive: editor?.isActive('heading', { level: 1 }), title: 'H1' },
                        { icon: Heading2, action: () => editor?.chain().focus().toggleHeading({ level: 2 }).run(), isActive: editor?.isActive('heading', { level: 2 }), title: 'H2' },
                        { icon: List, action: () => editor?.chain().focus().toggleBulletList().run(), isActive: editor?.isActive('bulletList'), title: 'List' },
                        { 
                          icon: Link2, 
                          action: () => {
                            const url = window.prompt('Enter URL:');
                            if (url) editor?.chain().focus().setLink({ href: url }).run();
                          }, 
                          isActive: editor?.isActive('link'), 
                          title: 'Link' 
                        },
                        { icon: ImageIcon, action: insertImage, isActive: false, title: 'Image' }
                      ].map(({ icon: Icon, action, isActive, title }) => (
                        <Button
                          key={title}
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={action}
                          className={`h-8 w-8 p-0 transition-all duration-200 ${
                            isActive 
                              ? 'bg-blue-100 text-blue-600 shadow-sm' 
                              : 'hover:bg-white hover:shadow-sm text-slate-600'
                          }`}
                          title={title}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className={`border rounded-xl min-h-[400px] prose prose-sm max-w-none p-6 bg-white transition-all duration-200 ${
                    showValidation && validationErrors.content
                      ? 'border-red-500 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'
                      : 'border-slate-200 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100'
                  }`}>
                    <EditorContent editor={editor} />
                  </div>
                  {showValidation && validationErrors.content && (
                    <p className="text-sm text-red-500">Content is required</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Post Settings */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Hash className="w-4 h-4 text-green-500" />
                  Post Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category *
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className={`transition-all duration-200 ${
                      showValidation && validationErrors.category
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="hover:bg-slate-50">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && validationErrors.category && (
                    <p className="text-sm text-red-500">Category is required</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory" className="text-sm font-medium text-slate-700">
                    Subcategory *
                  </Label>
                  <Select 
                    value={subcategory} 
                    onValueChange={(value) => {
                      console.log('🎯 Subcategory Select Debug:', {
                        category,
                        currentSubcategory: subcategory,
                        newValue: value,
                        availableSubcategories: subcategories[category] || []
                      });
                      setSubcategory(value);
                    }}
                  >
                    <SelectTrigger className={`transition-all duration-200 ${
                      showValidation && validationErrors.subcategory
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {(subcategories[category] || []).map((subcat) => (
                        <SelectItem key={subcat} value={subcat} className="hover:bg-slate-50">
                          {subcat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {showValidation && validationErrors.subcategory && (
                    <p className="text-sm text-red-500">Subcategory is required</p>
                  )}
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label htmlFor="tags" className="text-sm font-medium text-slate-700">
                    Tags *
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add tags..."
                        className={`flex-1 transition-all duration-200 ${
                          showValidation && validationErrors.tags
                            ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                            : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                        }`}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                        className="border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
                      >
                        Add
                      </Button>
                    </div>
                    
                    {showValidation && validationErrors.tags && (
                      <p className="text-sm text-red-500">At least one tag is required</p>
                    )}
                    
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-all duration-200"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-blue-500 hover:text-blue-700 transition-colors duration-200"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-slate-500">
                      Press Enter or comma to add tags
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Globe className="w-4 h-4 text-orange-500" />
                  SEO Settings
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Optimize your post for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="meta-title" className="text-sm font-medium text-slate-700">
                    Meta Title *
                  </Label>
                  <Input
                    id="meta-title"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="SEO title for search engines"
                    className={`transition-all duration-200 ${
                      showValidation && validationErrors.metaTitle
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {showValidation && validationErrors.metaTitle && (
                    <p className="text-sm text-red-500">Meta title is required</p>
                  )}
                  <p className={`text-xs transition-colors duration-200 ${
                    seo.metaTitle.length > 60 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {seo.metaTitle.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description" className="text-sm font-medium text-slate-700">
                    Meta Description *
                  </Label>
                  <Textarea
                    id="meta-description"
                    value={seo.metaDescription}
                    onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Brief description for search results"
                    className={`resize-none transition-all duration-200 ${
                      showValidation && validationErrors.metaDescription
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                    rows={3}
                  />
                  {showValidation && validationErrors.metaDescription && (
                    <p className="text-sm text-red-500">Meta description is required</p>
                  )}
                  <p className={`text-xs transition-colors duration-200 ${
                    seo.metaDescription.length > 160 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {seo.metaDescription.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                    URL Slug *
                  </Label>
                  <Input
                    id="slug"
                    value={seo.slug}
                    onChange={(e) => setSeo(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-friendly-slug"
                    className={`transition-all duration-200 ${
                      showValidation && validationErrors.slug
                        ? 'border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-100'
                        : 'border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
                    }`}
                  />
                  {showValidation && validationErrors.slug && (
                    <p className="text-sm text-red-500">URL slug is required</p>
                  )}
                  <p className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border">
                    URL: /blog/{seo.slug || 'your-post-slug'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
};

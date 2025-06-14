import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { BlogPost, SEOSettings } from '../../../types/blog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Save, Upload, Bold, Italic, List, Link2, Heading1, Heading2, Heading3, Image as ImageIcon, X, Eye, Edit3, Sparkles, Hash, Globe } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

interface NewPostSectionProps {
  onPostSaved: (post: BlogPost) => void;
  editingPost?: BlogPost | null;
}

const NewPostSection = ({ onPostSaved, editingPost }: NewPostSectionProps) => {
  const [title, setTitle] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [seo, setSeo] = useState<SEOSettings>({
    metaTitle: '',
    metaDescription: '',
    slug: ''
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your amazing content...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Content is automatically stored as HTML
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[350px] p-6 text-slate-700 leading-relaxed',
      },
    },
  });

  const categories = ['Government', 'School', 'Corporate', 'Institution'];
  
  const subcategories: Record<string, string[]> = {
    'Government': ['None'] ,
    'School': ['Teachers', 'Students'],
    'Corporate': ['Corporate', 'Training', ],
    'Institution': ['SDP', 'FDP']
  };

  useEffect(() => {
    if (editingPost && editor) {
      setTitle(editingPost.title);
      setFeaturedImage(editingPost.featuredImage || '');
      setCategory(editingPost.category);
      setSubcategory(editingPost.subcategory);
      setTags(editingPost.tags || []);
      setSeo(editingPost.seo);
      
      // Load content into editor
      editor.commands.setContent(editingPost.content);
    }
  }, [editingPost, editor]);

  useEffect(() => {
    if (title && !seo.metaTitle) {
      setSeo(prev => ({ ...prev, metaTitle: title }));
    }
    if (title && !seo.slug) {
      setSeo(prev => ({ ...prev, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
    }
  }, [title, seo.metaTitle, seo.slug]);

  useEffect(() => {
    // Reset subcategory when category changes
    setSubcategory('');
  }, [category]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFeaturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const generateExcerpt = (text: string): string => {
    const cleanText = text.replace(/[#*[]()]/g, '').replace(/\n+/g, ' ').trim();
    return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText;
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !editor?.getHTML() || !category) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in title, content, and category.",
        variant: "destructive"
      });
      return;
    }

    const post: BlogPost = {
      id: editingPost?.id || `post-${Date.now()}`,
      title,
      content: editor?.getHTML() || '', // HTML for display
      excerpt: generateExcerpt(editor?.getText() || ''),
      featuredImage: featuredImage || undefined,
      category,
      subcategory,
      tags,
      seo,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onPostSaved(post);
    
    if (!editingPost) {
      editor?.commands.clearContent();
      setTitle('');
      setFeaturedImage('');
      setCategory('');
      setSubcategory('');
      setTags([]);
      setTagInput('');
      setSeo({ metaTitle: '', metaDescription: '', slug: '' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section with improved styling */}
        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-xl shadow-sm">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {editingPost ? 'Edit Post' : 'Create New Post'}
                </h1>
              </div>
              <p className="text-slate-600 text-lg">
                {editingPost ? 'Update your existing blog post' : 'Write and publish your latest blog post'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="h-11 px-6 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
              >
                {isPreviewMode ? (
                  <>
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>
              <Button 
                onClick={handleSubmit}
                className="h-11 px-6 bg-black shadow-xl shadow-black/10 hover:shadow-md transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPost ? 'Update Post' : 'Save Post'}
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content - Takes 3 columns */}
          <div className="xl:col-span-3 space-y-6">
            {/* Post Content Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Post Content
                </CardTitle>
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
                    className="h-12 text-lg border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                    required
                  />
                </div>

                {/* Featured Image */}
                <div className="space-y-3">
                  <Label htmlFor="featured-image" className="text-sm font-medium text-slate-700">
                    Featured Image
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        value={featuredImage}
                        onChange={(e) => setFeaturedImage(e.target.value)}
                        placeholder="Image URL or upload a file..."
                        className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
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
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    {featuredImage && (
                      <div className="relative group">
                        <img
                          src={featuredImage}
                          alt="Featured preview"
                          className="w-full max-w-lg h-48 object-cover rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-all duration-300"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-xl transition-all duration-300" />
                      </div>
                    )}
                  </div>
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
                  
                  <div className="border border-slate-200 rounded-xl min-h-[400px] prose prose-sm max-w-none p-6 bg-white focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all duration-200">
                    <EditorContent editor={editor} />
                  </div>
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
                    <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subcategory" className="text-sm font-medium text-slate-700">
                    Subcategory
                  </Label>
                  <Select value={subcategory} onValueChange={setSubcategory}>
                    <SelectTrigger className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200">
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
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label htmlFor="tags" className="text-sm font-medium text-slate-700">
                    Tags
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add tags..."
                        className="flex-1 border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
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
                    Meta Title
                  </Label>
                  <Input
                    id="meta-title"
                    value={seo.metaTitle}
                    onChange={(e) => setSeo(prev => ({ ...prev, metaTitle: e.target.value }))}
                    placeholder="SEO title for search engines"
                    className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
                  <p className={`text-xs transition-colors duration-200 ${
                    seo.metaTitle.length > 60 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {seo.metaTitle.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description" className="text-sm font-medium text-slate-700">
                    Meta Description
                  </Label>
                  <Textarea
                    id="meta-description"
                    value={seo.metaDescription}
                    onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
                    placeholder="Brief description for search results"
                    className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none transition-all duration-200"
                    rows={3}
                  />
                  <p className={`text-xs transition-colors duration-200 ${
                    seo.metaDescription.length > 160 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {seo.metaDescription.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    value={seo.slug}
                    onChange={(e) => setSeo(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="url-friendly-slug"
                    className="border-slate-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200"
                  />
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

export default NewPostSection;

import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { BlogPost, SEOSettings } from '../types/blog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Save, Upload, Bold, Italic, List, Link2, Heading1, Heading2, Heading3, Image as ImageIcon, X } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

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
        placeholder: 'Write your post content here...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // Content is automatically stored as HTML
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[300px] p-4',
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">
            {editingPost ? 'Edit Post' : 'Create New Post'}
          </h2>
          <p className="text-muted-foreground mt-2">
            {editingPost ? 'Update your existing blog post' : 'Write and publish your latest blog post'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? 'Edit' : 'Preview'}
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="w-4 h-4 mr-2" />
            {editingPost ? 'Update Post' : 'Save Post'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter your post title..."
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="featured-image">Featured Image</Label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      value={featuredImage}
                      onChange={(e) => setFeaturedImage(e.target.value)}
                      placeholder="Image URL or upload a file..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
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
                    <div className="relative">
                      <img
                        src={featuredImage}
                        alt="Featured preview"
                        className="w-full max-w-md h-48 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="content">Content *</Label>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleBold().run()}
                      className={editor?.isActive('bold') ? 'bg-primary text-primary-foreground' : ''}
                      title="Bold"
                    >
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleItalic().run()}
                      className={editor?.isActive('italic') ? 'bg-primary text-primary-foreground' : ''}
                      title="Italic"
                    >
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
                      className={editor?.isActive('heading', { level: 1 }) ? 'bg-primary text-primary-foreground' : ''}
                      title="Heading 1"
                    >
                      <Heading1 className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
                      className={editor?.isActive('heading', { level: 2 }) ? 'bg-primary text-primary-foreground' : ''}
                      title="Heading 2"
                    >
                      <Heading2 className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => editor?.chain().focus().toggleBulletList().run()}
                      className={editor?.isActive('bulletList') ? 'bg-primary text-primary-foreground' : ''}
                      title="List"
                    >
                      <List className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = window.prompt('Enter URL:');
                        if (url) {
                          editor?.chain().focus().setLink({ href: url }).run();
                        }
                      }}
                      className={editor?.isActive('link') ? 'bg-primary text-primary-foreground' : ''}
                      title="Link"
                    >
                      <Link2 className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={insertImage}
                      title="Insert Image"
                    >
                      <ImageIcon className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-lg min-h-[300px] prose prose-sm max-w-none p-4">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Post Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <Select value={subcategory} onValueChange={setSubcategory} required>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select subcategory" />
                  </SelectTrigger>
                  <SelectContent>
                    {(subcategories[category] || []).map((subcat) => (
                      <SelectItem key={subcat} value={subcat}>
                        {subcat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder="Add tags (press Enter or comma to add)"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!tagInput.trim()}
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
                          className="flex items-center gap-1"
                        >
                          {tag}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-muted-foreground hover:text-foreground"
                            onClick={() => removeTag(tag)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Tags help categorize and make your posts discoverable
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
              <CardDescription>Optimize your post for search engines</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta-title">Meta Title</Label>
                <Input
                  id="meta-title"
                  value={seo.metaTitle}
                  onChange={(e) => setSeo(prev => ({ ...prev, metaTitle: e.target.value }))}
                  placeholder="SEO title for search engines"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seo.metaTitle.length}/60 characters
                </p>
              </div>

              <div>
                <Label htmlFor="meta-description">Meta Description</Label>
                <Textarea
                  id="meta-description"
                  value={seo.metaDescription}
                  onChange={(e) => setSeo(prev => ({ ...prev, metaDescription: e.target.value }))}
                  placeholder="Brief description for search results"
                  className="mt-1"
                  rows={3}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {seo.metaDescription.length}/160 characters
                </p>
              </div>

              <div>
                <Label htmlFor="slug">URL Slug</Label>
                <Input
                  id="slug"
                  value={seo.slug}
                  onChange={(e) => setSeo(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="url-friendly-slug"
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  URL: /blog/{seo.slug}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default NewPostSection;

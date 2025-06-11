
import { useState, useEffect, useRef } from 'react';
import { BlogPost, SEOSettings } from '../types/blog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Save, Upload, Image, Link2, Bold, Italic, Type, List } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface NewPostSectionProps {
  onPostSaved: (post: BlogPost) => void;
  editingPost?: BlogPost | null;
}

const NewPostSection = ({ onPostSaved, editingPost }: NewPostSectionProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [category, setCategory] = useState('');
  const [seo, setSeo] = useState<SEOSettings>({
    metaTitle: '',
    metaDescription: '',
    slug: ''
  });
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const categories = ['Tech', 'Travel', 'Lifestyle', 'Business', 'Health', 'Education', 'Food', 'Sports'];

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title);
      setContent(editingPost.content);
      setFeaturedImage(editingPost.featuredImage || '');
      setCategory(editingPost.category);
      setSeo(editingPost.seo);
    }
  }, [editingPost]);

  useEffect(() => {
    if (title && !seo.metaTitle) {
      setSeo(prev => ({ ...prev, metaTitle: title }));
    }
    if (title && !seo.slug) {
      setSeo(prev => ({ ...prev, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
    }
  }, [title, seo.metaTitle, seo.slug]);

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

  const insertFormatting = (format: string) => {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'h1':
        formattedText = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'h2':
        formattedText = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'h3':
        formattedText = `### ${selectedText || 'Heading 3'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'List item'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedText.length, start + formattedText.length);
    }, 0);
  };

  const generateExcerpt = (text: string): string => {
    const cleanText = text.replace(/[#*\[\]()]/g, '').replace(/\n+/g, ' ').trim();
    return cleanText.length > 150 ? cleanText.substring(0, 150) + '...' : cleanText;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !content || !category) {
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
      content,
      excerpt: generateExcerpt(content),
      featuredImage: featuredImage || undefined,
      category,
      seo,
      createdAt: editingPost?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onPostSaved(post);
    
    if (!editingPost) {
      setTitle('');
      setContent('');
      setFeaturedImage('');
      setCategory('');
      setSeo({ metaTitle: '', metaDescription: '', slug: '' });
    }

    toast({
      title: editingPost ? "Post Updated!" : "Post Created!",
      description: editingPost ? "Your post has been successfully updated." : "Your new post has been saved successfully.",
    });
  };

  const renderPreview = (text: string) => {
    return text
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\[([^\]]*)\]\(([^)]*)\)/gim, '<a href="$2" class="text-primary underline">$1</a>')
      .replace(/\n/gim, '<br>');
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
                      onClick={() => insertFormatting('bold')}
                      title="Bold"
                    >
                      <Bold className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('italic')}
                      title="Italic"
                    >
                      <Italic className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('h1')}
                      title="Heading 1"
                    >
                      H1
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('h2')}
                      title="Heading 2"
                    >
                      H2
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('list')}
                      title="List"
                    >
                      <List className="w-3 h-3" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertFormatting('link')}
                      title="Link"
                    >
                      <Link2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {isPreviewMode ? (
                  <div 
                    className="min-h-[300px] p-4 border rounded-lg prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
                  />
                ) : (
                  <Textarea
                    ref={contentRef}
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Write your post content here... Use markdown for formatting:
**bold**, *italic*, # Heading 1, ## Heading 2, - List item, [link text](url)"
                    className="min-h-[300px] font-mono"
                    required
                  />
                )}
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

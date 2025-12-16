import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { BlogFormData, ValidationErrors, categories, subcategories } from './BlogFormTypes';
import { SEOSettings, BlogPost } from '../../../types/blog';
import { useToast } from '../../../hooks/use-toast';
import { useBlogDrafts } from '../../../hooks/useBlogDrafts';

export const useBlogForm = (initialData?: BlogPost | null) => {
  const [title, setTitle] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [altImage, setAltImage] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [seo, setSeo] = useState<SEOSettings>({
    metaTitle: '',
    metaDescription: '',
    slug: ''
  });
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showValidation, setShowValidation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { saveDraft } = useBlogDrafts();

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
      // Content updated - no automatic save, only manual triggers
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[350px] p-6 text-slate-700 leading-relaxed',
      },
    },
  });

  // Track initialization state more reliably
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialSubcategory, setInitialSubcategory] = useState('');
  const previousCategoryRef = useRef<string>('');

  // Reset initialization when initialData changes
  useEffect(() => {
    setIsInitialized(false);
    setInitialSubcategory('');
  }, [initialData]);

  // Initialize form with existing data
  useEffect(() => {
    if (initialData && editor && !isInitialized) {
      console.log('🔍 Initializing form with data:', {
        category: initialData.category,
        subcategory: initialData.subcategory,
        title: initialData.title
      });
      
      setTitle(initialData.title);
      setFeaturedImage(initialData.featuredImage || '');
      setAltImage(initialData.altImage || '');
      setCategory(initialData.category);
      setInitialSubcategory(initialData.subcategory); // Store the subcategory separately
      setTags(initialData.tags || []);
      setSeo(initialData.seo);
      
      // Store the initial category to prevent reset
      previousCategoryRef.current = initialData.category;
      
      // Load content into editor
      editor.commands.setContent(initialData.content);
      
      // Mark as initialized
      setIsInitialized(true);
      console.log('✅ Initialization complete');
    }
  }, [initialData, editor, isInitialized]);

  // Restore subcategory after category is set during initialization
  useEffect(() => {
    if (isInitialized && initialSubcategory && category && subcategory !== initialSubcategory) {
      console.log('🔄 Restoring subcategory after initialization:', initialSubcategory);
      setSubcategory(initialSubcategory);
    }
  }, [isInitialized, category, initialSubcategory, subcategory]);

  // Debug logging for subcategory changes
  useEffect(() => {
    console.log('📊 Subcategory state changed:', subcategory);
  }, [subcategory]);

  // Reset subcategory when category changes (but not during initialization or if category hasn't actually changed)
  useEffect(() => {
    console.log('🔄 Category effect triggered:', {
      isInitialized,
      category,
      previousCategory: previousCategoryRef.current,
      subcategory
    });
    
    if (isInitialized && category !== previousCategoryRef.current && previousCategoryRef.current !== '') {
      console.log('🗑️ Resetting subcategory due to category change');
      // Auto-select "All" when "*" category is selected
      if (category === '*') {
        setSubcategory('All');
      } else {
        setSubcategory('');
      }
    }
    previousCategoryRef.current = category;
  }, [category, subcategory, isInitialized]);

  // Manual save functionality - replaces auto-save
  const handleManualSave = useCallback(async () => {
    if (!title || !editor?.getHTML() || !category) {
      toast({
        title: "Missing Information",
        description: "Please add title, content, and category before saving.",
        variant: "destructive"
      });
      return;
    }
    
    const draftData = {
      title,
      content: editor.getHTML(),
      excerpt: generateExcerpt(editor.getText()),
      featuredImage,
      altImage,
      category,
      subcategory,
      tags,
      seo
    };

    try {
      await saveDraft(draftData);
      setLastSaved(new Date());
      toast({
        title: "Draft Saved",
        description: "Your draft has been saved successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error('Manual save failed:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save draft. Please try again.",
        variant: "destructive"
      });
    }
  }, [title, editor, featuredImage, altImage, category, subcategory, tags, seo, saveDraft, toast]);

  // Keyboard shortcut for manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        handleManualSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleManualSave]);

  const validateForm = () => {
    const errors: ValidationErrors = {};
    
    if (!title.trim()) errors.title = true;
    if (!featuredImage.trim()) errors.featuredImage = true;
    if (!altImage.trim()) errors.altImage = true;
    if (!category) errors.category = true;
    if (!subcategory) errors.subcategory = true;
    if (tags.length === 0) errors.tags = true;
    if (!seo.metaTitle.trim()) errors.metaTitle = true;
    if (!seo.metaDescription.trim()) errors.metaDescription = true;
    if (!seo.slug.trim()) errors.slug = true;
    if (!editor?.getHTML().trim() || editor.getHTML() === '<p></p>') errors.content = true;
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

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

  const addMultipleTags = (input: string) => {
    const tagList = input.split(',').map(tag => tag.trim()).filter(tag => tag && !tags.includes(tag));
    if (tagList.length > 0) {
      setTags([...tags, ...tagList]);
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

  const handleTagInputChange = (value: string) => {
    if (value.includes(',')) {
      // Split by comma and process all tags
      const beforeLastComma = value.substring(0, value.lastIndexOf(','));
      const afterLastComma = value.substring(value.lastIndexOf(',') + 1);
      
      if (beforeLastComma.trim()) {
        addMultipleTags(beforeLastComma);
      }
      
      // Set the remaining text after the last comma
      setTagInput(afterLastComma);
    } else {
      setTagInput(value);
    }
  };

  const handleSaveAsDraft = async () => {
    setShowValidation(true);
    if (!validateForm()) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in all required fields before saving as draft.",
        variant: "destructive"
      });
      return;
    }

    const draftData = {
      title,
      content: editor.getHTML(),
      excerpt: generateExcerpt(editor.getText()),
      featuredImage,
      altImage,
      category,
      subcategory,
      tags,
      seo
    };

    const result = await saveDraft(draftData);
    if (result) {
      setLastSaved(new Date());
    }
  };

  const resetForm = () => {
    editor?.commands.clearContent();
    setTitle('');
    setFeaturedImage('');
    setAltImage('');
    setCategory('');
    setSubcategory('');
    setTags([]);
    setTagInput('');
    setSeo({ metaTitle: '', metaDescription: '', slug: '' });
    setValidationErrors({});
    setShowValidation(false);
  };

  return {
    // State
    title, setTitle,
    featuredImage, setFeaturedImage,
    altImage, setAltImage,
    category, setCategory,
    subcategory, setSubcategory,
    tags, setTags,
    tagInput, setTagInput,
    seo, setSeo,
    lastSaved,
    validationErrors,
    showValidation, setShowValidation,
    
    // Refs
    fileInputRef,
    editor,
    
    // Methods
    validateForm,
    handleImageUpload,
    insertImage,
    generateExcerpt,
    addTag,
    removeTag,
    handleTagKeyDown,
    handleTagInputChange,
    handleSaveAsDraft,
    handleManualSave,
    resetForm,
    
    // Constants
    categories,
    subcategories
  };
};

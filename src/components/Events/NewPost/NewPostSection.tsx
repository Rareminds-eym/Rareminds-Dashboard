import { useState, useEffect, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EventFormData, EventCategory, GalleryItem, Speaker, FAQItem, StatItem, FeatureItem, TestimonialItem, CtaBadge } from '../../../types/event';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Save, Upload, Bold, Italic, List, Link2, Heading1, Heading2, Heading3, Image as ImageIcon, X, Eye, Edit3, Sparkles, Hash, Calendar, Clock, MapPin, Users, Phone, Mail, DollarSign, HelpCircle, Images, Play, Search, Loader2, Plus, File as FileIcon, Megaphone, MessageSquare } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { useForms } from '../../../hooks/useForms';
import { FAQManager } from '../FAQManager';
import { EventGalleryManager } from '../EventGalleryManager';
import { TeaserVideoManager } from '../TeaserVideoManager';
import { KeyHighlightsManager } from '../KeyHighlightsManager';
import { StatsManager } from '../StatsManager';
import { FeaturesManager } from '../FeaturesManager';
import { TestimonialsManager } from '../TestimonialsManager';
import { PDFUpload } from '../PDFUpload';

interface NewPostSectionProps {
  onPostSaved: (formData: EventFormData) => void;
  editingPost?: EventFormData | null;
  isSaving?: boolean;
}

const NewPostSection = ({ onPostSaved, editingPost, isSaving = false }: NewPostSectionProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<'physical' | 'virtual'>('physical');
  const [locationGeo, setLocationGeo] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });
  const [locationLink, setLocationLink] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [capacity, setCapacity] = useState<number>(50);
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [priceType, setPriceType] = useState<'preset' | 'custom'>('preset');
  const [customPrice, setCustomPrice] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [zohoFormUrl, setZohoFormUrl] = useState('');
  const [formId, setFormId] = useState<string | null>(null);
  const [speakersDetails, setSpeakersDetails] = useState<Speaker[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>({
    name: '',
    role: '',
    description: '',
    photo: '',
    linkedin: '',
  });
  const [editingSpeakerIndex, setEditingSpeakerIndex] = useState<number | null>(null);
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [sponsorInput, setSponsorInput] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');
  const [eventBanner, setEventBanner] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [mobileFeaturedImage, setMobileFeaturedImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [slug, setSlug] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroDescription, setHeroDescription] = useState('');
  const [heroBenefits, setHeroBenefits] = useState<string[]>([]);
  const [heroBenefitInput, setHeroBenefitInput] = useState('');
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [features, setFeatures] = useState<FeatureItem[]>([]);
  const [testimonialsHeading, setTestimonialsHeading] = useState('');
  const [testimonialsTag, setTestimonialsTag] = useState('');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [ctaText, setCtaText] = useState('');
  const [ctaSubline, setCtaSubline] = useState('');
  const [ctaButtonLabel, setCtaButtonLabel] = useState('Register Now');
  const [ctaBadges, setCtaBadges] = useState<CtaBadge[]>([]);
  const [ctaBadgeInput, setCtaBadgeInput] = useState('');
  const [eventsGallery, setEventsGallery] = useState<string[]>([]);
  const [teaserVideo, setTeaserVideo] = useState<string | null>(null);
  const [keyHighlights, setKeyHighlights] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageInput, setLanguageInput] = useState('');
  const [enquiryPdfUrl, setEnquiryPdfUrl] = useState<string | null>(null);
  const [enquiryPdfPath, setEnquiryPdfPath] = useState<string | null>(null);
  
  // Debug function to track keyHighlights changes
  const handleKeyHighlightsChange = (newHighlights: string[]) => {
    console.log('NewPostSection: Setting keyHighlights to:', newHighlights);
    setKeyHighlights(newHighlights);
  };
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [shouldTriggerAddHighlight, setShouldTriggerAddHighlight] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const speakerPhotoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { forms } = useForms();

  // Geocode address to lat/lng
  const geocodeAddress = async () => {
    if (!location) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}`);
      const data = await response.json();
      if (data && data.length > 0) {
        setLocationGeo({ lat: data[0].lat, lng: data[0].lon });
        console.log('Coordinates after geocoding:', { lat: data[0].lat, lng: data[0].lon });
        toast({
          title: "Location Found",
          description: `Latitude: ${data[0].lat}, Longitude: ${data[0].lon}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Location Not Found",
          description: "Could not find coordinates for the given address.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch location coordinates.",
        variant: "destructive"
      });
    }
  };

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
        placeholder: 'Describe your event in detail...',
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate prose-lg max-w-none focus:outline-none min-h-[350px] p-6 text-slate-700 leading-relaxed',
      },
    },
  });

  // Track the last loaded edit ID to prevent reloading the same data
  const [lastLoadedEditId, setLastLoadedEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!editingPost || !editor) return;
    if (editingPost.id === lastLoadedEditId) return;

    setTitle(editingPost.title);
    setEventDate(editingPost.event_date);
    setEventTime(editingPost.event_time || '');
    setDuration(String(editingPost.duration || ''));
    setLocationType(editingPost.is_physical !== false ? 'physical' : 'virtual');
    setLocation(editingPost.location_address || '');
    setLocationGeo({
      lat: editingPost.location_lat ? String(editingPost.location_lat) : '',
      lng: editingPost.location_lng ? String(editingPost.location_lng) : '',
    });
    setLocationLink(editingPost.event_link || '');
    setOrganizerName(editingPost.organizer_name || '');
    setOrganizerEmail(editingPost.organizer_email || '');
    setOrganizerPhone(editingPost.organizer_phone || '');
    setCapacity(editingPost.capacity || 50);
    setCategory(editingPost.category || '');

    // price: number → string for form UI
    const numPrice = editingPost.price ?? 0;
    if (numPrice === 0) {
      setPrice('FREE');
      setPriceType('preset');
    } else {
      const rupeeStr = `₹${numPrice}`;
      const presets = ['₹500', '₹1000', '₹2000'];
      if (presets.includes(rupeeStr)) {
        setPrice(rupeeStr);
        setPriceType('preset');
      } else {
        setPrice(rupeeStr);
        setPriceType('custom');
        setCustomPrice(String(numPrice));
      }
    }

    setRegistrationDeadline(editingPost.registration_deadline || '');
    setRequirements(editingPost.requirements || '');
    setZohoFormUrl(editingPost.zoho_form_url || '');
    console.log('Loading event - form_id:', editingPost.form_id);
    setFormId(editingPost.form_id || null);
    setSpeakersDetails(editingPost.speakers || []);
    setSponsors(editingPost.sponsors || []);
    setStatus(editingPost.status || 'upcoming');
    setEventBanner(editingPost.event_banner || '');
    setFeaturedImage(editingPost.featured_image || '');
    setMobileFeaturedImage(editingPost.mobile_featured_image || '');
    setTags(editingPost.event_tags || []);
    setKeyHighlights(editingPost.highlights || []);
    setLanguages(editingPost.languages || []);
    setFaqs(editingPost.faq || []);
    setStats(editingPost.stats || []);
    setFeatures(editingPost.features || []);
    setTestimonialsHeading(editingPost.testimonials_heading || '');
    setTestimonialsTag(editingPost.testimonials_tag || '');
    setTestimonials(editingPost.testimonials || []);
    setCtaText(editingPost.cta_text || '');
    setCtaSubline(editingPost.cta_subline || '');
    setCtaButtonLabel(editingPost.cta_button_label || 'Register Now');
    setCtaBadges(editingPost.cta_badges || []);
    setEventsGallery((editingPost.gallery || []).map((item: GalleryItem) => item.image_url ?? ''));
    setTeaserVideo(editingPost.teaser_video || null);
    setEnquiryPdfUrl(editingPost.enquiry_pdf || null);
    setEnquiryPdfPath(null);
    setSlug(editingPost.slug || '');
    setHeroTitle(editingPost.hero_title || '');
    setHeroDescription(editingPost.hero_description || '');
    setHeroBenefits(editingPost.hero_benefits || []);

    if (editingPost.about) {
      editor.commands.setContent(editingPost.about);
      setDescription(editingPost.about);
    } else {
      editor.commands.clearContent();
      setDescription('');
    }

    setLastLoadedEditId(editingPost.id);
  }, [editingPost, editor, lastLoadedEditId]);

  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, slug]);

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

  const handleMobileImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMobileFeaturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEventBanner(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSpeakerPhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoSrc = e.target?.result as string;
        setCurrentSpeaker(prev => ({ ...prev, photo: photoSrc }));
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

  const addSpeaker = () => {
    if (currentSpeaker.name.trim()) {
      const normalized: Speaker = {
        ...currentSpeaker,
        name: currentSpeaker.name.trim(),
        role: currentSpeaker.role?.trim() || '',
        description: currentSpeaker.description?.trim() || '',
        photo: currentSpeaker.photo?.trim() || '',
        linkedin: currentSpeaker.linkedin?.trim() || '',
      };

      if (editingSpeakerIndex !== null) {
        // Update existing speaker
        setSpeakersDetails(prev => prev.map((s, i) => (i === editingSpeakerIndex ? normalized : s)));
        setEditingSpeakerIndex(null);
      } else {
        // Add new speaker
        setSpeakersDetails([...speakersDetails, normalized]);
      }
      setCurrentSpeaker({ name: '', role: '', description: '', photo: '', linkedin: '' });
    }
  };

  const startEditSpeaker = (index: number) => {
    const s = speakersDetails[index];
    setCurrentSpeaker({
      name: s.name || '',
      role: s.role || '',
      description: s.description || '',
      photo: s.photo || '',
      linkedin: s.linkedin || '',
    });
    setEditingSpeakerIndex(index);
  };

  const cancelEditSpeaker = () => {
    setEditingSpeakerIndex(null);
    setCurrentSpeaker({ name: '', role: '', description: '', photo: '', linkedin: '' });
  };

  const removeSpeaker = (indexToRemove: number) => {
    setSpeakersDetails(speakersDetails.filter((_, index) => index !== indexToRemove));
  };

  const updateCurrentSpeaker = (field: keyof Speaker, value: string) => {
    setCurrentSpeaker(prev => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (selectedPrice: string) => {
    if (selectedPrice === 'custom') {
      setPriceType('custom');
      if (customPrice.trim()) {
        setPrice(`₹${customPrice}`);
      } else {
        setPrice('');
      }
    } else {
      setPriceType('preset');
      setPrice(selectedPrice);
      setCustomPrice('');
    }
  };

  const handleCustomPriceChange = (value: string) => {
    setCustomPrice(value);
    if (value.trim()) {
      setPrice(`₹${value}`);
    }
  };

  const addSponsor = () => {
    const trimmedSponsor = sponsorInput.trim();
    if (trimmedSponsor && !sponsors.includes(trimmedSponsor)) {
      setSponsors([...sponsors, trimmedSponsor]);
      setSponsorInput('');
    }
  };

  const removeSponsor = (sponsorToRemove: string) => {
    setSponsors(sponsors.filter(sponsor => sponsor !== sponsorToRemove));
  };

  const handleSponsorKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSponsor();
    }
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

  const addLanguage = () => {
    const trimmed = languageInput.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages([...languages, trimmed]);
      setLanguageInput('');
    }
  };

  const removeLanguage = (langToRemove: string) => {
    setLanguages(languages.filter(l => l !== langToRemove));
  };

  const handleLanguageKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addLanguage();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted!');

    const isPhysical = locationType === 'physical';
    const parsedLat = isPhysical && locationGeo.lat ? parseFloat(locationGeo.lat) : null;
    const parsedLng = isPhysical && locationGeo.lng ? parseFloat(locationGeo.lng) : null;

    if (!title || !eventDate || !eventTime || !duration || !organizerName || !organizerEmail || !category) {
      console.log('Validation failed - missing required fields');
      const missingFields = [];
      if (!title) missingFields.push('Title');
      if (!eventDate) missingFields.push('Event Date');
      if (!eventTime) missingFields.push('Event Time');
      if (!duration) missingFields.push('Duration');
      if (!organizerName) missingFields.push('Organizer Name');
      if (!organizerEmail) missingFields.push('Organizer Email');
      if (!category) missingFields.push('Category');

      toast({
        title: "Missing Required Fields",
        description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    // Convert duration string → integer minutes
    const durationMinutes = parseInt(duration) || 60;

    // Convert price string → number (0 = free)
    let priceNum = 0;
    if (price && price !== 'FREE') {
      priceNum = parseFloat(price.replace('₹', '')) || 0;
    }

    console.log('Submitting event with form_id:', formId);

    const formData: EventFormData = {
      id: editingPost?.id,
      title,
      event_date: eventDate,
      event_time: eventTime,
      duration: durationMinutes,
      category: category as EventCategory,
      price: priceNum,
      registration_deadline: registrationDeadline || null,
      status,
      is_physical: isPhysical,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      event_link: isPhysical ? '' : locationLink,
      zoho_form_url: zohoFormUrl,
      form_id: formId,
      capacity,
      requirements: requirements || '',
      sponsors,
      additional_contact_info: '',
      languages,
      event_tags: tags,
      featured_image: featuredImage || '',
      mobile_featured_image: mobileFeaturedImage || '',
      event_banner: eventBanner || '',
      teaser_video: teaserVideo || '',
      enquiry_pdf: enquiryPdfUrl || '',
      organizer_name: organizerName,
      organizer_email: organizerEmail,
      organizer_phone: organizerPhone || '',
      location_address: isPhysical ? location : '',
      location_lat: parsedLat,
      location_lng: parsedLng,
      hero_title: heroTitle,
      hero_description: heroDescription,
      hero_benefits: heroBenefits,
      about: description,
      highlights: keyHighlights,
      agenda: '',
      gallery: eventsGallery.map((image_url: string) => ({ image_url })),
      speakers: speakersDetails,
      faq: faqs,
      stats,
      features,
      testimonials_heading: testimonialsHeading,
      testimonials_tag: testimonialsTag,
      testimonials,
      cta_text: ctaText,
      cta_subline: ctaSubline,
      cta_button_label: ctaButtonLabel,
      cta_badges: ctaBadges,
    };

    console.log('FormData to be saved:', formData);
    onPostSaved(formData);

    if (!editingPost) {
      // Clear form after successful creation
      editor?.commands.clearContent();
      setTitle('');
      setDescription('');
      setEventDate('');
      setEventTime('');
      setDuration('');
      setLocation('');
      setLocationType('physical');
      setLocationGeo({ lat: '', lng: '' });
      setLocationLink('');
      setOrganizerName('');
      setOrganizerEmail('');
      setOrganizerPhone('');
      setCapacity(50);
      setCategory('');
      setPrice('');
      setPriceType('preset');
      setCustomPrice('');
      setRegistrationDeadline('');
      setRequirements('');
      setSpeakersDetails([]);
      setCurrentSpeaker({ name: '', role: '', description: '', photo: '', linkedin: '' });
      setSponsors([]);
      setSponsorInput('');
      setStatus('upcoming');
      setEventBanner('');
      setFeaturedImage('');
      setMobileFeaturedImage('');
      setTags([]);
      setTagInput('');
      setKeyHighlights([]);
      setLanguages([]);
      setLanguageInput('');
      setFaqs([]);
      setStats([]);
      setFeatures([]);
      setTestimonials([]);
      setCtaText('');
      setCtaSubline('');
      setCtaButtonLabel('Register Now');
      setEventsGallery([]);
      setTeaserVideo(null);
      setEnquiryPdfUrl(null);
      setEnquiryPdfPath(null);
      setSlug('');
      setHeroTitle('');
      setHeroDescription('');
      setHeroBenefits([]);
      setHeroBenefitInput('');
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
                <div className="p-2 bg-purple-600 rounded-xl shadow-sm">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                  {editingPost ? 'Edit Event' : 'Create New Event'}
                </h1>
              </div>
              <p className="text-slate-600 text-lg"> 
                {editingPost ? 'Update your existing event details' : 'Plan and publish your upcoming event'}
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
                type="submit"
                form="event-form"
                disabled={isSaving}
                className="h-11 px-6 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed shadow-xl shadow-purple-600/10 hover:shadow-md transition-all duration-200"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {editingPost ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {editingPost ? 'Update Event' : 'Save Event'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <form id="event-form" onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content - Takes 3 columns */}
          <div className="xl:col-span-3 space-y-6">
            {/* Event Basic Info Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                    Event Title *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter your event title..."
                    className="h-12 text-lg border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    required
                  />
                </div>

                {/* Event Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Event Category *
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                      <SelectItem value="Seminar">Seminar</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Bootcamp">Bootcamp</SelectItem>
                      <SelectItem value="Hackathon">Hackathon</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                        className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
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
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Featured Image */}
                <div className="space-y-3">
                  <Label htmlFor="mobile-featured-image" className="text-sm font-medium text-slate-700">
                    Mobile Featured Image
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <Input
                        value={mobileFeaturedImage}
                        onChange={(e) => setMobileFeaturedImage(e.target.value)}
                        placeholder="Mobile image URL or upload a file..."
                        className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => mobileFileInputRef.current?.click()}
                        className="h-10 px-4 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <input
                      ref={mobileFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleMobileImageUpload}
                      className="hidden"
                    />
                    {mobileFeaturedImage && (
                      <div className="relative group">
                        <img
                          src={mobileFeaturedImage}
                          alt="Mobile Featured preview"
                          className="w-full max-w-lg h-48 object-cover rounded-xl border border-slate-200 shadow-sm group-hover:shadow-md transition-all duration-300"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Rich Text Editor for Description */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                      Event Description *
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
                              ? 'bg-purple-100 text-purple-600 shadow-sm' 
                              : 'hover:bg-white hover:shadow-sm text-slate-600'
                          }`}
                          title={title}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border border-slate-200 rounded-xl min-h-[400px] prose prose-sm max-w-none p-6 bg-white focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all duration-200">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Event Details Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="event-date" className="text-sm font-medium text-slate-700">
                      Event Date *
                    </Label>
                    <Input
                      id="event-date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="event-time" className="text-sm font-medium text-slate-700">
                      Event Time *
                    </Label>
                    <Input
                      id="event-time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-sm font-medium text-slate-700">
                      Duration *
                    </Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="Duration in minutes (e.g. 60)"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-sm font-medium text-slate-700">
                      Capacity
                    </Label>
                    <Input
                      id="capacity"
                      type="number"
                      value={capacity}
                      onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                      placeholder="50"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>
                </div>
                {/* Location Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Event Type *
                  </Label>
                  <div className="flex gap-4">
                    <Label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="location-type"
                        value="physical"
                        checked={locationType === 'physical'}
                        onChange={() => setLocationType('physical')}
                        className="accent-purple-600"
                      />
                      Physical
                    </Label>
                    <Label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="location-type"
                        value="virtual"
                        checked={locationType === 'virtual'}
                        onChange={() => setLocationType('virtual')}
                        className="accent-purple-600"
                      />
                      Virtual
                    </Label>
                  </div>
                  {locationType === 'physical' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                          Address *
                        </Label>
                        <Input
                          id="location"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Enter event address"
                          className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="text"
                          value={locationGeo.lat}
                          onChange={e => setLocationGeo({ ...locationGeo, lat: e.target.value })}
                          placeholder="Latitude"
                          className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                        <Input
                          type="text"
                          value={locationGeo.lng}
                          onChange={e => setLocationGeo({ ...locationGeo, lng: e.target.value })}
                          placeholder="Longitude"
                          className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={geocodeAddress}
                        className="flex items-center gap-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      >
                        <Search className="w-4 h-4" />
                        Get Coordinates from Address
                      </Button>
                    </>
                  )}
                  {locationType === 'virtual' && (
                    <div className="space-y-2">
                      <Label htmlFor="event-link" className="text-sm font-medium text-slate-700">
                        Event Link *
                      </Label>
                      <Input
                        id="event-link"
                        type="url"
                        value={locationLink}
                        onChange={e => setLocationLink(e.target.value)}
                        placeholder="Event link (e.g. Zoom/Google Meet)"
                        className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        required
                      />
                    </div>
                  )}
                </div>
                {/* Price Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Price *
                  </Label>
                  <div className="space-y-3">
                    {/* Preset Price Dropdown */}
                    <div className="space-y-2">
                      <Select 
                        value={priceType === 'preset' ? price : 'custom'} 
                        onValueChange={handlePriceChange}
                        required
                      >
                        <SelectTrigger className="h-12 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                          <SelectValue placeholder="Select price or enter custom amount" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FREE">FREE</SelectItem>
                          <SelectItem value="₹500">₹500</SelectItem>
                          <SelectItem value="₹1000">₹1000</SelectItem>
                          <SelectItem value="₹2000">₹2000</SelectItem>
                          <SelectItem value="custom">Enter Custom Amount</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Custom Price Input */}
                    {priceType === 'custom' && (
                      <div className="space-y-2">
                        <Label htmlFor="custom-price" className="text-sm font-medium text-slate-700">
                          Custom Amount (in ₹)
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 font-medium">₹</span>
                          <Input
                            id="custom-price"
                            type="number"
                            value={customPrice}
                            onChange={(e) => handleCustomPriceChange(e.target.value)}
                            placeholder="0"
                            className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                            min="0"
                            required
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Price Preview */}
                    {price && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-600">Selected Price: </span>
                        <span className="font-medium text-slate-800">{price}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="registration-deadline" className="text-sm font-medium text-slate-700">
                    Registration Deadline (Optional)
                  </Label>
                  <Input
                    id="registration-deadline"
                    type="date"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Organizer Info Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Users className="w-5 h-5 text-green-500" />
                  Organizer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="organizer-name" className="text-sm font-medium text-slate-700">
                    Organizer Name *
                  </Label>
                  <Input
                    id="organizer-name"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="Event organizer name"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="organizer-email" className="text-sm font-medium text-slate-700">
                      Organizer Email *
                    </Label>
                    <Input
                      id="organizer-email"
                      type="email"
                      value={organizerEmail}
                      onChange={(e) => setOrganizerEmail(e.target.value)}
                      placeholder="organizer@example.com"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="organizer-phone" className="text-sm font-medium text-slate-700">
                      Organizer Phone
                    </Label>
                    <Input
                      id="organizer-phone"
                      type="tel"
                      value={organizerPhone}
                      onChange={(e) => setOrganizerPhone(e.target.value)}
                      placeholder="+1 (555) 123-4567"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Teaser Video Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Play className="w-5 h-5 text-purple-500" />
                      Teaser Video
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      Upload a video or add a YouTube link to preview your event
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'video/*';
                        fileInput.onchange = (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          
                          if (file.type.startsWith('video/')) {
                            const reader = new FileReader();
                            reader.onload = (e) => {
                              const result = e.target?.result as string;
                              setTeaserVideo(result);
                            };
                            reader.readAsDataURL(file);
                          }
                        };
                        fileInput.click();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = prompt('Enter YouTube URL or video link:');
                        if (url && url.trim()) {
                          setTeaserVideo(url.trim());
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Link2 className="h-4 w-4" />
                      Add Link
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TeaserVideoManager
                  video={teaserVideo}
                  onChange={setTeaserVideo}
                />
              </CardContent>
            </Card>

            {/* Event Gallery Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Images className="w-5 h-5 text-pink-500" />
                      Event Gallery
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      Add multiple images to showcase your event and attract more attendees
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = 'image/*';
                        fileInput.multiple = true;
                        fileInput.onchange = (e) => {
                          const files = (e.target as HTMLInputElement).files;
                          if (!files || eventsGallery.length >= 8) return;
                          
                          const fileReaders: Promise<string>[] = [];
                          const remainingSlots = 8 - eventsGallery.length;
                          const filesToProcess = Array.from(files).slice(0, remainingSlots);
                          
                          filesToProcess.forEach((file) => {
                            if (file.type.startsWith('image/')) {
                              fileReaders.push(
                                new Promise((resolve) => {
                                  const reader = new FileReader();
                                  reader.onload = (e) => resolve(e.target?.result as string);
                                  reader.readAsDataURL(file);
                                })
                              );
                            }
                          });
                          
                          Promise.all(fileReaders).then((base64Images) => {
                            const newImages = base64Images.filter(img => !eventsGallery.includes(img));
                            if (newImages.length > 0) {
                              setEventsGallery([...eventsGallery, ...newImages]);
                            }
                          });
                        };
                        fileInput.click();
                      }}
                      className="flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = prompt('Enter image URL:');
                        if (url && url.trim() && !eventsGallery.includes(url.trim()) && eventsGallery.length < 8) {
                          setEventsGallery([...eventsGallery, url.trim()]);
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      <Link2 className="h-4 w-4" />
                      Add URL
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <EventGalleryManager
                  images={eventsGallery}
                  onChange={setEventsGallery}
                  minImages={2}
                  maxImages={8}
                />
              </CardContent>
            </Card>

            {/* Hero Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Megaphone className="w-5 h-5 text-indigo-500" />
                  Hero Section
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Main banner content shown at the top of the event page
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero-title" className="text-sm font-medium text-slate-700">
                    Hero Title <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="hero-title"
                    value={heroTitle}
                    onChange={(e) => setHeroTitle(e.target.value)}
                    placeholder="e.g. Transform Your Teaching Practice"
                    className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero-description" className="text-sm font-medium text-slate-700">
                    Hero Description <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Textarea
                    id="hero-description"
                    value={heroDescription}
                    onChange={(e) => setHeroDescription(e.target.value)}
                    placeholder="e.g. Join thousands of educators for an immersive learning experience."
                    rows={3}
                    className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Benefits <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={heroBenefitInput}
                      onChange={(e) => setHeroBenefitInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const val = heroBenefitInput.trim();
                          if (val) {
                            setHeroBenefits(prev => [...prev, val]);
                            setHeroBenefitInput('');
                          }
                        }
                      }}
                      placeholder="e.g. Hands-on workshops"
                      className="border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const val = heroBenefitInput.trim();
                        if (val) {
                          setHeroBenefits(prev => [...prev, val]);
                          setHeroBenefitInput('');
                        }
                      }}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {heroBenefits.length > 0 && (
                    <ul className="space-y-1 pt-1">
                      {heroBenefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center justify-between gap-2 text-sm text-slate-700 bg-indigo-50 rounded px-3 py-1.5">
                          <span>{benefit}</span>
                          <button
                            type="button"
                            title="Remove benefit"
                            onClick={() => setHeroBenefits(prev => prev.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Custom Registration Form Selector */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="registration-form" className="text-sm font-medium text-slate-700">
                      Registration Form <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <RouterLink 
                      to="/form-builder" 
                      target="_blank"
                      className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                    >
                      Manage Forms
                    </RouterLink>
                  </div>
                  <Select value={formId || 'none'} onValueChange={(value) => setFormId(value === 'none' ? null : value)}>
                    <SelectTrigger id="registration-form" className="border-slate-200 focus:border-indigo-400">
                      <SelectValue placeholder="Select a form or leave empty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No form attached</SelectItem>
                      {forms.filter(f => f.is_active).map(form => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title} ({form.fields.length} fields)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">
                    Select a custom form to collect structured registration data from attendees
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Key Highlights Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-slate-800">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Key Highlights
                    </CardTitle>
                    <CardDescription className="text-slate-500 mt-1">
                      Add important highlights and key points about your event
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShouldTriggerAddHighlight(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Highlight
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <KeyHighlightsManager
                  highlights={keyHighlights}
                  onChange={handleKeyHighlightsChange}
                  shouldTriggerAddHighlight={shouldTriggerAddHighlight}
                  onTriggerAddHighlightReset={() => setShouldTriggerAddHighlight(false)}
                />
              </CardContent>
            </Card>

            {/* Stats Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Users className="w-5 h-5 text-teal-500" />
                  Event Stats
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Key numbers that showcase your event's impact (e.g. 150K+ Educators, 4.8/5 Rating)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StatsManager
                  stats={stats}
                  onChange={setStats}
                />
              </CardContent>
            </Card>

            {/* Features Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Sparkles className="w-5 h-5 text-violet-500" />
                  Event Features
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Highlight what attendees will experience or gain from this event
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeaturesManager
                  features={features}
                  onChange={setFeatures}
                />
              </CardContent>
            </Card>

            {/* Testimonials Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <MessageSquare className="w-5 h-5 text-amber-500" />
                  Testimonials
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Add quotes from past attendees to build trust and credibility
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="testimonials-heading" className="text-sm font-medium text-slate-700">
                      Section Heading <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="testimonials-heading"
                      value={testimonialsHeading}
                      onChange={(e) => setTestimonialsHeading(e.target.value)}
                      placeholder="e.g. What Our Attendees Say"
                      className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="testimonials-tag" className="text-sm font-medium text-slate-700">
                      Tag <span className="text-slate-400 font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="testimonials-tag"
                      value={testimonialsTag}
                      onChange={(e) => setTestimonialsTag(e.target.value)}
                      placeholder="e.g. Testimonials"
                      className="border-slate-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all duration-200"
                    />
                  </div>
                </div>
                <TestimonialsManager
                  testimonials={testimonials}
                  onChange={setTestimonials}
                />
              </CardContent>
            </Card>

            {/* FAQ Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <HelpCircle className="w-5 h-5 text-indigo-500" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Add common questions and answers about your event to help attendees
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FAQManager
                  faqs={faqs}
                  onChange={setFaqs}
                />
              </CardContent>
            </Card>

            {/* CTA Section Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Megaphone className="w-5 h-5 text-rose-500" />
                  Call to Action
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Bottom section shown on the public event page to drive registrations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cta-text" className="text-sm font-medium text-slate-700">
                    Heading
                  </Label>
                  <Input
                    id="cta-text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    placeholder="e.g. Ready to transform your teaching practice?"
                    className="border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta-subline" className="text-sm font-medium text-slate-700">
                    Subline <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <Input
                    id="cta-subline"
                    value={ctaSubline}
                    onChange={(e) => setCtaSubline(e.target.value)}
                    placeholder="e.g. Join 150K+ educators who have already attended."
                    className="border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cta-button-label" className="text-sm font-medium text-slate-700">
                    Button Label
                  </Label>
                  <Input
                    id="cta-button-label"
                    value={ctaButtonLabel}
                    onChange={(e) => setCtaButtonLabel(e.target.value)}
                    placeholder="Register Now"
                    className="border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    Badges <span className="text-slate-400 font-normal">(optional)</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={ctaBadgeInput}
                      onChange={(e) => setCtaBadgeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const label = ctaBadgeInput.trim();
                          if (label) {
                            setCtaBadges(prev => [...prev, { label }]);
                            setCtaBadgeInput('');
                          }
                        }
                      }}
                      placeholder="e.g. 100% Free"
                      className="border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition-all duration-200"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const label = ctaBadgeInput.trim();
                        if (label) {
                          setCtaBadges(prev => [...prev, { label }]);
                          setCtaBadgeInput('');
                        }
                      }}
                      className="shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {ctaBadges.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {ctaBadges.map((badge, idx) => (
                        <Badge key={idx} variant="secondary" className="flex items-center gap-1 pr-1">
                          {badge.label}
                          <button
                            type="button"
                            title="Remove badge"
                            onClick={() => setCtaBadges(prev => prev.filter((_, i) => i !== idx))}
                            className="ml-1 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Optional Details Card */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Hash className="w-5 h-5 text-orange-500" />
                  Optional Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="requirements" className="text-sm font-medium text-slate-700">
                    Requirements
                  </Label>
                  <Textarea
                    id="requirements"
                    value={requirements}
                    onChange={(e) => setRequirements(e.target.value)}
                    placeholder="Any requirements for attendees..."
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Takes 1 column */}
          <div className="space-y-6">
            {/* Event Settings */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Hash className="w-4 h-4 text-green-500" />
                  Event Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium text-slate-700">
                    Status *
                  </Label>
                  <Select value={status} onValueChange={(value) => setStatus(value as 'upcoming' | 'ongoing' | 'completed' | 'cancelled')}>
                    <SelectTrigger className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Tags */}
                <div className="space-y-3">
                  <Label htmlFor="tags" className="text-sm font-medium text-slate-700">
                    Event Tags *
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagKeyDown}
                        placeholder="Add event tags..."
                        className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
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
                            className="flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-all duration-200"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-purple-500 hover:text-purple-700 transition-colors duration-200"
                              onClick={() => removeTag(tag)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Languages */}
                <div className="space-y-3">
                  <Label htmlFor="languages" className="text-sm font-medium text-slate-700">
                    Languages
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="languages"
                        value={languageInput}
                        onChange={(e) => setLanguageInput(e.target.value)}
                        onKeyDown={handleLanguageKeyDown}
                        placeholder="Add languages (e.g., English, Hindi)..."
                        className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={addLanguage}
                        disabled={!languageInput.trim()}
                        className="border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
                      >
                        Add
                      </Button>
                    </div>
                    {languages.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {languages.map((lang) => (
                          <Badge
                            key={lang}
                            variant="secondary"
                            className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-all duration-200"
                          >
                            {lang}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0 text-slate-500 hover:text-slate-700 transition-colors duration-200"
                              onClick={() => removeLanguage(lang)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* URL Slug */}
                <div className="space-y-2">
                  <Label htmlFor="slug" className="text-sm font-medium text-slate-700">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-'))}
                    placeholder="auto-generated-from-title"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 font-mono text-sm"
                  />
                  <p className="text-xs text-slate-400">Auto-generated from title. Editable.</p>
                </div>
              </CardContent>
            </Card>

            {/* Enquiry PDF Section */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileIcon className="w-4 h-4 text-red-500" />
                  Enquiry PDF
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Attach a PDF (max 10MB) for event enquiries. Save the event first to enable uploading.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {editingPost ? (
                  <PDFUpload
                    eventId={editingPost.id}
                    currentPDFUrl={enquiryPdfUrl || undefined}
                    currentPDFPath={enquiryPdfPath || undefined}
                    onUploadComplete={(url, path) => {
                      setEnquiryPdfUrl(url);
                      setEnquiryPdfPath(path || null);
                    }}
                    onDeleteComplete={() => {
                      setEnquiryPdfUrl(null);
                      setEnquiryPdfPath(null);
                    }}
                  />
                ) : (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-600">
                    Save the event to enable PDF upload.
                  </div>
                )}
              </CardContent>
            </Card>

          {/* Speakers */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Users className="w-4 h-4 text-blue-500" />
                  Speakers *
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add New Speaker Form */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Speaker Name *</Label>
                    <Input
                      value={currentSpeaker.name}
                      onChange={(e) => updateCurrentSpeaker('name', e.target.value)}
                      placeholder="Enter speaker name..."
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Role</Label>
                    <Input
                      value={currentSpeaker.role || ''}
                      onChange={(e) => updateCurrentSpeaker('role', e.target.value)}
                      placeholder="e.g., CEO, Senior Developer, Project Manager"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Description <span className="text-slate-400 font-normal">(optional)</span></Label>
                    <Textarea
                      value={currentSpeaker.description || ''}
                      onChange={(e) => updateCurrentSpeaker('description', e.target.value)}
                      placeholder="Brief bio or expertise summary..."
                      rows={3}
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200 resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Photo URL</Label>
                    <div className="flex gap-3">
                      <Input
                        value={currentSpeaker.photo || ''}
                        onChange={(e) => updateCurrentSpeaker('photo', e.target.value)}
                        placeholder="https://example.com/speaker-photo.jpg"
                        className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => speakerPhotoInputRef.current?.click()}
                        className="h-10 px-4 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                        title="Upload from device"
                      >
                        <Upload className="w-4 h-4" />
                      </Button>
                    </div>
                    <input
                      ref={speakerPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleSpeakerPhotoUpload}
                      className="hidden"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">LinkedIn URL</Label>
                    <Input
                      value={currentSpeaker.linkedin || ''}
                      onChange={(e) => updateCurrentSpeaker('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/speaker-profile"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      onClick={addSpeaker}
                      disabled={!currentSpeaker.name.trim()}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all duration-200"
                    >
                      {editingSpeakerIndex !== null ? 'Save Changes' : 'Add Speaker'}
                    </Button>
                    {editingSpeakerIndex !== null && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={cancelEditSpeaker}
                        className="flex-1 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Added Speakers List */}
                {speakersDetails.length > 0 && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-slate-700">Added Speakers ({speakersDetails.length})</Label>
                    {speakersDetails.map((speaker, index) => (
                      <div key={index} className="p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-3">
                              {speaker.photo && (
                                <img
                                  src={speaker.photo}
                                  alt={speaker.name}
                                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                              )}
                              <div>
                                <h4 className="font-medium text-slate-800">{speaker.name}</h4>
                                {speaker.role && (
                                  <p className="text-sm text-slate-600">{speaker.role}</p>
                                )}
                                {speaker.description && (
                                  <p className="text-sm text-slate-500 mt-1">{speaker.description}</p>
                                )}
                                {speaker.linkedin && (
                                  <a
                                    href={speaker.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    LinkedIn Profile
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => startEditSpeaker(index)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition-all duration-200"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSpeaker(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sponsors */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <DollarSign className="w-4 h-4 text-yellow-500" />
                  Sponsors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={sponsorInput}
                    onChange={(e) => setSponsorInput(e.target.value)}
                    onKeyDown={handleSponsorKeyDown}
                    placeholder="Add sponsor name..."
                    className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSponsor}
                    disabled={!sponsorInput.trim()}
                    className="border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
                  >
                    Add
                  </Button>
                </div>
                
                {sponsors.length > 0 && (
                  <div className="space-y-2">
                    {sponsors.map((sponsor, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-700">{sponsor}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSponsor(sponsor)}
                          className="h-6 w-6 p-0 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </form>
      </div>
    </div>
  );
};

export default NewPostSection;

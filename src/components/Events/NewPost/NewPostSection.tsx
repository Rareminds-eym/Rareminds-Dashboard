import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EventPost, EventSEOSettings, Speaker, FAQItem } from '../../../types/event';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Save, Upload, Bold, Italic, List, Link2, Heading1, Heading2, Heading3, Image as ImageIcon, X, Eye, Edit3, Sparkles, Hash, Globe, Calendar, Clock, MapPin, Users, Phone, Mail, DollarSign, HelpCircle, Images, Play, Search} from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';
import { FAQManager } from '../FAQManager';
import { EventGalleryManager } from '../EventGalleryManager';
import { TeaserVideoManager } from '../TeaserVideoManager';

interface NewPostSectionProps {
  onPostSaved: (post: EventPost) => void;
  editingPost?: EventPost | null;
}

const NewPostSection = ({ onPostSaved, editingPost }: NewPostSectionProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState<'physical' | 'virtual'>('physical');
  const [locationGeo, setLocationGeo] = useState<{ lat: string; lng: string }>({ lat: '', lng: '' });
  const [locationLink, setLocationLink] = useState('');
  const [isPhysical, setIsPhysical] = useState(true);
  const [eventLink, setEventLink] = useState('');
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
  const [agenda, setAgenda] = useState('');
  const [speakersDetails, setSpeakersDetails] = useState<Speaker[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<Speaker>({
    name: '',
    profile: '',
    photo: '',
    linkedIn: ''
  });
  const [sponsors, setSponsors] = useState<string[]>([]);
  const [sponsorInput, setSponsorInput] = useState('');
  const [additionalContactInfo, setAdditionalContactInfo] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed' | 'cancelled'>('upcoming');
  const [eventBanner, setEventBanner] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [seo, setSeo] = useState<EventSEOSettings>({
    meta_title: '',
    meta_description: '',
    slug: ''
  });
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [eventsGallery, setEventsGallery] = useState<string[]>([]);
  const [teaserVideo, setTeaserVideo] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

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

  useEffect(() => {
  if (editingPost && editor) {
      setTitle(editingPost.title);
      setDescription(editingPost.description);
      setEventDate(editingPost.event_date);
      setEventTime(editingPost.event_time);
      setDuration(editingPost.duration);
      setLocation(editingPost.location);
      setLocationType(editingPost.location_type || 'physical');
      setLocationGeo({ 
        lat: editingPost.location_latitude ? String(editingPost.location_latitude) : '',
        lng: editingPost.location_longitude ? String(editingPost.location_longitude) : ''
      });
      setLocationLink(editingPost.location_link || '');
      setIsPhysical(editingPost.is_physical);
      setEventLink(editingPost.event_link || '');
      setOrganizerName(editingPost.organizer_name);
      setOrganizerEmail(editingPost.organizer_email);
      setOrganizerPhone(editingPost.organizer_phone);
      setCapacity(editingPost.capacity);
      setCategory(editingPost.category);
      const editPrice = editingPost.price || '';
      setPrice(editPrice);
      // Check if it's a preset value or custom
      const presetValues = ['FREE', '₹500', '₹1000', '₹2000'];
      if (presetValues.includes(editPrice)) {
        setPriceType('preset');
      } else if (editPrice.startsWith('₹')) {
        setPriceType('custom');
        setCustomPrice(editPrice.replace('₹', ''));
      } else {
        setPriceType('preset');
      }
      setRegistrationDeadline(editingPost.registration_deadline || '');
      setRequirements(editingPost.requirements || '');
      setAgenda(editingPost.agenda || '');
      setSpeakersDetails(editingPost.speakers_details || []);
      setSponsors(editingPost.sponsors || []);
      setAdditionalContactInfo(editingPost.additional_contact_info || '');
      setStatus(editingPost.status);
      setEventBanner(editingPost.event_banner || '');
      setFeaturedImage(editingPost.featured_image || '');
      setTags(editingPost.event_tags || []);
      setFaqs(editingPost.faq || []);
      setEventsGallery(editingPost.events_gallery || []);
      setTeaserVideo(editingPost.teaser_video || null);
      setSeo({
        meta_title: editingPost.meta_title,
        meta_description: editingPost.meta_description,
        slug: editingPost.slug
      });
      
      if (editingPost.description) {
        editor.commands.setContent(editingPost.description);
      }
    }
  }, [editingPost, editor]);

  useEffect(() => {
    if (title) {
      if (!seo.meta_title) {
        setSeo(prev => ({ ...prev, meta_title: title }));
      }
      if (!seo.slug) {
        setSeo(prev => ({ ...prev, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }));
      }
    }
    if (description && !seo.meta_description) {
      setSeo(prev => ({ ...prev, meta_description: description.substring(0, 160) }));
    }
  }, [title, description, seo.meta_title, seo.slug, seo.meta_description]);

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

  const insertImage = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const addSpeaker = () => {
    if (currentSpeaker.name.trim() && currentSpeaker.profile.trim()) {
      setSpeakersDetails([...speakersDetails, {
        ...currentSpeaker,
        name: currentSpeaker.name.trim(),
        profile: currentSpeaker.profile.trim(),
        photo: currentSpeaker.photo?.trim() || null,
        linkedIn: currentSpeaker.linkedIn?.trim() || null
      }]);
      setCurrentSpeaker({ name: '', profile: '', photo: '', linkedIn: '' });
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  console.log('Form submitted!');
  console.log('Form values:', { title, description, eventDate, eventTime, location, organizerName, organizerEmail });
  console.log('Location Type:', locationType);
  console.log('Raw Latitude:', locationGeo.lat, 'Raw Longitude:', locationGeo.lng);
  const parsedLat = locationType === 'physical' ? parseFloat(locationGeo.lat) : null;
  const parsedLng = locationType === 'physical' ? parseFloat(locationGeo.lng) : null;
  console.log('Parsed Latitude:', parsedLat, 'Parsed Longitude:', parsedLng);
    

  if (!title || !description || !eventDate || !eventTime || !duration || !location || !organizerName || !organizerEmail || !category || (locationType === 'physical' && (!locationGeo.lat || !locationGeo.lng || isNaN(parseFloat(locationGeo.lat)) || isNaN(parseFloat(locationGeo.lng)))) || (locationType === 'virtual' && !locationLink)) {
    if (locationType === 'physical' && (!locationGeo.lat || !locationGeo.lng || isNaN(parseFloat(locationGeo.lat)) || isNaN(parseFloat(locationGeo.lng)))) {
      console.log('Invalid latitude/longitude:', locationGeo);
    }
      console.log('Validation failed - missing required fields');
      const missingFields = [];
      if (!title) missingFields.push('Title');
      if (!description) missingFields.push('Description');
      if (!eventDate) missingFields.push('Event Date');
      if (!eventTime) missingFields.push('Event Time');
      if (!duration) missingFields.push('Duration');
  if (!location) missingFields.push('Location');
  if (!locationType) missingFields.push('Location Type');
  if (locationType === 'physical' && (!locationGeo.lat || !locationGeo.lng || isNaN(parseFloat(locationGeo.lat)) || isNaN(parseFloat(locationGeo.lng)))) missingFields.push('Valid Geolocation (Latitude/Longitude)');
  if (locationType === 'virtual' && !locationLink) missingFields.push('Event Link');
      if (!organizerName) missingFields.push('Organizer Name');
      if (!organizerEmail) missingFields.push('Organizer Email');
      if (!category) missingFields.push('Category');
      
      console.log('Missing fields:', missingFields);

    

    // Price *
    if (!price?.trim() || (priceType === 'custom' && !customPrice?.trim())) {
      missingFields.push('Price');
    }
    
    // Status * (should always have a default, but check anyway)
    if (!status) missingFields.push('Status');
    
    // Event Tags *
    if (tags.length === 0) missingFields.push('Event Tags (at least one tag)');
    
    // Speakers *
    if (speakersDetails.length === 0) missingFields.push('Speakers (at least one speaker)');
    
    // SEO Settings *
    if (!seo.meta_title?.trim()) missingFields.push('SEO Meta Title');
    if (!seo.meta_description?.trim()) missingFields.push('SEO Meta Description');
    if (!seo.slug?.trim()) missingFields.push('SEO URL Slug');
    
    // Additional required fields for completeness
    if (!organizerName?.trim()) missingFields.push('Organizer Name');
    if (!organizerEmail?.trim()) missingFields.push('Organizer Email');
    
    if (missingFields.length > 0) {
      console.log('Validation failed - missing required fields:', missingFields);
      toast({
        title: "Missing Required Fields",
        description: `Please fill in the following required fields: ${missingFields.join(', ')}`,
        variant: "destructive"
      });
      return;
    }

    console.log('Creating event object...');
  const event: EventPost = {
    id: editingPost?.id || `event-${Date.now()}`,
    user_id: editingPost?.user_id || '',
    title,
    description,
    event_date: eventDate,
    event_time: eventTime,
    duration,
    location,
    location_type: locationType,
    location_latitude: parsedLat,
    location_longitude: parsedLng,
    location_link: locationType === 'virtual' ? locationLink : null,
    organizer_name: organizerName,
    organizer_email: organizerEmail,
    organizer_phone: organizerPhone || null,
    capacity,
    category,
    price: price || null,
    registration_deadline: registrationDeadline || null,
    requirements: requirements || null,
    agenda: agenda || null,
    speakers: speakers.length > 0 ? speakers : null,
    sponsors: sponsors.length > 0 ? sponsors : null,
    additional_contact_info: additionalContactInfo || null,
    status,
    event_banner: eventBanner || null,
    featured_image: featuredImage || null,
    event_tags: tags,
    meta_title: seo.meta_title || title,
    meta_description: seo.meta_description || description.substring(0, 160),
    slug: seo.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
    created_at: editingPost?.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  console.log('Event object to be saved:', event);
  console.log('Calling onPostSaved with event:', event);
  onPostSaved(event);
    
    if (!editingPost) {
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
  setRegistrationDeadline('');
  setRequirements('');
  setAgenda('');
  setSpeakers([]);
  setSpeakerInput('');
  setSponsors([]);
  setSponsorInput('');
  setAdditionalContactInfo('');
  setStatus('upcoming');
  setEventBanner('');
  setFeaturedImage('');
  setTags([]);
  setTagInput('');
  setSeo({ meta_title: '', meta_description: '', slug: '' });
      editor?.commands.clearContent();
      setTitle('');
      setDescription('');
      setEventDate('');
      setEventTime('');
      setDuration('');
      setLocation('');
      setIsPhysical(true);
      setEventLink('');
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
      setAgenda('');
      setSpeakersDetails([]);
      setCurrentSpeaker({ name: '', profile: '', photo: '', linkedIn: '' });
      setSponsors([]);
      setSponsorInput('');
      setAdditionalContactInfo('');
      setStatus('upcoming');
      setEventBanner('');
      setFeaturedImage('');
      setTags([]);
      setTagInput('');
      setFaqs([]);
      setEventsGallery([]);
      setTeaserVideo(null);
      setSeo({ meta_title: '', meta_description: '', slug: '' });
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
                className="h-11 px-6 bg-purple-600 hover:bg-purple-700 shadow-xl shadow-purple-600/10 hover:shadow-md transition-all duration-200"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingPost ? 'Update Event' : 'Save Event'}
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

                {/* Event Type */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Event Type *
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Workshop">Workshop</SelectItem>
                      <SelectItem value="Training">Training</SelectItem>
                      <SelectItem value="Conference">Conference</SelectItem>
                      <SelectItem value="Lecture">Lecture</SelectItem>
                      <SelectItem value="Webinar">Webinar</SelectItem>
                      <SelectItem value="Tutorial">Tutorial</SelectItem>
                      <SelectItem value="Hackathon">Hackathon</SelectItem>
                      <SelectItem value="Internship">Internship</SelectItem>
                      <SelectItem value="Orientation">Orientation</SelectItem>
                      <SelectItem value="Team-building">Team-building</SelectItem>
                      <SelectItem value="Alumni-event">Alumni-event</SelectItem>
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
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g., 2 hours, 1 day"
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
                {/* Event Type Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700">
                    Event Type *
                  </Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Event venue or online name"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    required
                  />
                  <div className="mt-2 flex gap-4">
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
                    <div className="mt-2 grid grid-cols-2 gap-4 items-center">
                      <Input
                        type="text"
                        value={locationGeo.lat}
                        onChange={e => setLocationGeo({ ...locationGeo, lat: e.target.value })}
                        placeholder="Latitude"
                        className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        required
                      />
                      <Input
                        type="text"
                        value={locationGeo.lng}
                        onChange={e => setLocationGeo({ ...locationGeo, lng: e.target.value })}
                        placeholder="Longitude"
                        className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        required
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={geocodeAddress}
                        className="col-span-2 mt-2 flex items-center gap-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200"
                      >
                        <Search className="w-4 h-4" />
                        Get Coordinates from Address
                      </Button>
                    </div>
                  )}
                  {locationType === 'virtual' && (
                    <div className="mt-2">
                      <Input
                        type="url"
                        value={locationLink}
                        onChange={e => setLocationLink(e.target.value)}
                        placeholder="Event link (e.g. Zoom/Google Meet)"
                        className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
                        required
                      />
                    </div>
                  )}
                  <div className="flex gap-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        checked={isPhysical}
                        onChange={() => setIsPhysical(true)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Physical</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="eventType"
                        checked={!isPhysical}
                        onChange={() => setIsPhysical(false)}
                        className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 focus:ring-purple-500 focus:ring-2"
                      />
                      <span className="text-sm text-slate-700">Virtual</span>
                    </label>
                  </div>
                </div>
                
                {/* Conditional Fields based on Event Type */}
                {isPhysical ? (
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
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="event-link" className="text-sm font-medium text-slate-700">
                      Event Link *
                    </Label>
                    <Input
                      id="event-link"
                      value={eventLink}
                      onChange={(e) => setEventLink(e.target.value)}
                      placeholder="https://zoom.us/j/... or meeting link"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                      required
                    />
                  </div>
                )}
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
                <div className="space-y-2">
                  <Label htmlFor="agenda" className="text-sm font-medium text-slate-700">
                    Agenda
                  </Label>
                  <Textarea
                    id="agenda"
                    value={agenda}
                    onChange={(e) => setAgenda(e.target.value)}
                    placeholder="Event agenda or schedule..."
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                    rows={4}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="additional-contact" className="text-sm font-medium text-slate-700">
                    Additional Contact Info
                  </Label>
                  <Textarea
                    id="additional-contact"
                    value={additionalContactInfo}
                    onChange={(e) => setAdditionalContactInfo(e.target.value)}
                    placeholder="Any additional contact information..."
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                    rows={2}
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
                    <Label className="text-sm font-medium text-slate-700">Speaker Profile *</Label>
                    <Textarea
                      value={currentSpeaker.profile}
                      onChange={(e) => updateCurrentSpeaker('profile', e.target.value)}
                      placeholder="Brief description of the speaker's background and expertise..."
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">Photo URL</Label>
                    <Input
                      value={currentSpeaker.photo || ''}
                      onChange={(e) => updateCurrentSpeaker('photo', e.target.value)}
                      placeholder="https://example.com/speaker-photo.jpg"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">LinkedIn URL</Label>
                    <Input
                      value={currentSpeaker.linkedIn || ''}
                      onChange={(e) => updateCurrentSpeaker('linkedIn', e.target.value)}
                      placeholder="https://linkedin.com/in/speaker-profile"
                      className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                    />
                  </div>
                  
                  <Button
                    type="button"
                    onClick={addSpeaker}
                    disabled={!currentSpeaker.name.trim() || !currentSpeaker.profile.trim()}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 transition-all duration-200"
                  >
                    Add Speaker
                  </Button>
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
                                {speaker.linkedIn && (
                                  <a
                                    href={speaker.linkedIn}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                                  >
                                    LinkedIn Profile
                                  </a>
                                )}
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 line-clamp-2">{speaker.profile}</p>
                          </div>
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

            {/* SEO Settings */}
            <Card className="border-slate-200/50 shadow-sm bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Globe className="w-4 h-4 text-orange-500" />
                  SEO Settings *
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Optimize your event for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="meta-title" className="text-sm font-medium text-slate-700">
                    Meta Title *
                  </Label>
                  <Input
                    id="meta-title"
                    value={seo.meta_title}
                    onChange={(e) => setSeo(prev => ({ ...prev, meta_title: e.target.value }))}
                    placeholder="SEO title for search engines"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  <p className={`text-xs transition-colors duration-200 ${
                    seo.meta_title.length > 60 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {seo.meta_title.length}/60 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="meta-description" className="text-sm font-medium text-slate-700">
                    Meta Description *
                  </Label>
                  <Textarea
                    id="meta-description"
                    value={seo.meta_description}
                    onChange={(e) => setSeo(prev => ({ ...prev, meta_description: e.target.value }))}
                    placeholder="Brief description for search results"
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 resize-none transition-all duration-200"
                    rows={3}
                  />
                  <p className={`text-xs transition-colors duration-200 ${
                    seo.meta_description.length > 160 ? 'text-red-500' : 'text-slate-500'
                  }`}>
                    {seo.meta_description.length}/160 characters
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
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  <p className="text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded border">
                    URL: /events/{seo.slug || 'your-event-slug'}
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
};

export default NewPostSection;
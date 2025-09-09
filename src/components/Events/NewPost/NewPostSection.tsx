import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { EventPost, EventSEOSettings } from '../../../types/event';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Save, Upload, Bold, Italic, List, Link2, Heading1, Heading2, Heading3, Image as ImageIcon, X, Eye, Edit3, Sparkles, Hash, Globe, Calendar, Clock, MapPin, Users, Phone, Mail, DollarSign, Search } from 'lucide-react';
import { useToast } from '../../../hooks/use-toast';

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
  const [organizerName, setOrganizerName] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');
  const [organizerPhone, setOrganizerPhone] = useState('');
  const [capacity, setCapacity] = useState<number>(50);
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [requirements, setRequirements] = useState('');
  const [agenda, setAgenda] = useState('');
  const [speakers, setSpeakers] = useState<string[]>([]);
  const [speakerInput, setSpeakerInput] = useState('');
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
      setOrganizerName(editingPost.organizer_name);
      setOrganizerEmail(editingPost.organizer_email);
      setOrganizerPhone(editingPost.organizer_phone);
      setCapacity(editingPost.capacity);
      setCategory(editingPost.category);
      setPrice(editingPost.price || '');
      setRegistrationDeadline(editingPost.registration_deadline || '');
      setRequirements(editingPost.requirements || '');
      setAgenda(editingPost.agenda || '');
      setSpeakers(editingPost.speakers || []);
      setSponsors(editingPost.sponsors || []);
      setAdditionalContactInfo(editingPost.additional_contact_info || '');
      setStatus(editingPost.status);
      setEventBanner(editingPost.event_banner || '');
      setFeaturedImage(editingPost.featured_image || '');
      setTags(editingPost.event_tags || []);
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
    const trimmedSpeaker = speakerInput.trim();
    if (trimmedSpeaker && !speakers.includes(trimmedSpeaker)) {
      setSpeakers([...speakers, trimmedSpeaker]);
      setSpeakerInput('');
    }
  };

  const removeSpeaker = (speakerToRemove: string) => {
    setSpeakers(speakers.filter(speaker => speaker !== speakerToRemove));
  };

  const handleSpeakerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSpeaker();
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
      toast({
        title: "Missing Required Fields",
        description: `Please fill in: ${missingFields.join(', ')}`,
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

    console.log('Event object created:', event);
    console.log('Calling onPostSaved...');
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

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category *
                  </Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="h-12 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100">
                      <SelectValue placeholder="Select event category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="networking">Networking</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium text-slate-700">
                    Location *
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
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price" className="text-sm font-medium text-slate-700">
                    Price (Optional)
                  </Label>
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Free, $50, $100, etc."
                    className="border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
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
                    Status
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
                    Event Tags
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
                  Speakers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={speakerInput}
                    onChange={(e) => setSpeakerInput(e.target.value)}
                    onKeyDown={handleSpeakerKeyDown}
                    placeholder="Add speaker name..."
                    className="flex-1 border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition-all duration-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addSpeaker}
                    disabled={!speakerInput.trim()}
                    className="border-slate-200 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 transition-all duration-200"
                  >
                    Add
                  </Button>
                </div>
                
                {speakers.length > 0 && (
                  <div className="space-y-2">
                    {speakers.map((speaker, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-sm text-slate-700">{speaker}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpeaker(speaker)}
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
                  SEO Settings
                </CardTitle>
                <CardDescription className="text-slate-500">
                  Optimize your event for search engines
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="meta-title" className="text-sm font-medium text-slate-700">
                    Meta Title
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
                    Meta Description
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
                    URL Slug
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

export default NewPostSection;
import { useState } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Users, 
  Filter,
  Search,
  MoreHorizontal,
  ExternalLink,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  type: 'workshop' | 'webinar' | 'conference' | 'meetup' | 'other';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  attendees: number;
  maxAttendees?: number;
  organizer: string;
  registrationUrl?: string;
  tags: string[];
}

const EventsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const [events] = useState<Event[]>([
    {
      id: '1',
      title: 'React Advanced Patterns Workshop',
      description: 'Deep dive into advanced React patterns including render props, higher-order components, and custom hooks.',
      date: '2025-06-20',
      time: '10:00 AM',
      location: 'Tech Hub, Bangalore',
      type: 'workshop',
      status: 'upcoming',
      attendees: 45,
      maxAttendees: 50,
      organizer: 'RareMinds Team',
      registrationUrl: 'https://rareminds.in/events/react-workshop',
      tags: ['React', 'JavaScript', 'Frontend']
    },
    {
      id: '2',
      title: 'AI in Modern Web Development',
      description: 'Exploring how artificial intelligence is transforming web development workflows and tools.',
      date: '2025-06-25',
      time: '2:00 PM',
      location: 'Online Webinar',
      type: 'webinar',
      status: 'upcoming',
      attendees: 120,
      maxAttendees: 200,
      organizer: 'Dr. Sarah Johnson',
      registrationUrl: 'https://rareminds.in/events/ai-webinar',
      tags: ['AI', 'Web Development', 'Machine Learning']
    },
    {
      id: '3',
      title: 'JavaScript Meetup - June 2025',
      description: 'Monthly meetup for JavaScript developers to share knowledge and network.',
      date: '2025-06-15',
      time: '6:00 PM',
      location: 'Coffee House, HSR Layout',
      type: 'meetup',
      status: 'completed',
      attendees: 30,
      organizer: 'JS Community Bangalore',
      tags: ['JavaScript', 'Networking', 'Community']
    },
    {
      id: '4',
      title: 'Full Stack Developer Conference 2025',
      description: 'Annual conference featuring talks from industry leaders on the latest in full stack development.',
      date: '2025-07-10',
      time: '9:00 AM',
      location: 'Convention Center, Mumbai',
      type: 'conference',
      status: 'upcoming',
      attendees: 250,
      maxAttendees: 500,
      organizer: 'Dev Conference Org',
      registrationUrl: 'https://fullstackconf.in',
      tags: ['Full Stack', 'Conference', 'Networking']
    }
  ]);

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ongoing': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'completed': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: Event['type']) => {
    switch (type) {
      case 'workshop': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'webinar': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'conference': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'meetup': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = selectedFilter === 'all' || 
                         (selectedFilter === 'upcoming' && event.status === 'upcoming') ||
                         (selectedFilter === 'completed' && event.status === 'completed') ||
                         (selectedFilter === 'workshop' && event.type === 'workshop') ||
                         (selectedFilter === 'webinar' && event.type === 'webinar');
    
    return matchesSearch && matchesFilter;
  });

  const upcomingEvents = events.filter(event => event.status === 'upcoming');
  const completedEvents = events.filter(event => event.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="px-6 py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Events Management
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Organize and track workshops, webinars, and meetups
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <CalendarIcon className="w-4 h-4" />
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{events.length}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                  <p className="text-2xl font-bold text-blue-600">{upcomingEvents.length}</p>
                </div>
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{completedEvents.length}</p>
                </div>
                <Badge className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Attendees</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {events.reduce((sum, event) => sum + event.attendees, 0)}
                  </p>
                </div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events, descriptions, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSelectedFilter('all')}>
                  All Events
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter('upcoming')}>
                  Upcoming
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter('completed')}>
                  Completed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter('workshop')}>
                  Workshops
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedFilter('webinar')}>
                  Webinars
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Event
            </Button>
          </div>
        </div>

        {/* Events Tabs */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg leading-6">{event.title}</CardTitle>
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(event.status)} variant="secondary">
                            {event.status}
                          </Badge>
                          <Badge className={getTypeColor(event.type)} variant="secondary">
                            {event.type}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {event.registrationUrl && (
                            <DropdownMenuItem>
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Registration
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm line-clamp-2">
                      {event.description}
                    </CardDescription>

                    {/* Event Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>
                          {event.attendees} attendees
                          {event.maxAttendees && ` / ${event.maxAttendees} max`}
                        </span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Organizer */}
                    <div className="text-xs text-muted-foreground">
                      Organized by {event.organizer}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {event.registrationUrl && (
                        <Button variant="outline" size="sm" className="flex-1">
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Registration
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="upcoming">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  {/* Same card content as above */}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(event.status)} variant="secondary">
                        {event.status}
                      </Badge>
                      <Badge className={getTypeColor(event.type)} variant="secondary">
                        {event.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{event.description}</CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {completedEvents.map((event) => (
                <Card key={event.id} className="hover:shadow-lg transition-shadow">
                  {/* Same card content as above */}
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(event.status)} variant="secondary">
                        {event.status}
                      </Badge>
                      <Badge className={getTypeColor(event.type)} variant="secondary">
                        {event.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">{event.description}</CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-4 h-4" />
                        <span>{new Date(event.date).toLocaleDateString()} at {event.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>{event.attendees} attendees</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Empty State */}
        {filteredEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24">
            <CalendarIcon className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              No events found
            </h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchTerm || selectedFilter !== 'all' 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first event. You can organize workshops, webinars, and meetups."}
            </p>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Create Event
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EventsPage;

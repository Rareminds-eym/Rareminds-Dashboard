
import { EventPost } from '../../../types/event';
import { Plus, FileText, Calendar, TrendingUp, Video, Tag, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';

interface DashboardOverviewProps {
  events: EventPost[];
  onNewEvent: () => void;
  onViewEvents: () => void;
}

const DashboardOverview = ({ events, onNewEvent, onViewEvents }: DashboardOverviewProps) => {
  const recentEvents = events.slice(0, 3);
  const totalEvents = events.length;
  const thisMonthEvents = events.filter(event => {
    const eventDate = new Date(event.created_at);
    const now = new Date();
    return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
  }).length;

  // Get unique tags count
  const allTags = events.flatMap(event => event.event_tags || []);
  const uniqueTags = new Set(allTags).size;

  // Get upcoming events count
  const upcomingEvents = events.filter(event => event.status === 'upcoming').length;

  return (
    <div className="space-y-8 p-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Total Events</CardTitle>
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">
              All published events
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">This Month</CardTitle>
            <div className="p-2 bg-green-100 rounded-lg">
              <Calendar className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">{thisMonthEvents}</div>
            <p className="text-xs text-muted-foreground">
              Events this month
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Upcoming</CardTitle>
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-light text-foreground mb-1">
              {upcomingEvents}
            </div>
            <p className="text-xs text-muted-foreground">
              Upcoming events
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 rounded-2xl shadow-2xl shadow-black/10 bg-white/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={onNewEvent} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <Plus className="w-4 h-4 mr-3" />
              New Event
            </Button>
            <Button onClick={onViewEvents} variant="ghost" size="sm" className="w-full justify-start hover:bg-primary/10 rounded-lg">
              <FileText className="w-4 h-4 mr-3" />
              View All
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 rounded-3xl bg-white/50 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-xl font-light text-foreground">Recent Events</CardTitle>
          <CardDescription className="text-muted-foreground">Your latest published events</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {recentEvents.length > 0 ? (
            <div className="space-y-6">
              {recentEvents.map((event) => (
                <div 
                  key={event.id} 
                  className="group relative flex items-start space-x-4 p-4 rounded-xl hover:bg-secondary/30 transition-all duration-200 border border-transparent hover:border-border/50 cursor-pointer"
                  onClick={onViewEvents}
                >
                  {event.featured_image && (
                    <div className="relative overflow-hidden rounded-lg flex-shrink-0">
                      <img
                        src={event.featured_image}
                        alt={event.title}
                        className="w-20 h-20 object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-2">
                    <h4 className="font-medium text-foreground truncate text-lg group-hover:text-primary transition-colors">
                      {event.title}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {event.description || 'No description available'}
                    </p>
                    <div className="flex items-center space-x-3 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {event.event_tags?.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-primary/10 text-primary"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {(event.event_tags?.length || 0) > 2 && (
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-1 bg-slate-100 text-slate-600"
                          >
                            +{(event.event_tags?.length || 0) - 2} more
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-purple-600">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(event.event_date).toLocaleDateString()}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  {/* View Project Button - appears on hover */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/90 rounded-3xl backdrop-blur-sm border-border/50 hover:bg-primary hover:text-white shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewEvents();
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Project
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground mb-6 text-lg">No events yet. Create your first event to get started!</p>
              <Button onClick={onNewEvent} className="bg-primary hover:bg-primary/90 shadow-lg px-8 py-3 rounded-xl">
                <Plus className="w-4 h-4 mr-2" />
                Create First Event
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;

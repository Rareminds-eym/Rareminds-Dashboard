import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Plus, FileText, Eye } from 'lucide-react';
import { useEvents } from '../../hooks/useEvents';

const EventsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { events } = useEvents();

  // Determine active section based on current route
  const getActiveSection = () => {
    const path = location.pathname;
    if (path.includes('/new-event')) return 'new-event';
    if (path.includes('/list')) return 'list';
    return 'overview';
  };

  const activeSection = getActiveSection();

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
              <p className="text-slate-600 dark:text-slate-400">Manage and track your Events</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1 bg-slate-100/60 dark:bg-slate-800/60 rounded-full p-1">
              <button
                onClick={() => navigate('/events')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'overview'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Eye className="w-4 h-4 inline mr-2" />
                Overview
              </button>
              <button
                onClick={() => navigate('/events/new-event')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'new-event'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <Plus className="w-4 h-4 inline mr-2" />
                New Event
              </button>
              <button
                onClick={() => navigate('/events/list')}
                className={`relative px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 ${
                  activeSection === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-slate-800/50'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/50'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Events
                <span className="ml-1 px-2 py-0.5 text-xs bg-slate-200 dark:bg-slate-600 rounded-full">
                  {events.length}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
};

export default EventsPage;

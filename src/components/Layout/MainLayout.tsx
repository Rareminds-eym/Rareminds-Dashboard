import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  FolderOpen, 
  LogOut, 
  Menu, 
  X,
  Home,
  Calendar,
  Heart
} from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../hooks/useAuth';

const MainLayout = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate to auth page after successful signout
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
      // Even if there's an error, navigate to auth page
      navigate('/auth', { replace: true });
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      icon: Home,
      href: '/',
      current: location.pathname === '/'
    },
    {
      name: 'Blog',
      icon: FileText,
      href: '/blog',
      current: location.pathname.startsWith('/blog')
    },
    {
      name: 'Projects',
      icon: FolderOpen,
      href: '/projects',
      current: location.pathname.startsWith('/projects')
    },
    {
      name: 'Events',
      icon: Calendar,
      href: '/events',
      current: location.pathname.startsWith('/events')
    },
    {
      name: 'Nanmaduvalan',
      icon: Heart,
      href: '/nanmaduvalan',
      current: location.pathname.startsWith('/nanmaduvalan')
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-700/50 transform transition-transform duration-300 ease-in-out lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200/50 dark:border-slate-700/50">
            <img 
              src="https://rareminds.in/RareMinds.webp" 
              alt="RareMinds" 
              className="h-8 w-auto object-contain" 
            />
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 text-left rounded-xl transition-all duration-200
                    ${item.current
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </nav>

          {/* User info and sign out */}
          <div className="border-t border-slate-200/50 dark:border-slate-700/50 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-slate-900 dark:bg-white flex items-center justify-center">
                <span className="text-sm font-medium text-white dark:text-slate-900">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={handleSignOut}
              className="w-full justify-start gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header for mobile */}
        <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-6 lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <img 
            src="https://rareminds.in/RareMinds.webp" 
            alt="RareMinds" 
            className="h-8 w-auto object-contain" 
          />
        </div>

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;

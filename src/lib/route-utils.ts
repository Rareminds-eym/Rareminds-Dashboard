// Route paths for type safety and consistency
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  BLOG: '/blog',
  PROJECTS: '/projects',
  AUTH: '/auth',
} as const;

// Type for route paths
export type RouteType = typeof ROUTES[keyof typeof ROUTES];

// Helper function to check if current path matches route
export const isActiveRoute = (pathname: string, route: string): boolean => {
  if (route === ROUTES.HOME) {
    return pathname === route;
  }
  return pathname.startsWith(route);
};

// Navigation helper functions
export const getRouteTitle = (pathname: string): string => {
  switch (pathname) {
    case ROUTES.HOME:
      return 'Dashboard';
    case ROUTES.BLOG:
      return 'Blog';
    case ROUTES.PROJECTS:
      return 'Projects';
    case ROUTES.AUTH:
      return 'Authentication';
    default:
      return 'Page Not Found';
  }
};

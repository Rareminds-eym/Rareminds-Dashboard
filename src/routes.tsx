import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './components/Layout/MainLayout';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { Skeleton } from './components/ui/skeleton';

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const BlogPage = lazy(() => import('./pages/Blog/BlogPage'));
const BlogOverviewPage = lazy(() => import('./pages/Blog/Dashboard/BlogOverviewPage'));
const BlogNewPostPage = lazy(() => import('./pages/Blog/NewPost/BlogNewPostPage'));
const BlogPostsPage = lazy(() => import('./pages/Blog/PostedPosts/BlogPostsPage'));
const BlogDraftsPage = lazy(() => import('./pages/Blog/DraftPost/BlogDraftsPage'));
const ProjectsPage = lazy(() => import('./pages/Projects/ProjectsPage'));
const ProjectsOverviewPage = lazy(() => import('./pages/Projects/Overview/ProjectsOverviewPage'));
const ProjectDraftsPage = lazy(() => import('./pages/Projects/DraftProject/ProjectDraftsPage'));
const EventsPage = lazy(() => import('./pages/Events/EventsPage'));
const NanmaduvalanPage = lazy(() => import('./pages/NanmaduvalanPage'));
const AuthPageWrapper = lazy(() => import('./pages/AuthPageWrapper'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading component for lazy-loaded routes
const RouteLoading = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="space-y-4 w-full max-w-md mx-auto p-6">
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-32 w-full" />
    </div>
  </div>
);

// Layout wrapper for protected routes
const ProtectedLayout = () => (
  <ProtectedRoute>
    <MainLayout />
  </ProtectedRoute>
);

// Route configuration
export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <Suspense fallback={<RouteLoading />}>
        <ProtectedLayout />
      </Suspense>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoading />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'dashboard',
        element: <Navigate to="/" replace />,
      },
      {
        path: 'blog',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <BlogPage />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteLoading />}>
                <BlogOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'new-post',
            element: (
              <Suspense fallback={<RouteLoading />}>
                <BlogNewPostPage />
              </Suspense>
            ),
          },
          {
            path: 'posts',
            element: (
              <Suspense fallback={<RouteLoading />}>
                <BlogPostsPage />
              </Suspense>
            ),
          },
          {
            path: 'drafts',
            element: (
              <Suspense fallback={<RouteLoading />}>
                <BlogDraftsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'projects',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <ProjectsPage />
          </Suspense>
        ),
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<RouteLoading />}>
                <ProjectsOverviewPage />
              </Suspense>
            ),
          },
          {
            path: 'drafts',
            element: (
              <Suspense fallback={<RouteLoading />}>
                <ProjectDraftsPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'events',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <EventsPage />
          </Suspense>
        ),
      },
      {
        path: 'nanmaduvalan',
        element: (
          <Suspense fallback={<RouteLoading />}>
            <NanmaduvalanPage />
          </Suspense>
        ),
      },
    ],
    errorElement: (
      <Suspense fallback={<RouteLoading />}>
        <NotFound />
      </Suspense>
    ),
  },
  {
    path: '/auth',
    element: (
      <Suspense fallback={<RouteLoading />}>
        <AuthPageWrapper />
      </Suspense>
    ),
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<RouteLoading />}>
        <NotFound />
      </Suspense>
    ),
  },
]);

export default router;

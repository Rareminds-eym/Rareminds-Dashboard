import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import AuthPage from '../components/Auth/AuthPage';

const AuthPageWrapper = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-200 dark:border-slate-700 rounded-full animate-spin border-t-slate-900 dark:border-t-white mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent rounded-full animate-ping border-t-slate-400 dark:border-t-slate-500 mx-auto"></div>
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Loading...</h2>
            <p className="text-slate-500 dark:text-slate-400">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  // If user is already authenticated, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  return <AuthPage />;
};

export default AuthPageWrapper;

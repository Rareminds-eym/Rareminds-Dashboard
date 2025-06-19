
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  saveStoredAuth, 
  getStoredAuth, 
  clearStoredAuth,
  isSessionValid
} from '@/lib/auth-utils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // First, try to get auth data from localStorage
    const { session: storedSession, user: storedUser } = getStoredAuth();
    
    if (storedSession && storedUser && isSessionValid(storedSession)) {
      setSession(storedSession);
      setUser(storedUser);
      setLoading(false);
      
      // Validate the stored session with Supabase
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!currentSession) {
          // Session is invalid, clear everything
          clearStoredAuth();
          setSession(null);
          setUser(null);
        }
      });
    }

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, 'Session:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Save to localStorage when signed in
        if (event === 'SIGNED_IN' && session) {
          saveStoredAuth(session, session.user);
        }
        
        // Clear localStorage when signed out
        if (event === 'SIGNED_OUT') {
          clearStoredAuth();
        }
        
        // Update localStorage on token refresh
        if (event === 'TOKEN_REFRESHED' && session) {
          saveStoredAuth(session, session.user);
        }
      }
    );

    // Check for existing session if no stored session found
    if (!storedSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Save to localStorage if session exists
        if (session) {
          saveStoredAuth(session, session.user);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      // Clear local storage first
      clearStoredAuth();
      
      // Force update local state first
      setSession(null);
      setUser(null);
      
      // Check if there's a valid session before attempting sign out
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (currentSession) {
        // Only attempt sign out if there's an active session
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          console.error('Error signing out from Supabase:', error);
          // Don't throw error here as local state is already cleared
        }
      } else {
        console.log('No active session found, local sign out completed');
      }
    } catch (error) {
      console.error('Error during sign out:', error);
      // Even if there's an error, ensure local state and storage are cleared
      clearStoredAuth();
      setSession(null);
      setUser(null);
      // Don't re-throw the error as sign out should always succeed locally
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

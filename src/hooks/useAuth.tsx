
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { 
  saveStoredAuth, 
  getStoredAuth, 
  clearStoredAuth 
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
    
    if (storedSession && storedUser) {
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
        console.log('Auth state changed:', event);
        
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Save to localStorage when signed in
        if (event === 'SIGNED_IN' && session) {
          saveStoredAuth(session, session.user);
        }
        
        // Clear localStorage when signed out or token refreshed
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
    clearStoredAuth();
    await supabase.auth.signOut();
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

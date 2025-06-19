import { User, Session } from '@supabase/supabase-js';

// LocalStorage keys for auth data
const AUTH_KEYS = {
  SESSION: 'blog_auth_session',
  USER: 'blog_auth_user',
  EXPIRES_AT: 'blog_auth_expires_at'
};

/**
 * Clear authentication data from localStorage
 */
export const clearStoredAuth = (): void => {
  try {
    console.log('Clearing stored auth data');
    localStorage.removeItem(AUTH_KEYS.SESSION);
    localStorage.removeItem(AUTH_KEYS.USER);
    localStorage.removeItem(AUTH_KEYS.EXPIRES_AT);
  } catch (error) {
    console.error('Error clearing auth from localStorage:', error);
  }
};

/**
 * Save authentication data to localStorage
 */
export const saveStoredAuth = (session: Session | null, user: User | null): void => {
  try {
    if (session && user) {
      localStorage.setItem(AUTH_KEYS.SESSION, JSON.stringify(session));
      localStorage.setItem(AUTH_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(AUTH_KEYS.EXPIRES_AT, session.expires_at?.toString() || '');
    }
  } catch (error) {
    console.error('Error saving auth to localStorage:', error);
  }
};

/**
 * Get authentication data from localStorage
 */
export const getStoredAuth = (): { session: Session | null; user: User | null } => {
  try {
    const sessionStr = localStorage.getItem(AUTH_KEYS.SESSION);
    const userStr = localStorage.getItem(AUTH_KEYS.USER);
    const expiresAt = localStorage.getItem(AUTH_KEYS.EXPIRES_AT);
    
    if (sessionStr && userStr && expiresAt) {
      const session = JSON.parse(sessionStr) as Session;
      const user = JSON.parse(userStr) as User;
      const expiryTime = parseInt(expiresAt);
      
      // Check if session is still valid (with 1 minute buffer)
      const currentTime = Date.now() / 1000;
      const bufferTime = 60; // 1 minute buffer
      
      if (expiryTime && currentTime < (expiryTime - bufferTime)) {
        return { session, user };
      } else {
        // Session expired, clear storage
        clearStoredAuth();
      }
    }
  } catch (error) {
    console.error('Error reading auth from localStorage:', error);
    clearStoredAuth();
  }
  
  return { session: null, user: null };
};

/**
 * Check if there's valid authentication data in localStorage
 */
export const hasValidStoredAuth = (): boolean => {
  const { session, user } = getStoredAuth();
  return !!(session && user);
};

/**
 * Safely check if a session is still valid
 */
export const isSessionValid = (session: Session | null): boolean => {
  if (!session) return false;
  
  try {
    const expiryTime = session.expires_at;
    if (!expiryTime) return false;
    
    const currentTime = Date.now() / 1000;
    const bufferTime = 60; // 1 minute buffer
    
    return currentTime < (expiryTime - bufferTime);
  } catch (error) {
    console.error('Error validating session:', error);
    return false;
  }
};

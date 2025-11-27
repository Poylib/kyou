/**
 * Authentication Store (Zustand v5)
 * 
 * Manages user authentication state with Google OAuth.
 * Works with Expo Go using web browser OAuth flow.
 * 
 * @see https://docs.pmnd.rs/zustand/getting-started/introduction
 */

import { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Profile } from '../types/database';

interface AuthState {
  // State
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  signInWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  /**
   * Initialize auth state and set up listener
   * Call this once when app starts
   */
  initialize: async () => {
    try {
      set({ isLoading: true });

      // Get initial session
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error.message);
        set({ isLoading: false, isInitialized: true });
        return;
      }

      if (session?.user) {
        set({ user: session.user, session });
        await get().fetchProfile();
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          set({ user: session.user, session });
          await get().fetchProfile();
        } else {
          set({ user: null, session: null, profile: null });
        }
      });

      set({ isLoading: false, isInitialized: true });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ isLoading: false, isInitialized: true, error: 'Failed to initialize auth' });
    }
  },

  /**
   * Sign in with Google OAuth
   * Uses web browser for OAuth flow (works in Expo Go)
   */
  signInWithGoogle: async () => {
    set({ isLoading: true, error: null });

    try {
      // Create redirect URL for the app
      const redirectUrl = Linking.createURL('auth/callback');
      console.log('Redirect URL:', redirectUrl);

      // Start OAuth flow
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      if (!data.url) {
        set({ isLoading: false, error: 'No OAuth URL returned' });
        return { success: false, error: 'No OAuth URL returned' };
      }

      // Open browser for OAuth
      const result = await WebBrowser.openAuthSessionAsync(
        data.url,
        redirectUrl,
        { showInRecents: true }
      );

      if (result.type === 'success') {
        // Parse the URL to get tokens
        const url = result.url;
        const params = new URL(url);
        
        // Check for hash fragment (Supabase returns tokens in hash)
        const hashParams = new URLSearchParams(params.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set session with tokens
          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            set({ isLoading: false, error: sessionError.message });
            return { success: false, error: sessionError.message };
          }

          if (sessionData.user) {
            set({ 
              user: sessionData.user, 
              session: sessionData.session,
              isLoading: false 
            });

            // Create profile if it doesn't exist
            await createProfileIfNeeded(sessionData.user);
            await get().fetchProfile();

            return { success: true };
          }
        }

        // Fallback: try to get session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          set({ user: session.user, session, isLoading: false });
          await get().fetchProfile();
          return { success: true };
        }
      }

      if (result.type === 'cancel' || result.type === 'dismiss') {
        set({ isLoading: false });
        return { success: false, error: 'cancelled' };
      }

      set({ isLoading: false });
      return { success: false, error: 'Authentication failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Sign In failed';
      console.error('Google Sign In error:', error);
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async () => {
    set({ isLoading: true });

    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error.message);
      }

      set({ 
        user: null, 
        session: null, 
        profile: null, 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error signing out:', error);
      set({ isLoading: false });
    }
  },

  /**
   * Fetch user profile from database
   */
  fetchProfile: async () => {
    const { user } = get();
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        // Profile might not exist yet for new users
        if (error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error.message);
        }
        return;
      }

      set({ profile: data });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    set({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        set({ isLoading: false, error: error.message });
        return { success: false, error: error.message };
      }

      set({ profile: data, isLoading: false });
      return { success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Update failed';
      set({ isLoading: false, error: message });
      return { success: false, error: message };
    }
  },

  /**
   * Clear error message
   */
  clearError: () => set({ error: null }),
}));

/**
 * Helper: Create profile if it doesn't exist (for new OAuth users)
 */
async function createProfileIfNeeded(user: User) {
  try {
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!existingProfile) {
      // Get display name from user metadata
      const displayName = user.user_metadata?.full_name 
        || user.user_metadata?.name 
        || user.email?.split('@')[0] 
        || 'User';
      
      const avatarUrl = user.user_metadata?.avatar_url 
        || user.user_metadata?.picture 
        || null;

      await supabase.from('profiles').insert({
        id: user.id,
        nickname: displayName,
        avatar_url: avatarUrl,
        default_level: 'N4',
      });

      console.log('Profile created for new user');
    }
  } catch (error) {
    console.error('Error creating profile:', error);
  }
}

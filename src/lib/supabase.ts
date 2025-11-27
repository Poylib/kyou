/**
 * Supabase Client Configuration
 * 
 * This module initializes the Supabase client for React Native with Expo.
 * Uses AsyncStorage for session persistence.
 * 
 * @see https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';

/**
 * Environment variables (set in .env.local)
 * 
 * Create a .env.local file in the project root with:
 * 
 * EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
 * EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
 * 
 * Get these values from: Supabase Dashboard > Settings > API
 */
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please create a .env.local file with EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Supabase client instance
 * 
 * Configured with:
 * - AsyncStorage for session persistence
 * - Auto token refresh
 * - Session persistence across app restarts
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Important for React Native
  },
});

/**
 * Helper function to get current user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting user:', error.message);
    return null;
  }
  return user;
};

/**
 * Helper function to get current session
 */
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) {
    console.error('Error getting session:', error.message);
    return null;
  }
  return session;
};


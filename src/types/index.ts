/**
 * Type exports
 * Central export point for all types
 */

export * from './database';

// Auth related types
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthState {
  user: AuthUser | null;
  profile: import('./database').Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// Translation request/response types
export interface TranslationRequest {
  text: string;
  level: import('./database').LearningLevel;
}

export interface TranslationResponse {
  translated_text: string;
  vocabulary: import('./database').VocabularyItem[];
  grammar_point: import('./database').GrammarPoint;
}

// Mood type for diary entries
export interface MoodOption {
  emoji: string;
  label: string;
}

// Weather type for diary entries
export interface WeatherOption {
  icon: string;
  label: string;
  color: string;
}


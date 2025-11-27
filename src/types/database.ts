/**
 * Supabase Database Types
 * 
 * These types represent the database schema defined in Supabase.
 * Keep in sync with actual database tables.
 */

// Profile table - extends auth.users
export interface Profile {
  id: string; // uuid, references auth.users(id)
  nickname: string | null;
  avatar_url: string | null;
  default_level: LearningLevel;
  created_at: string;
  updated_at: string;
}

// Diary table - main content table
export interface Diary {
  id: string; // uuid, primary key
  user_id: string; // uuid, foreign key to auth.users
  date: string; // date, yyyy-mm-dd format
  mood: string; // emoji string
  weather: string | null; // weather condition
  original_text: string; // Korean diary text
  translated_text: string; // Japanese translation
  learning_level: LearningLevel;
  vocabulary_data: VocabularyItem[];
  grammar_point: GrammarPoint | null;
  created_at: string;
  updated_at: string;
}

// Vocabulary item structure (stored as JSONB)
export interface VocabularyItem {
  word: string; // Japanese word (kanji)
  reading: string; // Hiragana reading
  meaning: string; // Korean meaning
  example?: string; // Example sentence in Japanese
  example_meaning?: string; // Example sentence meaning in Korean
}

// Grammar point structure (stored as JSONB or text)
export interface GrammarPoint {
  pattern: string; // e.g., "〜てみたい"
  title: string; // Korean title e.g., "~해보고 싶다"
  explanation: string; // Japanese explanation
  korean_explanation: string; // Korean explanation
  examples: GrammarExample[];
}

export interface GrammarExample {
  japanese: string;
  korean: string;
}

// JLPT Learning levels
export type LearningLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';

// Database row types for Supabase queries
export type DiaryRow = Diary;
export type ProfileRow = Profile;

// Insert types (without auto-generated fields)
export type DiaryInsert = Omit<Diary, 'id' | 'created_at' | 'updated_at'>;
export type ProfileInsert = Omit<Profile, 'created_at' | 'updated_at'>;

// Update types (partial, without id)
export type DiaryUpdate = Partial<Omit<Diary, 'id' | 'user_id' | 'created_at'>>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

// Supabase Database type definition
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      diaries: {
        Row: DiaryRow;
        Insert: DiaryInsert;
        Update: DiaryUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      learning_level: LearningLevel;
    };
  };
}


-- =============================================
-- Kyou Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname TEXT,
  avatar_url TEXT,
  default_level VARCHAR(2) DEFAULT 'N4' CHECK (default_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- 2. DIARIES TABLE (main content)
-- =============================================
CREATE TABLE IF NOT EXISTS diaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  mood TEXT NOT NULL, -- emoji string
  weather TEXT, -- weather condition (optional)
  original_text TEXT NOT NULL, -- Korean diary text
  translated_text TEXT, -- Japanese translation (nullable until translated)
  learning_level VARCHAR(2) DEFAULT 'N4' CHECK (learning_level IN ('N5', 'N4', 'N3', 'N2', 'N1')),
  vocabulary_data JSONB DEFAULT '[]'::jsonb, -- [{word, reading, meaning, example, example_meaning}]
  grammar_point JSONB, -- {pattern, title, explanation, korean_explanation, examples}
  is_translated BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint: one diary per user per day
  UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_diaries_user_id ON diaries(user_id);
CREATE INDEX IF NOT EXISTS idx_diaries_date ON diaries(date DESC);
CREATE INDEX IF NOT EXISTS idx_diaries_user_date ON diaries(user_id, date DESC);

-- RLS for diaries
ALTER TABLE diaries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own diaries" ON diaries;
DROP POLICY IF EXISTS "Users can insert own diaries" ON diaries;
DROP POLICY IF EXISTS "Users can update own diaries" ON diaries;
DROP POLICY IF EXISTS "Users can delete own diaries" ON diaries;

CREATE POLICY "Users can view own diaries" ON diaries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diaries" ON diaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diaries" ON diaries
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diaries" ON diaries
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 3. HELPER FUNCTIONS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for diaries updated_at
DROP TRIGGER IF EXISTS update_diaries_updated_at ON diaries;
CREATE TRIGGER update_diaries_updated_at
  BEFORE UPDATE ON diaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 4. USEFUL VIEWS (optional)
-- =============================================

-- View for diary stats
CREATE OR REPLACE VIEW user_diary_stats AS
SELECT 
  user_id,
  COUNT(*) as total_diaries,
  COUNT(CASE WHEN is_translated THEN 1 END) as translated_count,
  COUNT(DISTINCT date) as unique_days,
  MIN(date) as first_diary_date,
  MAX(date) as last_diary_date
FROM diaries
GROUP BY user_id;

-- Grant access to the view
GRANT SELECT ON user_diary_stats TO authenticated;

-- =============================================
-- Done! Your database is ready 🍵
-- =============================================


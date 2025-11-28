-- Create vocabulary_book table
CREATE TABLE vocabulary_book (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    reading TEXT NOT NULL,
    meaning TEXT NOT NULL,
    example TEXT,
    example_meaning TEXT,
    is_memorized BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE vocabulary_book ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Select: Users can view their own vocabulary
CREATE POLICY "Users can view own vocabulary" ON vocabulary_book
    FOR SELECT USING (auth.uid() = user_id);

-- Insert: Users can insert their own vocabulary
CREATE POLICY "Users can insert own vocabulary" ON vocabulary_book
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update: Users can update their own vocabulary
CREATE POLICY "Users can update own vocabulary" ON vocabulary_book
    FOR UPDATE USING (auth.uid() = user_id);

-- Delete: Users can delete their own vocabulary
CREATE POLICY "Users can delete own vocabulary" ON vocabulary_book
    FOR DELETE USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX vocabulary_user_id_idx ON vocabulary_book(user_id);
CREATE INDEX vocabulary_diary_id_idx ON vocabulary_book(diary_id);


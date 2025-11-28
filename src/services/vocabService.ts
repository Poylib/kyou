/**
 * Vocabulary Service
 * 
 * Handles all CRUD operations for vocabulary book.
 * Interacts with Supabase 'vocabulary_book' table.
 */

import { supabase } from '../lib/supabase';
import { VocabularyBookInsert, VocabularyBookItem } from '../types/database';

// Response type for service functions
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Add a word to vocabulary book
 */
export async function addWord(
  wordData: Omit<VocabularyBookInsert, 'user_id'>
): Promise<ServiceResponse<VocabularyBookItem>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('vocabulary_book')
      .insert({
        ...wordData,
        user_id: user.id,
      } as any)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '단어 저장에 실패했어요' 
    };
  }
}

/**
 * Get all words for current user
 */
export async function getWords(options?: {
  filter?: 'all' | 'memorized' | 'learning';
  orderBy?: 'created_at' | 'word';
  ascending?: boolean;
}): Promise<ServiceResponse<VocabularyBookItem[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    const { filter = 'all', orderBy = 'created_at', ascending = false } = options || {};

    let query = supabase
      .from('vocabulary_book')
      .select('*')
      .eq('user_id', user.id);

    // Apply filter
    if (filter === 'memorized') {
      query = query.eq('is_memorized', true);
    } else if (filter === 'learning') {
      query = query.eq('is_memorized', false);
    }

    // Apply sorting
    query = query.order(orderBy, { ascending });

    const { data, error } = await query;

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '단어장을 불러오는데 실패했어요' 
    };
  }
}

/**
 * Toggle memorized status
 */
export async function toggleMemorized(
  id: string,
  currentStatus: boolean
): Promise<ServiceResponse<VocabularyBookItem>> {
  try {
    const { data, error } = await supabase
      .from('vocabulary_book')
      .update({ is_memorized: !currentStatus } as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '상태 변경에 실패했어요' 
    };
  }
}

/**
 * Delete a word
 */
export async function deleteWord(id: string): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('vocabulary_book')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '단어 삭제에 실패했어요' 
    };
  }
}

/**
 * Check if word already exists in diary context
 * (Optional: to prevent duplicate adds from same diary)
 */
export async function checkWordExists(
  word: string,
  diaryId?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    let query = supabase
      .from('vocabulary_book')
      .select('id')
      .eq('user_id', user.id)
      .eq('word', word);

    if (diaryId) {
      query = query.eq('diary_id', diaryId);
    }

    const { data, error } = await query.maybeSingle();

    return !!data && !error;
  } catch {
    return false;
  }
}


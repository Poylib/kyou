/**
 * Diary Service
 * 
 * Handles all CRUD operations for diary entries.
 * Interacts with Supabase database.
 */

import { supabase } from '../lib/supabase';
import { 
  Diary, 
  DiaryInsert, 
  DiaryUpdate, 
  VocabularyItem, 
  GrammarPoint,
  LearningLevel 
} from '../types/database';

// Response type for service functions
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Create a new diary entry
 */
export async function createDiary(
  diary: Omit<DiaryInsert, 'user_id'>
): Promise<ServiceResponse<Diary>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('diaries')
      .insert({
        ...diary,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      // Handle unique constraint violation (duplicate date)
      if (error.code === '23505') {
        return { data: null, error: '이 날짜에 이미 일기가 있어요' };
      }
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '일기 저장에 실패했어요' 
    };
  }
}

/**
 * Get a single diary by ID
 */
export async function getDiaryById(id: string): Promise<ServiceResponse<Diary>> {
  try {
    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '일기를 불러오는데 실패했어요' 
    };
  }
}

/**
 * Get diary by date for current user
 */
export async function getDiaryByDate(date: string): Promise<ServiceResponse<Diary>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (error) {
      // PGRST116 means no rows found, which is not an error for this use case
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '일기를 불러오는데 실패했어요' 
    };
  }
}

/**
 * Get all diaries for current user
 */
export async function getAllDiaries(options?: {
  limit?: number;
  offset?: number;
  orderBy?: 'date' | 'created_at';
  ascending?: boolean;
}): Promise<ServiceResponse<Diary[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    const { limit = 50, offset = 0, orderBy = 'date', ascending = false } = options || {};

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id)
      .order(orderBy, { ascending })
      .range(offset, offset + limit - 1);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '일기 목록을 불러오는데 실패했어요' 
    };
  }
}

/**
 * Get diaries for a specific month
 */
export async function getDiariesByMonth(
  year: number, 
  month: number
): Promise<ServiceResponse<Diary[]>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    // Calculate date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    const { data, error } = await supabase
      .from('diaries')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '일기 목록을 불러오는데 실패했어요' 
    };
  }
}

/**
 * Update a diary entry
 */
export async function updateDiary(
  id: string, 
  updates: DiaryUpdate
): Promise<ServiceResponse<Diary>> {
  try {
    const { data, error } = await supabase
      .from('diaries')
      .update(updates)
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
      error: error instanceof Error ? error.message : '일기 수정에 실패했어요' 
    };
  }
}

/**
 * Update diary with translation results
 */
export async function updateDiaryWithTranslation(
  id: string,
  translationData: {
    translated_text: string;
    vocabulary_data: VocabularyItem[];
    grammar_point: GrammarPoint;
  }
): Promise<ServiceResponse<Diary>> {
  try {
    const { data, error } = await supabase
      .from('diaries')
      .update({
        ...translationData,
        is_translated: true,
      })
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
      error: error instanceof Error ? error.message : '번역 결과 저장에 실패했어요' 
    };
  }
}

/**
 * Delete a diary entry
 */
export async function deleteDiary(id: string): Promise<ServiceResponse<boolean>> {
  try {
    const { error } = await supabase
      .from('diaries')
      .delete()
      .eq('id', id);

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: true, error: null };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '일기 삭제에 실패했어요' 
    };
  }
}

/**
 * Get diary statistics for current user
 */
export async function getDiaryStats(): Promise<ServiceResponse<{
  totalDiaries: number;
  translatedCount: number;
  totalVocabulary: number;
  currentStreak: number;
  maxStreak: number;
}>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: '로그인이 필요합니다' };
    }

    // Get all diaries for stats calculation
    const { data: diaries, error } = await supabase
      .from('diaries')
      .select('date, is_translated, vocabulary_data')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!diaries || diaries.length === 0) {
      return {
        data: {
          totalDiaries: 0,
          translatedCount: 0,
          totalVocabulary: 0,
          currentStreak: 0,
          maxStreak: 0,
        },
        error: null,
      };
    }

    // Calculate stats
    const totalDiaries = diaries.length;
    const translatedCount = diaries.filter(d => d.is_translated).length;
    const totalVocabulary = diaries.reduce((sum, d) => {
      const vocab = d.vocabulary_data as VocabularyItem[] | null;
      return sum + (vocab?.length || 0);
    }, 0);

    // Calculate streak
    const { currentStreak, maxStreak } = calculateStreak(diaries.map(d => d.date));

    return {
      data: {
        totalDiaries,
        translatedCount,
        totalVocabulary,
        currentStreak,
        maxStreak,
      },
      error: null,
    };
  } catch (error) {
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '통계를 불러오는데 실패했어요' 
    };
  }
}

/**
 * Check if diary exists for today
 */
export async function hasTodayDiary(): Promise<ServiceResponse<boolean>> {
  const today = new Date().toISOString().split('T')[0];
  const result = await getDiaryByDate(today);
  return { data: result.data !== null, error: result.error };
}

/**
 * Helper function to calculate streak
 */
function calculateStreak(dates: string[]): { currentStreak: number; maxStreak: number } {
  if (dates.length === 0) {
    return { currentStreak: 0, maxStreak: 0 };
  }

  // Sort dates in descending order (most recent first)
  const sortedDates = [...dates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 1;
  
  // Check if most recent diary is today or yesterday
  const mostRecentDate = new Date(sortedDates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);
  
  const dayDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (dayDiff > 1) {
    // Streak is broken
    currentStreak = 0;
  } else {
    currentStreak = 1;
    
    // Count consecutive days
    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      prevDate.setHours(0, 0, 0, 0);
      currDate.setHours(0, 0, 0, 0);
      
      const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diff === 1) {
        currentStreak++;
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
        break;
      }
    }
  }
  
  // Calculate max streak through all dates
  tempStreak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    prevDate.setHours(0, 0, 0, 0);
    currDate.setHours(0, 0, 0, 0);
    
    const diff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 1) {
      tempStreak++;
    } else {
      maxStreak = Math.max(maxStreak, tempStreak);
      tempStreak = 1;
    }
  }
  maxStreak = Math.max(maxStreak, tempStreak, currentStreak);
  
  return { currentStreak, maxStreak };
}


/**
 * Translation Service
 * 
 * Calls Supabase Edge Function for AI translation.
 * Handles the translation request/response flow.
 */

import { supabase } from '../lib/supabase';
import { VocabularyItem, GrammarPoint, LearningLevel } from '../types/database';

// Response type from Edge Function
interface TranslationResponse {
  translated_text: string;
  vocabulary: VocabularyItem[];
  grammar_point: GrammarPoint;
}

// Service response type
interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

/**
 * Translate diary text using AI
 * 
 * @param text - Korean diary text to translate
 * @param level - JLPT level (N5-N1)
 * @returns Translation result with vocabulary and grammar
 */
export async function translateDiary(
  text: string,
  level: LearningLevel
): Promise<ServiceResponse<TranslationResponse>> {
  try {
    // Validate input
    if (!text || text.trim().length < 10) {
      return { data: null, error: '텍스트가 너무 짧아요 (최소 10자)' };
    }

    // Call Edge Function
    const { data, error } = await supabase.functions.invoke('translate-diary', {
      body: { text: text.trim(), level },
    });

    if (error) {
      console.error('Edge Function error:', error);
      return { 
        data: null, 
        error: error.message || '번역 요청에 실패했어요' 
      };
    }

    // Check for error in response body
    if (data?.error) {
      return { data: null, error: data.error };
    }

    // Validate response structure
    if (!data?.translated_text || !data?.vocabulary || !data?.grammar_point) {
      return { data: null, error: '번역 응답 형식이 올바르지 않아요' };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Translation service error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : '번역 중 오류가 발생했어요' 
    };
  }
}

/**
 * Translate and save to diary
 * 
 * Combines translation with diary update in one call.
 * 
 * @param diaryId - ID of the diary to update
 * @param text - Korean text to translate
 * @param level - JLPT level
 * @param updateDiaryFn - Function to update diary in database
 */
export async function translateAndSave(
  diaryId: string,
  text: string,
  level: LearningLevel,
  updateDiaryFn: (id: string, data: {
    translated_text: string;
    vocabulary_data: VocabularyItem[];
    grammar_point: GrammarPoint;
  }) => Promise<{ success: boolean; error?: string }>
): Promise<ServiceResponse<TranslationResponse>> {
  // Get translation
  const translationResult = await translateDiary(text, level);
  
  if (translationResult.error || !translationResult.data) {
    return translationResult;
  }

  // Save to diary
  const saveResult = await updateDiaryFn(diaryId, {
    translated_text: translationResult.data.translated_text,
    vocabulary_data: translationResult.data.vocabulary,
    grammar_point: translationResult.data.grammar_point,
  });

  if (!saveResult.success) {
    return { data: null, error: saveResult.error || '저장에 실패했어요' };
  }

  return translationResult;
}


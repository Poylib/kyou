/**
 * Diary Store (Zustand v5)
 * 
 * Manages diary state and caching.
 * Integrates with diaryService for API calls.
 */

import { create } from 'zustand';
import * as diaryService from '../services/diaryService';
import { Diary, GrammarPoint, VocabularyItem } from '../types/database';

interface DiaryStats {
  totalDiaries: number;
  translatedCount: number;
  totalVocabulary: number;
  currentStreak: number;
  maxStreak: number;
}

interface DiaryState {
  // State
  diaries: Diary[];
  currentDiary: Diary | null;
  stats: DiaryStats | null;
  isLoading: boolean;
  error: string | null;
  hasTodayDiary: boolean;
  
  // Cache control
  lastFetched: number | null; // Timestamp
  currentParams: string | null; // To identify if query params changed

  // Actions
  fetchDiaries: (options?: { limit?: number; offset?: number; forceRefresh?: boolean }) => Promise<void>;
  fetchDiariesByMonth: (year: number, month: number, forceRefresh?: boolean) => Promise<void>;
  fetchDiaryById: (id: string) => Promise<Diary | null>;
  fetchDiaryByDate: (date: string) => Promise<Diary | null>;
  fetchStats: () => Promise<void>;
  checkTodayDiary: () => Promise<void>;
  
  createDiary: (diary: {
    date: string;
    mood: string;
    weather?: string;
    original_text: string;
    learning_level: string;
  }) => Promise<{ success: boolean; diary?: Diary; error?: string }>;
  
  updateDiaryTranslation: (
    id: string,
    data: {
      translated_text: string;
      vocabulary_data: VocabularyItem[];
      grammar_point: GrammarPoint;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  
  deleteDiary: (id: string) => Promise<{ success: boolean; error?: string }>;
  
  setCurrentDiary: (diary: Diary | null) => void;
  clearError: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useDiaryStore = create<DiaryState>((set, get) => ({
  // Initial state
  diaries: [],
  currentDiary: null,
  stats: null,
  isLoading: false,
  error: null,
  hasTodayDiary: false,
  lastFetched: null,
  currentParams: null,

  /**
   * Fetch all diaries
   */
  fetchDiaries: async (options) => {
    const { lastFetched, currentParams, diaries } = get();
    const paramKey = `all-${JSON.stringify(options)}`;
    const now = Date.now();
    const isStale = !lastFetched || (now - lastFetched > CACHE_DURATION);
    const paramsChanged = currentParams !== paramKey;
    const force = options?.forceRefresh;

    // If not forced, not stale, same params, and has data, return early
    if (!force && !isStale && !paramsChanged && diaries.length > 0) {
      return; 
    }

    // Show loading only if params changed or forced (or first load)
    // If it's just a stale background refresh, we could optionally hide loading, 
    // but keeping it simple: load = show loading
    if (paramsChanged || force || diaries.length === 0) {
        set({ isLoading: true, error: null });
    }

    const result = await diaryService.getAllDiaries(options);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return;
    }

    set({ 
        diaries: result.data || [], 
        isLoading: false,
        lastFetched: now,
        currentParams: paramKey
    });
  },

  /**
   * Fetch diaries for a specific month
   */
  fetchDiariesByMonth: async (year, month, forceRefresh) => {
    const { lastFetched, currentParams, diaries } = get();
    const paramKey = `month-${year}-${month}`;
    const now = Date.now();
    const isStale = !lastFetched || (now - lastFetched > CACHE_DURATION);
    const paramsChanged = currentParams !== paramKey;

    if (!forceRefresh && !isStale && !paramsChanged && diaries.length > 0) {
      return;
    }

    if (paramsChanged || forceRefresh || diaries.length === 0) {
        set({ isLoading: true, error: null });
    }

    const result = await diaryService.getDiariesByMonth(year, month);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return;
    }

    set({ 
        diaries: result.data || [], 
        isLoading: false,
        lastFetched: now,
        currentParams: paramKey
    });
  },

  /**
   * Fetch single diary by ID
   */
  fetchDiaryById: async (id) => {
    set({ isLoading: true, error: null });

    const result = await diaryService.getDiaryById(id);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return null;
    }

    set({ currentDiary: result.data, isLoading: false });
    return result.data;
  },

  /**
   * Fetch diary by date
   */
  fetchDiaryByDate: async (date) => {
    const result = await diaryService.getDiaryByDate(date);

    if (result.error) {
      return null;
    }

    return result.data;
  },

  /**
   * Fetch user stats
   * Silently fails if user is not logged in
   */
  fetchStats: async () => {
    const result = await diaryService.getDiaryStats();

    if (result.error) {
      // Don't log error for unauthenticated users (expected behavior)
      if (!result.error.includes('로그인')) {
        console.error('Failed to fetch stats:', result.error);
      }
      return;
    }

    set({ stats: result.data });
  },

  /**
   * Check if today's diary exists
   */
  checkTodayDiary: async () => {
    const result = await diaryService.hasTodayDiary();
    set({ hasTodayDiary: result.data || false });
  },

  /**
   * Create a new diary
   */
  createDiary: async (diary) => {
    set({ isLoading: true, error: null });

    const result = await diaryService.createDiary({
      date: diary.date,
      mood: diary.mood,
      weather: diary.weather || null,
      original_text: diary.original_text,
      learning_level: diary.learning_level as any,
      translated_text: '',
      vocabulary_data: [],
      grammar_point: null,
    });

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return { success: false, error: result.error };
    }

    // Update local state
    set((state) => ({
      diaries: [result.data!, ...state.diaries],
      currentDiary: result.data,
      isLoading: false,
      hasTodayDiary: diary.date === new Date().toISOString().split('T')[0],
      // Mark cache as fresh since we updated locally
      lastFetched: Date.now()
    }));

    // Refresh stats
    get().fetchStats();

    return { success: true, diary: result.data! };
  },

  /**
   * Update diary with translation
   */
  updateDiaryTranslation: async (id, data) => {
    set({ isLoading: true, error: null });

    const result = await diaryService.updateDiaryWithTranslation(id, data);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return { success: false, error: result.error };
    }

    // Update local state
    set((state) => ({
      diaries: state.diaries.map((d) => (d.id === id ? result.data! : d)),
      currentDiary: state.currentDiary?.id === id ? result.data : state.currentDiary,
      isLoading: false,
    }));

    // Refresh stats
    get().fetchStats();

    return { success: true };
  },

  /**
   * Delete a diary
   */
  deleteDiary: async (id) => {
    set({ isLoading: true, error: null });

    const result = await diaryService.deleteDiary(id);

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return { success: false, error: result.error };
    }

    // Update local state
    set((state) => ({
      diaries: state.diaries.filter((d) => d.id !== id),
      currentDiary: state.currentDiary?.id === id ? null : state.currentDiary,
      isLoading: false,
    }));

    // Refresh stats and check today
    get().fetchStats();
    get().checkTodayDiary();

    return { success: true };
  },

  /**
   * Set current diary for viewing/editing
   */
  setCurrentDiary: (diary) => {
    set({ currentDiary: diary });
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));

/**
 * Vocabulary Store (Zustand v5)
 * 
 * Manages vocabulary book state.
 * Integrates with vocabService.
 */

import { create } from 'zustand';
import * as vocabService from '../services/vocabService';
import { VocabularyBookItem, VocabularyItem } from '../types/database';

interface VocabState {
  // State
  words: VocabularyBookItem[];
  filter: 'all' | 'memorized' | 'learning';
  isLoading: boolean;
  error: string | null;

  // Cache control
  lastFetched: number | null;
  currentFilter: string | null;

  // Actions
  fetchWords: (forceRefresh?: boolean) => Promise<void>;
  addWord: (word: VocabularyItem, diaryId: string, originalText?: string) => Promise<{ success: boolean; error?: string }>;
  toggleMemorized: (id: string) => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  setFilter: (filter: 'all' | 'memorized' | 'learning') => void;
}

const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (Vocabulary changes less frequently)

export const useVocabStore = create<VocabState>((set, get) => ({
  // Initial state
  words: [],
  filter: 'all',
  isLoading: false,
  error: null,
  lastFetched: null,
  currentFilter: null,

  /**
   * Fetch words based on current filter
   */
  fetchWords: async (forceRefresh) => {
    const { filter, lastFetched, currentFilter, words } = get();
    const now = Date.now();
    const isStale = !lastFetched || (now - lastFetched > CACHE_DURATION);
    const filterChanged = currentFilter !== filter;

    // If not forced, not stale, same filter, and has data, return early
    if (!forceRefresh && !isStale && !filterChanged && words.length > 0) {
      return;
    }

    // Show loading only if filter changed or forced or first load
    if (filterChanged || forceRefresh || words.length === 0) {
        set({ isLoading: true, error: null });
    }

    const result = await vocabService.getWords({
      filter,
      orderBy: 'created_at',
      ascending: false,
    });

    if (result.error) {
      set({ isLoading: false, error: result.error });
      return;
    }

    set({ 
        words: result.data || [], 
        isLoading: false,
        lastFetched: now,
        currentFilter: filter
    });
  },

  /**
   * Add a word from diary result
   */
  addWord: async (word, diaryId, originalText) => {
    // Example logic
    const example = word.example || (originalText ? `(일기에서: ${originalText.substring(0, 50)}...)` : null);
    const exampleMeaning = word.example_meaning || null;

    const result = await vocabService.addWord({
      diary_id: diaryId,
      word: word.word,
      reading: word.reading,
      meaning: word.meaning,
      example: example,
      example_meaning: exampleMeaning,
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    // Optimistic update
    const { filter } = get();
    if (filter === 'all' || filter === 'learning') {
      set((state) => ({
        words: [result.data!, ...state.words],
        lastFetched: Date.now() // Update cache timestamp
      }));
    }

    return { success: true };
  },

  /**
   * Toggle memorized status
   */
  toggleMemorized: async (id) => {
    const { words } = get();
    const word = words.find(w => w.id === id);
    if (!word) return;

    // Optimistic update
    const newStatus = !word.is_memorized;
    set((state) => ({
      words: state.words.map(w => 
        w.id === id ? { ...w, is_memorized: newStatus } : w
      )
    }));

    const result = await vocabService.toggleMemorized(id, word.is_memorized);

    if (result.error) {
      // Revert on failure
      set((state) => ({
        words: state.words.map(w => 
          w.id === id ? { ...w, is_memorized: word.is_memorized } : w
        ),
        error: result.error
      }));
    } else {
      // If filter is active, we might need to remove the item
      const { filter } = get();
      if (filter !== 'all') {
        // Refresh list to respect filter
        get().fetchWords(true); // Force refresh to apply filter correctly on server side logic if needed, or handle locally
      } else {
          // Update cache timestamp
          set({ lastFetched: Date.now() });
      }
    }
  },

  /**
   * Delete a word
   */
  deleteWord: async (id) => {
    // Optimistic update
    const { words } = get();
    const wordToDelete = words.find(w => w.id === id);
    
    set((state) => ({
      words: state.words.filter(w => w.id !== id)
    }));

    const result = await vocabService.deleteWord(id);

    if (result.error) {
      // Revert on failure
      if (wordToDelete) {
        set((state) => ({
          words: [...state.words, wordToDelete].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
          error: result.error
        }));
      }
    } else {
        set({ lastFetched: Date.now() });
    }
  },

  /**
   * Set filter and refetch
   */
  setFilter: (filter) => {
    set({ filter });
    get().fetchWords();
  }
}));

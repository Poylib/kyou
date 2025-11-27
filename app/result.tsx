import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView,
  Share,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  X,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Copy,
  Check,
  Share2,
  Trash2,
  RefreshCw
} from 'lucide-react-native';
import { useDiaryStore } from '../src/stores/diaryStore';
import { translateDiary } from '../src/services/translateService';
import { Diary, VocabularyItem, GrammarPoint, LearningLevel } from '../src/types/database';

/**
 * Translation Result Screen
 * 
 * Supports two modes:
 * 1. Normal mode: Load diary from DB, translate, save
 * 2. Guest mode: Translate without DB (no login required)
 */

// Guest diary type for non-logged-in users
interface GuestDiary {
  id: string;
  date: string;
  mood: string;
  weather: string | null;
  original_text: string;
  translated_text: string | null;
  learning_level: string;
  vocabulary_data: VocabularyItem[];
  grammar_point: GrammarPoint | null;
  is_translated: boolean;
}

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    diaryId?: string; 
    isNew?: string;
    guestMode?: string;
    text?: string;
    mood?: string;
    weather?: string;
    level?: string;
    date?: string;
  }>();
  
  const { currentDiary, fetchDiaryById, updateDiaryTranslation, deleteDiary, isLoading } = useDiaryStore();
  
  const [diary, setDiary] = useState<Diary | GuestDiary | null>(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  // Perform translation (works for both modes)
  const performTranslation = async (text: string, level: string) => {
    setIsTranslating(true);
    setTranslationError(null);

    try {
      const result = await translateDiary(text, level as LearningLevel);

      if (result.error || !result.data) {
        console.warn('API translation failed:', result.error);
        setTranslationError(result.error || '번역 API 오류');
        return null;
      }

      return result.data;
    } catch (error) {
      console.error('Translation error:', error);
      setTranslationError('번역 중 오류가 발생했어요');
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  // Load diary data
  useEffect(() => {
    const loadData = async () => {
      // Guest mode: Create temporary diary from params
      if (params.guestMode === 'true' && params.text) {
        setIsGuestMode(true);
        
        const guestDiary: GuestDiary = {
          id: 'guest-' + Date.now(),
          date: params.date || new Date().toISOString().split('T')[0],
          mood: params.mood || '😊',
          weather: params.weather || null,
          original_text: params.text,
          translated_text: null,
          learning_level: params.level || 'N4',
          vocabulary_data: [],
          grammar_point: null,
          is_translated: false,
        };
        
        setDiary(guestDiary);
        setIsTranslating(true);

        // Perform translation
        const translationData = await performTranslation(params.text, params.level || 'N4');
        
        if (translationData) {
          setDiary({
            ...guestDiary,
            translated_text: translationData.translated_text,
            vocabulary_data: translationData.vocabulary,
            grammar_point: translationData.grammar_point,
            is_translated: true,
          });
          setIsSaved(true);
        }
        
        return;
      }

      // Normal mode: Load from DB
      if (params.diaryId) {
        const fetched = await fetchDiaryById(params.diaryId);
        if (fetched) {
          setDiary(fetched);
          
          // If it's a new diary and not translated yet, perform translation
          if (params.isNew === 'true' && !fetched.is_translated) {
            setIsTranslating(true);
            
            const translationData = await performTranslation(
              fetched.original_text, 
              fetched.learning_level
            );
            
            if (translationData) {
              // Save to DB
              const saveResult = await updateDiaryTranslation(fetched.id, {
                translated_text: translationData.translated_text,
                vocabulary_data: translationData.vocabulary,
                grammar_point: translationData.grammar_point,
              });

              if (saveResult.success) {
                const updated = await fetchDiaryById(fetched.id);
                if (updated) {
                  setDiary(updated);
                  setIsSaved(true);
                }
              }
            }
          } else {
            setIsSaved(fetched.is_translated);
          }
        }
      } else if (currentDiary) {
        setDiary(currentDiary);
        setIsSaved(currentDiary.is_translated);
      }
    };

    loadData();
  }, [params.diaryId, params.isNew, params.guestMode, params.text]);

  // Retry translation
  const handleRetryTranslation = async () => {
    if (!diary) return;
    
    setIsTranslating(true);
    const translationData = await performTranslation(
      diary.original_text, 
      diary.learning_level
    );
    
    if (translationData) {
      if (isGuestMode) {
        // Guest mode: Just update local state
        setDiary({
          ...diary,
          translated_text: translationData.translated_text,
          vocabulary_data: translationData.vocabulary,
          grammar_point: translationData.grammar_point,
          is_translated: true,
        });
        setIsSaved(true);
        setTranslationError(null);
      } else {
        // Normal mode: Save to DB
        const saveResult = await updateDiaryTranslation(diary.id, {
          translated_text: translationData.translated_text,
          vocabulary_data: translationData.vocabulary,
          grammar_point: translationData.grammar_point,
        });

        if (saveResult.success) {
          const updated = await fetchDiaryById(diary.id);
          if (updated) {
            setDiary(updated);
            setIsSaved(true);
            setTranslationError(null);
          }
        }
      }
    }
  };

  // Handle copy to clipboard
  const handleCopy = async (text: string, index: number) => {
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Handle TTS (deferred feature)
  const handleSpeak = () => {
    alert('🔊 음성 재생 기능은 곧 추가될 예정이에요!');
  };

  // Handle share
  const handleShare = async () => {
    if (!diary) return;
    
    try {
      await Share.share({
        message: `📝 오늘의 일기\n\n${diary.original_text}\n\n🇯🇵 일본어 번역\n${diary.translated_text || ''}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Handle delete (only for normal mode)
  const handleDelete = () => {
    if (!diary || isGuestMode) return;
    
    Alert.alert(
      '일기 삭제',
      '정말 이 일기를 삭제할까요?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            const result = await deleteDiary(diary.id);
            if (result.success) {
              router.replace('/(tabs)');
            } else {
              Alert.alert('오류', result.error || '삭제에 실패했어요');
            }
          }
        }
      ]
    );
  };

  // Handle done
  const handleDone = () => {
    router.replace('/(tabs)');
  };

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  // Loading state
  if ((isLoading && !isGuestMode) || !diary) {
    return (
      <SafeAreaView className="flex-1 bg-bg-canvas items-center justify-center">
        <ActivityIndicator size="large" color="#7AA06E" />
        <Text className="text-text-sub mt-4">일기 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  // Translating state
  if (isTranslating) {
    return (
      <SafeAreaView className="flex-1 bg-bg-canvas items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-brand-light items-center justify-center mb-6">
          <Sparkles size={40} color="#7AA06E" strokeWidth={1.5} />
        </View>
        <Text className="text-xl font-bold text-text-main mb-2">
          AI가 번역 중이에요...
        </Text>
        <Text className="text-sm text-text-sub text-center leading-relaxed">
          Gemini AI가 일본어 번역과{'\n'}학습 자료를 준비하고 있어요 🍵
        </Text>
        <ActivityIndicator className="mt-6" color="#7AA06E" />
      </SafeAreaView>
    );
  }

  const vocabulary = (diary.vocabulary_data || []) as VocabularyItem[];
  const grammar = diary.grammar_point as GrammarPoint | null;

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-brand-light">
        <Pressable 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-bg-surface items-center justify-center active:bg-brand-light"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 4,
          }}
        >
          <X size={20} color="#4B4036" strokeWidth={2} />
        </Pressable>
        
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">{diary.mood}</Text>
          <View className="bg-brand-light px-3 py-1 rounded-full">
            <Text className="text-xs font-semibold text-brand-dark">{diary.learning_level}</Text>
          </View>
          {isGuestMode && (
            <View className="bg-accent/30 px-2 py-1 rounded-full ml-2">
              <Text className="text-xs font-medium text-amber-700">게스트</Text>
            </View>
          )}
        </View>

        <View className="flex-row gap-2">
          <Pressable 
            onPress={handleShare}
            className="w-10 h-10 rounded-full bg-bg-surface items-center justify-center active:bg-brand-light"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
            }}
          >
            <Share2 size={20} color="#4B4036" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Translation Error Banner */}
        {translationError && (
          <View className="mx-5 mt-4 bg-error/10 rounded-xl p-3 flex-row items-center justify-between">
            <Text className="text-sm text-error flex-1">
              ⚠️ {translationError}
            </Text>
            <Pressable 
              onPress={handleRetryTranslation}
              className="ml-2 bg-brand px-3 py-1.5 rounded-full flex-row items-center"
            >
              <RefreshCw size={14} color="white" strokeWidth={2} />
              <Text className="text-white text-xs font-medium ml-1">재시도</Text>
            </Pressable>
          </View>
        )}

        {/* Guest Mode Notice */}
        {isGuestMode && !translationError && (
          <View className="mx-5 mt-4 bg-accent/20 rounded-xl p-3">
            <Text className="text-sm text-amber-700">
              👋 게스트 모드입니다. 로그인하면 일기가 저장돼요!
            </Text>
          </View>
        )}

        {/* Date */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-sm text-text-sub font-medium">
            📅 {formatDisplayDate(diary.date)}
          </Text>
        </View>

        {/* Original Text (Collapsible) */}
        <View className="mx-5 mb-4">
          <Pressable 
            onPress={() => setShowOriginal(!showOriginal)}
            className="flex-row items-center justify-between py-2"
          >
            <Text className="text-sm font-medium text-text-sub">원문 보기</Text>
            {showOriginal ? (
              <ChevronUp size={18} color="#8C857B" strokeWidth={2} />
            ) : (
              <ChevronDown size={18} color="#8C857B" strokeWidth={2} />
            )}
          </Pressable>
          
          {showOriginal && (
            <View 
              className="bg-bg-surface rounded-2xl p-4 mt-2"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text className="text-base text-text-main leading-relaxed">
                {diary.original_text}
              </Text>
            </View>
          )}
        </View>

        {/* Japanese Translation - Hero Section */}
        {diary.translated_text ? (
          <View className="mx-5 mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Sparkles size={18} color="#7AA06E" strokeWidth={2} />
                <Text className="text-base font-semibold text-text-main ml-2">
                  일본어 번역
                </Text>
              </View>
              <Pressable 
                onPress={handleSpeak}
                className="flex-row items-center bg-brand-light px-3 py-1.5 rounded-full active:bg-brand-light/70"
              >
                <Volume2 size={16} color="#56744C" strokeWidth={2} />
                <Text className="text-xs font-medium text-brand-dark ml-1">듣기</Text>
              </Pressable>
            </View>
            
            <View 
              className="bg-bg-surface rounded-3xl p-5"
              style={{
                shadowColor: '#7AA06E',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 16,
                borderWidth: 1,
                borderColor: '#EFF5ED',
              }}
            >
              <Text 
                className="text-xl text-text-main leading-loose tracking-wide"
                style={{ lineHeight: 36 }}
              >
                {diary.translated_text}
              </Text>
            </View>
          </View>
        ) : (
          <View className="mx-5 mb-6 bg-bg-surface rounded-2xl p-6 items-center">
            <Text className="text-sm text-text-sub">번역 결과가 없어요</Text>
            <Pressable 
              onPress={handleRetryTranslation}
              className="mt-3 bg-brand px-4 py-2 rounded-full"
            >
              <Text className="text-white font-medium">다시 번역하기</Text>
            </Pressable>
          </View>
        )}

        {/* Vocabulary Section */}
        {vocabulary.length > 0 && (
          <View className="mb-6">
            <View className="px-5 mb-3">
              <Text className="text-base font-semibold text-text-main">
                📚 핵심 어휘 {vocabulary.length}
              </Text>
            </View>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {vocabulary.map((vocab, index) => (
                <Pressable
                  key={index}
                  onPress={() => handleCopy(vocab.word, index)}
                  className="bg-bg-surface rounded-2xl p-4 active:scale-[0.98]"
                  style={{
                    width: 200,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 10,
                  }}
                >
                  {/* Word & Reading */}
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-2xl font-bold text-text-main">
                        {vocab.word}
                      </Text>
                      <Text className="text-sm text-brand font-medium mt-0.5">
                        {vocab.reading}
                      </Text>
                    </View>
                    {copiedIndex === index ? (
                      <View className="w-7 h-7 rounded-full bg-brand items-center justify-center">
                        <Check size={14} color="white" strokeWidth={3} />
                      </View>
                    ) : (
                      <View className="w-7 h-7 rounded-full bg-brand-light items-center justify-center">
                        <Copy size={14} color="#56744C" strokeWidth={2} />
                      </View>
                    )}
                  </View>

                  {/* Meaning */}
                  <Text className="text-base text-text-main font-medium mb-3">
                    {vocab.meaning}
                  </Text>

                  {/* Example */}
                  {vocab.example && (
                    <View className="bg-brand-light/50 rounded-xl p-2.5">
                      <Text className="text-sm text-text-main">
                        {vocab.example}
                      </Text>
                      {vocab.example_meaning && (
                        <Text className="text-xs text-text-sub mt-0.5">
                          {vocab.example_meaning}
                        </Text>
                      )}
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Grammar Point Section */}
        {grammar && (
          <View className="mx-5 mb-6">
            <Text className="text-base font-semibold text-text-main mb-3">
              💡 원포인트 문법
            </Text>
            
            <View 
              className="bg-bg-surface rounded-3xl p-5"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                borderLeftWidth: 4,
                borderLeftColor: '#EBCD78',
              }}
            >
              {/* Pattern Badge */}
              <View className="flex-row items-center mb-3">
                <View className="bg-accent/20 px-3 py-1.5 rounded-full">
                  <Text className="text-sm font-bold text-amber-700">
                    {grammar.pattern}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-text-main ml-2">
                  {grammar.title}
                </Text>
              </View>

              {/* Explanation */}
              <View className="bg-brand-light/30 rounded-xl p-3 mb-4">
                <Text className="text-sm text-text-main leading-relaxed mb-2">
                  {grammar.explanation}
                </Text>
                <Text className="text-sm text-text-sub leading-relaxed">
                  {grammar.korean_explanation}
                </Text>
              </View>

              {/* Examples */}
              {grammar.examples && grammar.examples.length > 0 && (
                <View className="gap-2">
                  {grammar.examples.map((ex, index) => (
                    <View 
                      key={index} 
                      className="flex-row items-center"
                    >
                      <View className="w-5 h-5 rounded-full bg-brand-light items-center justify-center mr-2">
                        <Text className="text-xs font-bold text-brand-dark">{index + 1}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-base text-text-main">{ex.japanese}</Text>
                        <Text className="text-sm text-text-sub">{ex.korean}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Learning Tip */}
        <View className="mx-5 mb-4">
          <View className="bg-brand-light rounded-2xl p-4 flex-row items-start">
            <Text className="text-xl mr-2">🍵</Text>
            <View className="flex-1">
              <Text className="text-sm font-medium text-brand-dark leading-relaxed">
                오늘 배운 어휘와 문법을 내일 일기에서 직접 사용해보세요! 
                반복 사용이 기억에 가장 효과적이에요.
              </Text>
            </View>
          </View>
        </View>

        {/* Delete Button (only for normal mode) */}
        {!isGuestMode && (
          <View className="mx-5">
            <Pressable
              onPress={handleDelete}
              className="flex-row items-center justify-center py-3 active:opacity-70"
            >
              <Trash2 size={16} color="#D97D7D" strokeWidth={2} />
              <Text className="text-error text-sm font-medium ml-1">일기 삭제</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom CTA */}
      <View 
        className="absolute bottom-0 left-0 right-0 px-5 pb-8 pt-4 bg-bg-canvas"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
        }}
      >
        <Pressable
          onPress={handleDone}
          className="h-14 rounded-full flex-row items-center justify-center gap-2 bg-brand active:bg-brand-dark"
          style={{
            shadowColor: '#7AA06E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Check size={20} color="white" strokeWidth={3} />
          <Text className="text-white font-semibold text-base">
            {isGuestMode ? '홈으로' : (isSaved ? '완료' : '홈으로')}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

import { useRouter } from 'expo-router';
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Lightbulb,
  PenLine,
  RefreshCw,
  Sparkles
} from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDailyPrompt } from '../../src/constants/prompts';
import { useAuthStore } from '../../src/stores/authStore';
import { useDiaryStore } from '../../src/stores/diaryStore';
import { useVocabStore } from '../../src/stores/vocabStore';
import { VocabularyBookItem } from '../../src/types/database';

/**
 * Home Screen - "Growth & Memory" Redesign
 * 
 * Structure:
 * 1. Header: Greeting & Date
 * 2. Weekly Progress: Visual "Lawn" (Dots)
 * 3. Hero Action: Writing Prompt (Focus)
 * 4. Learning Widget: Daily Word
 * 5. Memory Lane: Archive Link / Past Diary
 */

export default function HomeScreen() {
  const router = useRouter();
  
  // Stores
  const { user, profile } = useAuthStore();
  const { 
    diaries, 
    hasTodayDiary, 
    isLoading: isDiaryLoading,
    fetchDiaries, 
    checkTodayDiary 
  } = useDiaryStore();
  const { 
    words, 
    isLoading: isVocabLoading, 
    fetchWords, 
    toggleMemorized 
  } = useVocabStore();

  // Local State
  const [dailyPrompt, setDailyPrompt] = useState<string>('');
  const [dailyWord, setDailyWord] = useState<VocabularyBookItem | null>(null);

  // Init Data
  useEffect(() => {
    if (user) {
      // 최근 일기를 넉넉히 가져와서 주간 현황 파악
      fetchDiaries({ limit: 14 });
      checkTodayDiary();
      fetchWords(); // 단어장 로드
      setDailyPrompt(getDailyPrompt());
    }
  }, [user]);

  // Randomly select a word to learn
  useEffect(() => {
    if (words.length > 0 && !dailyWord) {
      const learningWords = words.filter(w => !w.is_memorized);
      if (learningWords.length > 0) {
        const random = learningWords[Math.floor(Math.random() * learningWords.length)];
        setDailyWord(random);
      }
    }
  }, [words]);

  // Change word handler
  const refreshWord = () => {
    const learningWords = words.filter(w => !w.is_memorized);
    if (learningWords.length > 0) {
      let newWord;
      // Avoid selecting the same word if possible
      do {
        newWord = learningWords[Math.floor(Math.random() * learningWords.length)];
      } while (learningWords.length > 1 && newWord.id === dailyWord?.id);
      setDailyWord(newWord);
    }
  };

  // Date Setup
  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  const dayName = dayNames[today.getDay()]; // 0-6 (Sun-Sat)

  // Weekly Progress Logic
  const weeklyData = useMemo(() => {
    const currentDay = today.getDay(); // 0 (Sun) ~ 6 (Sat)
    // Calculate start of week (Monday as start)
    // If today is Sunday (0), we want to go back 6 days to Monday
    // If today is Monday (1), we go back 0 days
    const diffToMon = currentDay === 0 ? 6 : currentDay - 1; 
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMon);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Check if diary exists for this date
      const hasDiary = diaries.some(diary => diary.date === dateStr);
      const isToday = dateStr === today.toISOString().split('T')[0];
      const isFuture = d > today;

      weekDays.push({
        dayName: dayNames[d.getDay()],
        dateStr,
        hasDiary,
        isToday,
        isFuture
      });
    }
    return weekDays;
  }, [diaries]);

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['left', 'right']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header & Weekly Progress Combined */}
        <View className="px-5 pt-6 pb-6 bg-bg-canvas">
          <View className="flex-row justify-between items-start mb-6">
            <View>
              <Text className="text-sm text-text-sub font-medium mb-1">
                {formattedDate} {dayName}요일
              </Text>
              <Text className="text-2xl font-bold text-text-main">
                {profile?.nickname ? `안녕하세요, ${profile.nickname}님` : '오늘도 기록해보세요'}
              </Text>
            </View>
            {/* Streak Badge (Small) */}
            <View className="bg-brand-light px-3 py-1.5 rounded-full flex-row items-center">
              <Sparkles size={14} color="#56744C" strokeWidth={2.5} />
              <Text className="text-xs font-bold text-brand-dark ml-1.5">
                연속 {useDiaryStore.getState().stats?.currentStreak || 0}일
              </Text>
            </View>
          </View>

          {/* Weekly Dots (Visual Feedback) */}
          <View className="flex-row justify-between items-center px-2">
            {weeklyData.map((day, index) => (
              <View key={day.dateStr} className="items-center gap-2">
                <Text className={`text-xs font-medium ${day.isToday ? 'text-brand-dark' : 'text-text-tertiary'}`}>
                  {day.dayName}
                </Text>
                <View 
                  className={`w-3 h-3 rounded-full 
                    ${day.hasDiary ? 'bg-brand' : day.isToday ? 'bg-transparent border-2 border-brand' : 'bg-gray-200'}
                  `}
                />
              </View>
            ))}
          </View>
        </View>

        {/* 2. Hero Action: Writing Prompt */}
        <View className="px-5 mb-6">
          <Pressable 
            className={`rounded-3xl p-6 shadow-sm active:scale-[0.99]
              ${hasTodayDiary ? 'bg-brand-light' : 'bg-bg-surface'}
            `}
            style={{
              shadowColor: '#7AA06E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
              borderWidth: hasTodayDiary ? 0 : 1,
              borderColor: 'rgba(0,0,0,0.03)'
            }}
            onPress={() => {
              // If completed, maybe go to result or edit? For now, write implies new or edit.
              if (hasTodayDiary) {
                router.push('/archive'); // or specific view
              } else {
                router.push('/write');
              }
            }}
          >
            {hasTodayDiary ? (
              // Completed State
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center mb-2">
                    <View className="bg-white/50 px-2.5 py-1 rounded-full">
                      <Text className="text-xs font-bold text-brand-dark">오늘 일기 완료</Text>
                    </View>
                  </View>
                  <Text className="text-lg font-semibold text-brand-dark">
                    오늘의 기록이{'\n'}잘 보관되었어요 🍵
                  </Text>
                </View>
                <View className="w-12 h-12 bg-white rounded-full items-center justify-center">
                  <Check size={24} color="#56744C" strokeWidth={3} />
                </View>
              </View>
            ) : (
              // Prompt State
              <>
                <View className="flex-row items-center mb-3">
                  <Lightbulb size={18} color="#E85D04" strokeWidth={2.5} />
                  <Text className="text-xs font-bold text-orange-600 ml-1.5">오늘의 질문</Text>
                </View>
                
                <Text className="text-xl font-bold text-text-main leading-tight mb-6">
                  {dailyPrompt}
                </Text>

                <View className="flex-row gap-3">
                  <View className="flex-1 bg-brand h-12 rounded-xl items-center justify-center flex-row">
                    <PenLine size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">이 주제로 쓰기</Text>
                  </View>
                  <Pressable 
                    className="w-12 h-12 bg-bg-canvas rounded-xl items-center justify-center border border-bg-border"
                    onPress={(e) => {
                      e.stopPropagation();
                      setDailyPrompt(getDailyPrompt()); // Refresh prompt
                    }}
                  >
                    <RefreshCw size={18} color="#999" />
                  </Pressable>
                </View>
              </>
            )}
          </Pressable>
        </View>

        {/* 3. Learning Widget: Daily Word */}
        <View className="px-5 mb-8">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <Text className="text-base font-bold text-text-main">오늘의 단어</Text>
            <Pressable onPress={() => router.push('/(tabs)/vocabulary')}>
              <Text className="text-sm text-text-sub">전체보기</Text>
            </Pressable>
          </View>
          
          {isVocabLoading ? (
            <View className="h-32 bg-bg-surface rounded-2xl items-center justify-center">
              <ActivityIndicator color="#7AA06E" />
            </View>
          ) : dailyWord ? (
            <View 
              className="bg-bg-surface rounded-2xl p-5 border border-bg-border relative overflow-hidden"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.03,
                shadowRadius: 8,
              }}
            >
              {/* Background Decoration */}
              <View className="absolute -right-4 -top-4 opacity-[0.03]">
                <BookOpen size={120} color="#000" />
              </View>

              <View className="flex-row justify-between items-start mb-4">
                <View>
                  <Text className="text-2xl font-bold text-text-main mb-1">
                    {dailyWord.word}
                  </Text>
                  <Text className="text-sm text-brand font-medium">
                    {dailyWord.reading}
                  </Text>
                </View>
                <Pressable 
                  onPress={() => {
                    toggleMemorized(dailyWord.id);
                    // Optional: Animation or delay before removing
                    setTimeout(() => {
                      refreshWord();
                    }, 500);
                  }}
                  className="w-10 h-10 rounded-full bg-bg-canvas border border-bg-border items-center justify-center active:bg-brand active:border-brand"
                >
                  <Check size={18} color="#999" />
                </Pressable>
              </View>
              
              <View className="bg-bg-canvas px-3 py-2 rounded-lg self-start mb-3">
                <Text className="text-sm text-text-sub font-medium">
                  {dailyWord.meaning}
                </Text>
              </View>

              <View className="flex-row justify-end">
                 <Pressable 
                  onPress={refreshWord}
                  className="flex-row items-center px-2 py-1"
                  hitSlop={10}
                >
                  <RefreshCw size={12} color="#999" />
                  <Text className="text-xs text-text-tertiary ml-1">다른 단어</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable 
              className="bg-bg-surface rounded-2xl p-6 items-center justify-center border-2 border-dashed border-bg-border"
              onPress={() => router.push('/archive')}
            >
              <Text className="text-text-sub text-center">
                아직 학습할 단어가 없어요.{'\n'}일기를 쓰고 단어를 수집해보세요!
              </Text>
            </Pressable>
          )}
        </View>

        {/* 4. Memory Lane (Static Link for now) */}
        <View className="px-5">
          <Pressable 
            className="bg-[#FDFBF7] rounded-2xl p-4 flex-row items-center justify-between active:bg-bg-surface-hover"
            onPress={() => router.push('/archive')}
            style={{ borderLeftWidth: 4, borderLeftColor: '#EBCD78' }}
          >
            <View className="flex-row items-center flex-1">
              <View className="bg-[#F4EBCF] w-10 h-10 rounded-full items-center justify-center mr-3">
                <Calendar size={20} color="#8D7B4B" />
              </View>
              <View>
                <Text className="text-sm font-bold text-[#5C5132]">지난 기록 보기</Text>
                <Text className="text-xs text-[#8D7B4B] mt-0.5">
                  내가 쓴 일기들을 모아보세요
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#C2B48D" />
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

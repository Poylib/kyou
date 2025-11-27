import { useRouter } from 'expo-router';
import {
  BookOpen,
  ChevronRight,
  Flame,
  PenLine,
  Sparkles,
  TrendingUp
} from 'lucide-react-native';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useDiaryStore } from '../../src/stores/diaryStore';

/**
 * Home Screen - Dashboard
 * 
 * Design Principles:
 * 1. Clear daily goal visibility (diary writing)
 * 2. Streak motivation for consistent learning
 * 3. Quick action entry point
 * 4. Recent progress at a glance
 */

export default function HomeScreen() {
  const router = useRouter();
  
  // Auth state
  const { user, profile } = useAuthStore();
  
  // Diary state
  const { 
    diaries, 
    stats, 
    hasTodayDiary, 
    isLoading,
    fetchDiaries, 
    fetchStats, 
    checkTodayDiary 
  } = useDiaryStore();

  // Fetch data on mount (only for logged in users)
  useEffect(() => {
    if (user) {
      fetchDiaries({ limit: 5 });
      fetchStats();
      checkTodayDiary();
    }
  }, [user]);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayName = dayNames[today.getDay()];

  // Get most recent diary for preview
  const recentDiary = diaries[0];

  // Format date for display
  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['left', 'right']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View className="px-5 pt-6 pb-4">
          <Text className="text-sm text-text-sub font-medium">
            {formattedDate} {dayName}
          </Text>
          <Text className="text-2xl font-bold text-text-main mt-1">
            {profile?.nickname ? `${profile.nickname}님, ` : ''}오늘도 일기를 써볼까요? ✨
          </Text>
        </View>

        {/* Today's Status Card */}
        <View className="mx-5 mb-4">
          <Pressable 
            className="bg-bg-surface rounded-3xl p-5 shadow-sm active:scale-[0.98]"
            style={{
              shadowColor: '#7AA06E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            }}
            onPress={() => router.push('/write')}
          >
            {/* Status Badge */}
            <View className="flex-row items-center mb-4">
              <View className={`px-3 py-1.5 rounded-full ${hasTodayDiary ? 'bg-brand-light' : 'bg-accent/20'}`}>
                <Text className={`text-xs font-semibold ${hasTodayDiary ? 'text-brand-dark' : 'text-amber-700'}`}>
                  {hasTodayDiary ? '✓ 오늘 일기 완료!' : '아직 작성 전'}
                </Text>
              </View>
            </View>

            {/* Main CTA */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold text-text-main">
                  {hasTodayDiary 
                    ? '오늘의 일기를 확인해보세요' 
                    : '오늘 하루는 어땠나요?'}
                </Text>
                <Text className="text-sm text-text-sub mt-1 leading-relaxed">
                  {hasTodayDiary 
                    ? '작성한 일기와 학습 내용을 복습할 수 있어요'
                    : '한국어로 쓰면 AI가 일본어로 변환해줘요'}
                </Text>
              </View>
              
              <View className="bg-brand w-14 h-14 rounded-2xl items-center justify-center">
                <PenLine size={24} color="white" strokeWidth={2} />
              </View>
            </View>
          </Pressable>
        </View>

        {/* Streak & Stats Section */}
        <View className="flex-row mx-5 mb-4 gap-3">
          {/* Streak Card */}
          <View 
            className="flex-1 bg-bg-surface rounded-2xl p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View className="flex-row items-center mb-2">
              <Flame size={18} color="#E85D04" strokeWidth={2} />
              <Text className="text-xs text-text-sub ml-1.5 font-medium">연속 작성</Text>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#7AA06E" />
            ) : (
              <Text className="text-2xl font-bold text-text-main">
                {stats?.currentStreak || 0}
                <Text className="text-base font-normal text-text-sub">일째</Text>
              </Text>
            )}
          </View>

          {/* Total Diaries */}
          <View 
            className="flex-1 bg-bg-surface rounded-2xl p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View className="flex-row items-center mb-2">
              <BookOpen size={18} color="#7AA06E" strokeWidth={2} />
              <Text className="text-xs text-text-sub ml-1.5 font-medium">누적 일기</Text>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#7AA06E" />
            ) : (
              <Text className="text-2xl font-bold text-text-main">
                {stats?.totalDiaries || 0}
                <Text className="text-base font-normal text-text-sub">편</Text>
              </Text>
            )}
          </View>

          {/* Total Vocabulary */}
          <View 
            className="flex-1 bg-bg-surface rounded-2xl p-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View className="flex-row items-center mb-2">
              <TrendingUp size={18} color="#EBCD78" strokeWidth={2} />
              <Text className="text-xs text-text-sub ml-1.5 font-medium">학습 어휘</Text>
            </View>
            {isLoading ? (
              <ActivityIndicator size="small" color="#7AA06E" />
            ) : (
              <Text className="text-2xl font-bold text-text-main">
                {stats?.totalVocabulary || 0}
                <Text className="text-base font-normal text-text-sub">개</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Recent Diary Preview */}
        <View className="mx-5 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-base font-semibold text-text-main">최근 일기</Text>
            <Pressable 
              className="flex-row items-center active:opacity-70"
              onPress={() => router.push('/archive')}
            >
              <Text className="text-sm text-brand font-medium">전체보기</Text>
              <ChevronRight size={16} color="#7AA06E" strokeWidth={2} />
            </Pressable>
          </View>

          {isLoading ? (
            <View className="bg-bg-surface rounded-2xl p-4 items-center justify-center h-24">
              <ActivityIndicator color="#7AA06E" />
            </View>
          ) : recentDiary ? (
            <Pressable 
              className="bg-bg-surface rounded-2xl p-4 active:scale-[0.99]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
              onPress={() => {
                useDiaryStore.getState().setCurrentDiary(recentDiary);
                router.push('/result');
              }}
            >
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Text className="text-2xl mr-2">{recentDiary.mood}</Text>
                  <Text className="text-sm text-text-sub font-medium">
                    {formatDisplayDate(recentDiary.date)}
                  </Text>
                </View>
                {recentDiary.is_translated && (
                  <View className="bg-brand-light px-2 py-1 rounded-full">
                    <Text className="text-xs text-brand-dark font-medium">번역완료</Text>
                  </View>
                )}
              </View>
              <Text className="text-base text-text-main leading-relaxed" numberOfLines={2}>
                {recentDiary.original_text}
              </Text>
            </Pressable>
          ) : (
            <View 
              className="bg-bg-surface rounded-2xl p-4"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <Text className="text-sm text-text-sub text-center">
                아직 작성한 일기가 없어요.{'\n'}
                오늘 첫 일기를 작성해보세요! 🍵
              </Text>
            </View>
          )}
        </View>

        {/* Learning Tip Card */}
        <View className="mx-5">
          <View 
            className="bg-brand-light rounded-2xl p-4 flex-row items-start"
            style={{ borderLeftWidth: 4, borderLeftColor: '#7AA06E' }}
          >
            <Sparkles size={20} color="#56744C" strokeWidth={2} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-semibold text-brand-dark mb-1">
                오늘의 학습 팁
              </Text>
              <Text className="text-sm text-brand-dark/80 leading-relaxed">
                매일 일기를 쓰면 자연스럽게 일본어 표현력이 늘어요. 
                짧은 문장이라도 꾸준히 써보세요! 🍵
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

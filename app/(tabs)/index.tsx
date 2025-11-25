import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  PenLine, 
  Flame, 
  BookOpen, 
  TrendingUp,
  ChevronRight,
  Sparkles
} from 'lucide-react-native';

/**
 * Home Screen - Dashboard
 * 
 * Design Principles:
 * 1. Clear daily goal visibility (diary writing)
 * 2. Streak motivation for consistent learning
 * 3. Quick action entry point
 * 4. Recent progress at a glance
 */

// Mock data - will be replaced with actual data from Supabase
const mockData = {
  streak: 7,
  totalDiaries: 23,
  totalVocabulary: 69,
  todayWritten: false,
  recentDiary: {
    date: '2024.01.14',
    preview: '오늘은 날씨가 좋아서 공원에서 산책을 했다...',
    mood: '😊',
  },
};

export default function HomeScreen() {
  const router = useRouter();
  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const dayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
  const dayName = dayNames[today.getDay()];

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
            오늘도 일기를 써볼까요? ✨
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
              <View className={`px-3 py-1.5 rounded-full ${mockData.todayWritten ? 'bg-brand-light' : 'bg-accent/20'}`}>
                <Text className={`text-xs font-semibold ${mockData.todayWritten ? 'text-brand-dark' : 'text-amber-700'}`}>
                  {mockData.todayWritten ? '✓ 오늘 일기 완료!' : '아직 작성 전'}
                </Text>
              </View>
            </View>

            {/* Main CTA */}
            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Text className="text-lg font-semibold text-text-main">
                  {mockData.todayWritten 
                    ? '오늘의 일기를 확인해보세요' 
                    : '오늘 하루는 어땠나요?'}
                </Text>
                <Text className="text-sm text-text-sub mt-1 leading-relaxed">
                  {mockData.todayWritten 
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
            <Text className="text-2xl font-bold text-text-main">
              {mockData.streak}
              <Text className="text-base font-normal text-text-sub">일째</Text>
            </Text>
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
            <Text className="text-2xl font-bold text-text-main">
              {mockData.totalDiaries}
              <Text className="text-base font-normal text-text-sub">편</Text>
            </Text>
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
            <Text className="text-2xl font-bold text-text-main">
              {mockData.totalVocabulary}
              <Text className="text-base font-normal text-text-sub">개</Text>
            </Text>
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

          <Pressable 
            className="bg-bg-surface rounded-2xl p-4 active:scale-[0.99]"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-2">{mockData.recentDiary.mood}</Text>
                <Text className="text-sm text-text-sub font-medium">
                  {mockData.recentDiary.date}
                </Text>
              </View>
            </View>
            <Text className="text-base text-text-main leading-relaxed" numberOfLines={2}>
              {mockData.recentDiary.preview}
            </Text>
          </Pressable>
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

import { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  Pressable, 
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { 
  CalendarDays, 
  List,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react-native';
import { useDiaryStore } from '../../src/stores/diaryStore';
import { useAuthStore } from '../../src/stores/authStore';
import { Diary } from '../../src/types/database';

/**
 * Archive Screen - Past Diaries
 * 
 * Design Principles:
 * 1. Calendar & List view toggle
 * 2. Visual indicators for diary dates
 * 3. Easy month navigation
 * 4. Quick preview cards
 */

type ViewMode = 'calendar' | 'list';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

export default function ArchiveScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { diaries, isLoading, fetchDiaries, fetchDiariesByMonth, setCurrentDiary } = useDiaryStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Fetch diaries on mount and when month changes
  useEffect(() => {
    // Fetch regardless of login status (will be empty if not logged in)
    if (viewMode === 'calendar') {
      fetchDiariesByMonth(currentYear, currentMonth + 1);
    } else {
      fetchDiaries({ limit: 50 });
    }
  }, [currentYear, currentMonth, viewMode]);

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (viewMode === 'calendar') {
      await fetchDiariesByMonth(currentYear, currentMonth + 1, true);
    } else {
      await fetchDiaries({ limit: 50, forceRefresh: true });
    }
    setRefreshing(false);
  }, [viewMode, currentYear, currentMonth]);

  // Get diary dates for calendar dot indicators
  const diaryDates = diaries.map(d => d.date);

  // Navigate months
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: (number | null)[] = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  };

  const formatDateString = (day: number) => {
    const month = String(currentMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${currentYear}-${month}-${dayStr}`;
  };

  const hasDiary = (day: number) => {
    return diaryDates.includes(formatDateString(day));
  };

  const getDiaryForDay = (day: number): Diary | undefined => {
    const dateStr = formatDateString(day);
    return diaries.find(d => d.date === dateStr);
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  const handleDiaryPress = (diary: Diary) => {
    setCurrentDiary(diary);
    router.push({
      pathname: '/result',
      params: { diaryId: diary.id }
    });
  };

  const renderDiaryCard = ({ item }: { item: Diary }) => (
    <Pressable
      onPress={() => handleDiaryPress(item)}
      className="bg-bg-surface rounded-2xl p-4 mb-3 active:scale-[0.99]"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      }}
    >
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <Text className="text-2xl mr-2">{item.mood}</Text>
          <Text className="text-sm text-text-sub font-medium">
            {formatDisplayDate(item.date)}
          </Text>
        </View>
        {item.is_translated && (
          <View className="bg-brand-light px-2 py-1 rounded-full">
            <Text className="text-xs text-brand-dark font-medium">번역완료</Text>
          </View>
        )}
      </View>
      <Text className="text-base text-text-main leading-relaxed" numberOfLines={2}>
        {item.original_text}
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['left', 'right']}>
      {/* View Toggle Header */}
      <View className="px-5 pt-4 pb-3">
        <View className="flex-row bg-bg-surface rounded-xl p-1 self-start">
          <Pressable
            onPress={() => setViewMode('list')}
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              viewMode === 'list' ? 'bg-brand' : ''
            }`}
          >
            <List 
              size={16} 
              color={viewMode === 'list' ? 'white' : '#8C857B'} 
              strokeWidth={2} 
            />
            <Text className={`ml-1.5 text-sm font-medium ${
              viewMode === 'list' ? 'text-white' : 'text-text-sub'
            }`}>
              목록
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setViewMode('calendar')}
            className={`flex-row items-center px-4 py-2 rounded-lg ${
              viewMode === 'calendar' ? 'bg-brand' : ''
            }`}
          >
            <CalendarDays 
              size={16} 
              color={viewMode === 'calendar' ? 'white' : '#8C857B'} 
              strokeWidth={2} 
            />
            <Text className={`ml-1.5 text-sm font-medium ${
              viewMode === 'calendar' ? 'text-white' : 'text-text-sub'
            }`}>
              캘린더
            </Text>
          </Pressable>
        </View>
      </View>

      {viewMode === 'calendar' ? (
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7AA06E" />
          }
        >
          {/* Month Navigation */}
          <View className="flex-row items-center justify-between px-5 py-3">
            <Pressable 
              onPress={goToPrevMonth}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-brand-light"
            >
              <ChevronLeft size={24} color="#4B4036" strokeWidth={2} />
            </Pressable>
            <Text className="text-lg font-bold text-text-main">
              {currentYear}년 {MONTHS[currentMonth]}
            </Text>
            <Pressable 
              onPress={goToNextMonth}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-brand-light"
            >
              <ChevronRight size={24} color="#4B4036" strokeWidth={2} />
            </Pressable>
          </View>

          {/* Calendar Grid */}
          <View className="mx-5 bg-bg-surface rounded-2xl p-4">
            {/* Weekday Headers */}
            <View className="flex-row mb-2">
              {WEEKDAYS.map((day, index) => (
                <View key={day} className="flex-1 items-center py-2">
                  <Text className={`text-sm font-medium ${
                    index === 0 ? 'text-error' : index === 6 ? 'text-blue-500' : 'text-text-sub'
                  }`}>
                    {day}
                  </Text>
                </View>
              ))}
            </View>

            {/* Calendar Days */}
            <View className="flex-row flex-wrap">
              {generateCalendarDays().map((day, index) => {
                const diary = day ? getDiaryForDay(day) : undefined;
                return (
                  <View 
                    key={index} 
                    className="items-center justify-center"
                    style={{ width: '14.28%', aspectRatio: 1 }}
                  >
                    {day && (
                      <Pressable
                        onPress={() => diary && handleDiaryPress(diary)}
                        disabled={!diary}
                        className={`w-10 h-10 items-center justify-center rounded-full ${
                          hasDiary(day) ? 'bg-brand-light' : ''
                        }`}
                      >
                        <Text className={`text-base ${
                          hasDiary(day) ? 'font-semibold text-brand-dark' : 'text-text-main'
                        }`}>
                          {day}
                        </Text>
                        {hasDiary(day) && (
                          <View className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-brand" />
                        )}
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Diary List for Selected Month */}
          <View className="px-5 mt-6">
            <Text className="text-base font-semibold text-text-main mb-3">
              {MONTHS[currentMonth]}의 일기 ({diaries.length}편)
            </Text>
            {isLoading ? (
              <View className="items-center py-8">
                <ActivityIndicator color="#7AA06E" />
              </View>
            ) : diaries.length > 0 ? (
              diaries.map((diary) => (
                <View key={diary.id}>
                  {renderDiaryCard({ item: diary })}
                </View>
              ))
            ) : (
              <View className="bg-bg-surface rounded-2xl p-6 items-center">
                <Text className="text-sm text-text-sub text-center">
                  이 달에 작성한 일기가 없어요
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        /* List View */
        <View className="flex-1">
          {isLoading && diaries.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#7AA06E" size="large" />
            </View>
          ) : diaries.length > 0 ? (
            <FlatList
              data={diaries}
              renderItem={renderDiaryCard}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 20, paddingTop: 8 }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7AA06E" />
              }
              ListHeaderComponent={
                <Text className="text-sm text-text-sub mb-3">
                  총 {diaries.length}편의 일기
                </Text>
              }
            />
          ) : (
            /* Empty State */
            <View className="flex-1 items-center justify-center px-8">
              <View className="w-20 h-20 rounded-full bg-brand-light items-center justify-center mb-4">
                <BookOpen size={32} color="#7AA06E" strokeWidth={1.5} />
              </View>
              <Text className="text-lg font-semibold text-text-main text-center mb-2">
                아직 작성한 일기가 없어요
              </Text>
              <Text className="text-sm text-text-sub text-center leading-relaxed">
                오늘의 일기를 작성하고{'\n'}일본어 학습을 시작해보세요!
              </Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

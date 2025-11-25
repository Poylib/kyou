import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Sparkles, 
  ChevronDown,
  Sun,
  Cloud,
  CloudRain,
  Snowflake,
  Wind
} from 'lucide-react-native';

/**
 * Write Screen - Diary Entry
 * 
 * Design Principles:
 * 1. Clean, distraction-free writing experience
 * 2. Easy mood & weather selection
 * 3. Clear progress indication (character count)
 * 4. Accessible CTA for translation
 */

// Mood options with emojis
const moods = [
  { emoji: '😊', label: '행복' },
  { emoji: '😌', label: '평온' },
  { emoji: '🥳', label: '신남' },
  { emoji: '😢', label: '슬픔' },
  { emoji: '😡', label: '화남' },
  { emoji: '😴', label: '피곤' },
  { emoji: '🤔', label: '고민' },
  { emoji: '😰', label: '불안' },
];

// Weather options
const weathers = [
  { icon: Sun, label: '맑음', color: '#F59E0B' },
  { icon: Cloud, label: '흐림', color: '#9CA3AF' },
  { icon: CloudRain, label: '비', color: '#3B82F6' },
  { icon: Snowflake, label: '눈', color: '#60A5FA' },
  { icon: Wind, label: '바람', color: '#6B7280' },
];

// JLPT Levels
const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

const MAX_CHARACTERS = 500;

export default function WriteScreen() {
  const [diaryText, setDiaryText] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState('N4');
  const [showLevelPicker, setShowLevelPicker] = useState(false);

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  const characterCount = diaryText.length;
  const isValidEntry = diaryText.trim().length >= 10 && selectedMood;

  const handleTranslate = () => {
    if (!isValidEntry) return;
    // TODO: Call Edge Function for translation
    console.log({
      text: diaryText,
      mood: selectedMood,
      weather: selectedWeather,
      level: selectedLevel,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['left', 'right']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
        keyboardVerticalOffset={100}
      >
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Date Display */}
          <View className="px-5 pt-4 pb-2">
            <Text className="text-sm text-text-sub font-medium">
              📅 {formattedDate}
            </Text>
          </View>

          {/* Mood Selection */}
          <View className="px-5 mb-4">
            <Text className="text-base font-semibold text-text-main mb-3">
              오늘의 기분은? <Text className="text-error">*</Text>
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 10 }}
            >
              {moods.map((mood) => (
                <Pressable
                  key={mood.emoji}
                  onPress={() => setSelectedMood(mood.emoji)}
                  className={`w-14 h-14 rounded-2xl items-center justify-center ${
                    selectedMood === mood.emoji 
                      ? 'bg-brand-light border-2 border-brand' 
                      : 'bg-bg-surface border border-gray-100'
                  }`}
                  style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                >
                  <Text className="text-2xl">{mood.emoji}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Weather Selection */}
          <View className="px-5 mb-5">
            <Text className="text-base font-semibold text-text-main mb-3">
              오늘의 날씨
            </Text>
            <View className="flex-row gap-2">
              {weathers.map((weather) => {
                const IconComponent = weather.icon;
                const isSelected = selectedWeather === weather.label;
                return (
                  <Pressable
                    key={weather.label}
                    onPress={() => setSelectedWeather(
                      selectedWeather === weather.label ? null : weather.label
                    )}
                    className={`flex-1 h-12 rounded-xl items-center justify-center flex-row gap-1.5 ${
                      isSelected 
                        ? 'bg-brand-light border border-brand' 
                        : 'bg-bg-surface border border-gray-100'
                    }`}
                  >
                    <IconComponent 
                      size={16} 
                      color={isSelected ? '#56744C' : weather.color} 
                      strokeWidth={2} 
                    />
                    <Text className={`text-xs font-medium ${
                      isSelected ? 'text-brand-dark' : 'text-text-sub'
                    }`}>
                      {weather.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Diary Input */}
          <View className="px-5 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base font-semibold text-text-main">
                오늘의 일기 <Text className="text-error">*</Text>
              </Text>
              <Text className={`text-sm font-medium ${
                characterCount > MAX_CHARACTERS ? 'text-error' : 'text-text-sub'
              }`}>
                {characterCount}/{MAX_CHARACTERS}
              </Text>
            </View>
            
            <View 
              className="bg-bg-surface rounded-2xl border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <TextInput
                className="p-4 text-base text-text-main min-h-[200px]"
                placeholder="오늘 하루는 어땠나요? 한국어로 자유롭게 써주세요..."
                placeholderTextColor="#8C857B"
                multiline
                textAlignVertical="top"
                value={diaryText}
                onChangeText={setDiaryText}
                maxLength={MAX_CHARACTERS + 50}
              />
            </View>

            {diaryText.length > 0 && diaryText.length < 10 && (
              <Text className="text-xs text-text-sub mt-2 ml-1">
                💡 최소 10자 이상 작성해주세요
              </Text>
            )}
          </View>

          {/* Level Selection */}
          <View className="px-5 mb-6">
            <Text className="text-base font-semibold text-text-main mb-3">
              번역 난이도 (JLPT 레벨)
            </Text>
            
            <Pressable
              onPress={() => setShowLevelPicker(!showLevelPicker)}
              className="bg-bg-surface rounded-xl px-4 h-12 flex-row items-center justify-between border border-gray-100"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.04,
                shadowRadius: 4,
              }}
            >
              <View className="flex-row items-center">
                <Text className="text-base font-semibold text-brand mr-2">
                  {selectedLevel}
                </Text>
                <Text className="text-sm text-text-sub">
                  {selectedLevel === 'N5' && '(초급 - 가장 쉬움)'}
                  {selectedLevel === 'N4' && '(초중급)'}
                  {selectedLevel === 'N3' && '(중급)'}
                  {selectedLevel === 'N2' && '(중상급)'}
                  {selectedLevel === 'N1' && '(상급 - 가장 어려움)'}
                </Text>
              </View>
              <ChevronDown 
                size={20} 
                color="#8C857B" 
                strokeWidth={2}
                style={{ transform: [{ rotate: showLevelPicker ? '180deg' : '0deg' }] }}
              />
            </Pressable>

            {showLevelPicker && (
              <View className="mt-2 bg-bg-surface rounded-xl border border-gray-100 overflow-hidden">
                {levels.map((level, index) => (
                  <Pressable
                    key={level}
                    onPress={() => {
                      setSelectedLevel(level);
                      setShowLevelPicker(false);
                    }}
                    className={`px-4 py-3 flex-row items-center justify-between ${
                      index !== levels.length - 1 ? 'border-b border-gray-50' : ''
                    } ${selectedLevel === level ? 'bg-brand-light' : ''}`}
                  >
                    <Text className={`text-base font-medium ${
                      selectedLevel === level ? 'text-brand-dark' : 'text-text-main'
                    }`}>
                      {level}
                    </Text>
                    <Text className="text-sm text-text-sub">
                      {level === 'N5' && '초급'}
                      {level === 'N4' && '초중급'}
                      {level === 'N3' && '중급'}
                      {level === 'N2' && '중상급'}
                      {level === 'N1' && '상급'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Info Box */}
          <View className="mx-5 mb-4">
            <View className="bg-brand-light/50 rounded-xl p-3.5">
              <Text className="text-sm text-brand-dark leading-relaxed">
                🍵 AI가 자연스러운 일본어로 번역하고, 핵심 어휘 3개와 원포인트 문법을 알려드려요.
              </Text>
            </View>
          </View>
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
            onPress={handleTranslate}
            disabled={!isValidEntry}
            className={`h-14 rounded-full flex-row items-center justify-center gap-2 ${
              isValidEntry 
                ? 'bg-brand active:bg-brand-dark' 
                : 'bg-gray-200'
            }`}
            style={{
              shadowColor: isValidEntry ? '#7AA06E' : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isValidEntry ? 0.3 : 0.1,
              shadowRadius: 8,
            }}
          >
            <Sparkles size={20} color="white" strokeWidth={2} />
            <Text className="text-white font-semibold text-base">
              AI 번역하기
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


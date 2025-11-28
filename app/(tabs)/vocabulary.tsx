import {
    Book,
    Check,
    ChevronDown,
    ChevronUp,
    Play,
    Trash2,
    Volume2
} from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LearningModeModal from '../../src/components/learning/LearningModeModal';
import { useVocabStore } from '../../src/stores/vocabStore';
import { VocabularyBookItem } from '../../src/types/database';

/**
 * Vocabulary Screen
 * 
 * Displays saved vocabulary words with spaced repetition features.
 */

export default function VocabularyScreen() {
  const { words, filter, isLoading, fetchWords, setFilter, toggleMemorized, deleteWord } = useVocabStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLearningMode, setIsLearningMode] = useState(false);

  useEffect(() => {
    fetchWords();
  }, [filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWords(true);
    setRefreshing(false);
  }, []);

  // Get words for learning mode (exclude memorized ones, or all if none)
  const wordsToLearn = words.filter(w => !w.is_memorized);
  const learningDeck = wordsToLearn.length > 0 ? wordsToLearn : words;

  const handleStartLearning = () => {
    if (learningDeck.length === 0) {
      Alert.alert('알림', '학습할 단어가 없어요.');
      return;
    }
    setIsLearningMode(true);
  };

  const handleSpeak = (text: string) => {
    Alert.alert('알림', '🔊 음성 재생 기능은 곧 추가될 예정이에요!');
  };

  const handleDelete = (id: string, word: string) => {
    Alert.alert(
      '단어 삭제',
      `'${word}' 단어를 삭제할까요?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: () => deleteWord(id)
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: VocabularyBookItem }) => {
    const isExpanded = expandedId === item.id;

    return (
      <Pressable
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        className="bg-bg-surface rounded-2xl p-4 mb-3 active:scale-[0.99]"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 8,
        }}
      >
        {/* Header: Word & Actions */}
        <View className="flex-row items-start justify-between mb-2">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-text-main">
              {item.word}
            </Text>
            <Text className="text-sm text-brand font-medium mt-0.5">
              {item.reading}
            </Text>
          </View>
          
          <View className="flex-row gap-2">
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleSpeak(item.word);
              }}
              className="w-9 h-9 rounded-full bg-brand-light items-center justify-center"
            >
              <Volume2 size={18} color="#56744C" strokeWidth={2} />
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                toggleMemorized(item.id);
              }}
              className={`w-9 h-9 rounded-full items-center justify-center ${
                item.is_memorized ? 'bg-brand' : 'bg-gray-200'
              }`}
            >
              <Check size={18} color="white" strokeWidth={3} />
            </Pressable>
          </View>
        </View>

        {/* Meaning */}
        <Text className="text-base text-text-main font-medium mb-2">
          {item.meaning}
        </Text>

        {/* Expanded Content: Example */}
        {isExpanded && (
          <View className="mt-3 pt-3 border-t border-gray-100">
            <View className="bg-brand-light/30 rounded-xl p-3">
              <Text className="text-xs text-text-sub mb-1 font-medium">예문</Text>
              <Text className="text-base text-text-main mb-1 leading-relaxed">
                {item.example || '예문이 없습니다.'}
              </Text>
              {item.example_meaning && (
                <Text className="text-sm text-text-sub leading-relaxed">
                  {item.example_meaning}
                </Text>
              )}
            </View>
            
            <View className="flex-row justify-end mt-3">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item.id, item.word);
                }}
                className="flex-row items-center px-2 py-1"
              >
                <Trash2 size={14} color="#D97D7D" strokeWidth={2} />
                <Text className="text-error text-xs font-medium ml-1">삭제하기</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Expand Indicator */}
        <View className="items-center mt-1">
          {isExpanded ? (
            <ChevronUp size={16} color="#D1D5DB" />
          ) : (
            <ChevronDown size={16} color="#D1D5DB" />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['left', 'right']}>
      {/* Header & Filter */}
      <View className="px-5 pt-4 pb-3 bg-bg-canvas z-10">
        <View className="flex-row bg-bg-surface rounded-xl p-1 self-start mb-4 border border-gray-100">
          <Pressable
            onPress={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-brand' : ''}`}
          >
            <Text className={`text-sm font-medium ${filter === 'all' ? 'text-white' : 'text-text-sub'}`}>
              전체
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('learning')}
            className={`px-4 py-2 rounded-lg ${filter === 'learning' ? 'bg-brand' : ''}`}
          >
            <Text className={`text-sm font-medium ${filter === 'learning' ? 'text-white' : 'text-text-sub'}`}>
              학습 중
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setFilter('memorized')}
            className={`px-4 py-2 rounded-lg ${filter === 'memorized' ? 'bg-brand' : ''}`}
          >
            <Text className={`text-sm font-medium ${filter === 'memorized' ? 'text-white' : 'text-text-sub'}`}>
              암기 완료
            </Text>
          </Pressable>
        </View>

        <Text className="text-sm text-text-sub ml-1">
          총 <Text className="text-brand font-bold">{words.length}</Text>개의 단어가 저장되었어요
        </Text>
      </View>

      {/* List */}
      {isLoading && words.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7AA06E" />
        </View>
      ) : words.length > 0 ? (
        <FlatList
          data={words}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingTop: 0 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7AA06E" />
          }
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8 pb-20">
          <View className="w-20 h-20 rounded-full bg-brand-light items-center justify-center mb-4">
            <Book size={32} color="#7AA06E" strokeWidth={1.5} />
          </View>
          <Text className="text-lg font-semibold text-text-main text-center mb-2">
            저장된 단어가 없어요
          </Text>
          <Text className="text-sm text-text-sub text-center leading-relaxed">
            일기에서 모르는 단어를 저장하고{'\n'}여기서 복습해보세요! 🍵
          </Text>
        </View>
      )}

      {/* Floating Action Button for Learning Mode */}
      {words.length > 0 && (
        <View 
          className="absolute bottom-6 right-6"
          style={{
            shadowColor: '#7AA06E',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
        >
          <Pressable
            onPress={handleStartLearning}
            className="w-14 h-14 rounded-full bg-brand items-center justify-center active:bg-brand-dark"
          >
            <Play size={24} color="white" fill="white" style={{ marginLeft: 4 }} />
          </Pressable>
        </View>
      )}

      {/* Learning Mode Modal */}
      <LearningModeModal 
        visible={isLearningMode}
        onClose={() => setIsLearningMode(false)}
        words={learningDeck}
      />
    </SafeAreaView>
  );
}


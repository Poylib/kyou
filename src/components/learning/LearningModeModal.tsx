import { RefreshCw, Trophy, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVocabStore } from '../../stores/vocabStore';
import { VocabularyBookItem } from '../../types/database';
import CardDeck from './CardDeck';

interface LearningModeModalProps {
  visible: boolean;
  onClose: () => void;
  words: VocabularyBookItem[];
}

/**
 * LearningModeModal Component
 * 
 * Full-screen modal for flashcard learning mode.
 * Tracks memorized vs. learning words and shows results.
 */
export default function LearningModeModal({ visible, onClose, words }: LearningModeModalProps) {
  const { toggleMemorized } = useVocabStore();
  const [isFinished, setIsFinished] = useState(false);
  const [sessionKey, setSessionKey] = useState(0); // For resetting deck
  const [results, setResults] = useState({
    memorized: 0,
    learning: 0,
  });

  // Handle "I know this" swipe
  const handleSwipeRight = useCallback((word: VocabularyBookItem) => {
    // Mark as memorized if not already
    if (!word.is_memorized) {
      toggleMemorized(word.id);
    }
    setResults(prev => ({ ...prev, memorized: prev.memorized + 1 }));
  }, [toggleMemorized]);

  // Handle "I don't know" swipe
  const handleSwipeLeft = useCallback((word: VocabularyBookItem) => {
    // Mark as not memorized if it was memorized
    if (word.is_memorized) {
      toggleMemorized(word.id);
    }
    setResults(prev => ({ ...prev, learning: prev.learning + 1 }));
  }, [toggleMemorized]);

  // Handle deck completion
  const handleFinish = useCallback(() => {
    setIsFinished(true);
  }, []);

  // Reset for new session
  const handleReset = useCallback(() => {
    setResults({ memorized: 0, learning: 0 });
    setIsFinished(false);
    setSessionKey(prev => prev + 1);
  }, []);

  // Close modal and reset state
  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.headerTitle}>단어 학습</Text>
            <Pressable
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#4B4036" />
            </Pressable>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {!isFinished ? (
              <CardDeck
                key={sessionKey}
                words={words}
                onSwipeRight={handleSwipeRight}
                onSwipeLeft={handleSwipeLeft}
                onFinish={handleFinish}
              />
            ) : (
              <View style={styles.resultContainer}>
                {/* Trophy Icon */}
                <View style={styles.trophyCircle}>
                  <Trophy size={48} color="#7AA06E" strokeWidth={1.5} />
                </View>

                {/* Completion Message */}
                <Text style={styles.resultTitle}>학습 완료!</Text>
                <Text style={styles.resultSubtitle}>
                  오늘의 학습을 성공적으로 마쳤어요.{'\n'}
                  꾸준한 반복이 실력이 됩니다!
                </Text>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>{results.memorized}</Text>
                    <Text style={styles.statLabel}>암기함</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statNumber, styles.statNumberLearning]}>
                      {results.learning}
                    </Text>
                    <Text style={styles.statLabel}>학습 필요</Text>
                  </View>
                </View>

                {/* Actions */}
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => [
                    styles.doneButton,
                    pressed && styles.doneButtonPressed,
                  ]}
                >
                  <Text style={styles.doneButtonText}>확인</Text>
                </Pressable>

                <Pressable onPress={handleReset} style={styles.resetButton}>
                  <RefreshCw size={16} color="#8C857B" />
                  <Text style={styles.resetButtonText}>다시 학습하기</Text>
                </Pressable>
              </View>
            )}
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#FAFAF8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4B4036',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  trophyCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E8F5E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4B4036',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 15,
    color: '#8C857B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    width: '100%',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0EC',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#7AA06E',
    marginBottom: 4,
  },
  statNumberLearning: {
    color: '#D97D7D',
  },
  statLabel: {
    fontSize: 13,
    color: '#8C857B',
    fontWeight: '500',
  },
  doneButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#7AA06E',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  doneButtonPressed: {
    backgroundColor: '#6B9160',
  },
  doneButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 8,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#8C857B',
    fontWeight: '600',
    marginLeft: 8,
  },
});

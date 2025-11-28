import { Volume2 } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { VocabularyBookItem } from '../../types/database';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = CARD_WIDTH * 1.35;

interface FlashcardProps {
  item: VocabularyBookItem;
  isInteractive?: boolean; // Allow tap to flip
}

/**
 * Flashcard Component
 * 
 * A simple flip card with:
 * - Front: Japanese word
 * - Back: Meaning, reading, example
 * - Tap to flip (3D animation)
 */
export default function Flashcard({ item, isInteractive = true }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);

  const handleFlip = useCallback(() => {
    if (!isInteractive) return;
    
    const newFlipped = !isFlipped;
    setIsFlipped(newFlipped);
    rotateY.value = withTiming(newFlipped ? 180 : 0, { duration: 400 });
  }, [isFlipped, isInteractive, rotateY]);

  // Front face style (visible when rotateY is 0~90)
  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      rotateY.value,
      [0, 180],
      [0, 180],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotate}deg` },
      ],
      backfaceVisibility: 'hidden',
      opacity: rotateY.value <= 90 ? 1 : 0,
    };
  });

  // Back face style (visible when rotateY is 90~180)
  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      rotateY.value,
      [0, 180],
      [180, 360],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [
        { perspective: 1200 },
        { rotateY: `${rotate}deg` },
      ],
      backfaceVisibility: 'hidden',
      opacity: rotateY.value > 90 ? 1 : 0,
    };
  });

  return (
    <Pressable onPress={handleFlip} style={styles.container}>
      {/* Front Face - Japanese Word */}
      <Animated.View style={[styles.card, styles.frontCard, frontAnimatedStyle]}>
        <View style={styles.cardContent}>
          <Text style={styles.hint}>탭하여 뒤집기</Text>
          <Text style={styles.word}>{item.word}</Text>
          <Text style={styles.reading}>{item.reading}</Text>
        </View>
      </Animated.View>

      {/* Back Face - Meaning & Details */}
      <Animated.View style={[styles.card, styles.backCard, backAnimatedStyle]}>
        <View style={styles.cardContent}>
          {/* Word & Reading */}
          <View style={styles.headerSection}>
            <Text style={styles.backWord}>{item.word}</Text>
            <Text style={styles.backReading}>{item.reading}</Text>
          </View>

          <View style={styles.divider} />

          {/* Meaning */}
          <Text style={styles.meaning}>{item.meaning}</Text>

          {/* Example Sentence */}
          {(item.example || item.example_meaning) && (
            <View style={styles.exampleBox}>
              <View style={styles.exampleHeader}>
                <Volume2 size={14} color="#9CA3AF" />
                <Text style={styles.exampleLabel}>예문</Text>
              </View>
              {item.example && (
                <Text style={styles.exampleText}>{item.example}</Text>
              )}
              {item.example_meaning && (
                <Text style={styles.exampleMeaning}>{item.example_meaning}</Text>
              )}
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// Reset flip state externally (for deck management)
Flashcard.resetFlip = () => {
  // This is a placeholder - actual reset handled by key prop change in parent
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignSelf: 'center',
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  frontCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F0F0EC',
  },
  backCard: {
    backgroundColor: '#FAFAF8',
    borderWidth: 1,
    borderColor: '#E8E8E4',
  },
  cardContent: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    color: '#A0A0A0',
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  word: {
    fontSize: 56,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 8,
  },
  reading: {
    fontSize: 20,
    color: '#7AA06E',
    fontWeight: '600',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  backWord: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  backReading: {
    fontSize: 18,
    color: '#7AA06E',
    fontWeight: '600',
  },
  divider: {
    width: 48,
    height: 2,
    backgroundColor: '#E0E0DC',
    borderRadius: 1,
    marginVertical: 16,
  },
  meaning: {
    fontSize: 28,
    fontWeight: '700',
    color: '#4B4036',
    textAlign: 'center',
    lineHeight: 38,
  },
  exampleBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#F0F0EC',
  },
  exampleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exampleLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    marginLeft: 6,
  },
  exampleText: {
    fontSize: 15,
    color: '#4B4036',
    lineHeight: 22,
    marginBottom: 4,
  },
  exampleMeaning: {
    fontSize: 13,
    color: '#8C857B',
    lineHeight: 20,
  },
});

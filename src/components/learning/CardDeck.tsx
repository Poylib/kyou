import { Check, X } from 'lucide-react-native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { VocabularyBookItem } from '../../types/database';
import Flashcard from './Flashcard';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;
const CARD_OUT_DURATION = 300;

interface CardDeckProps {
  words: VocabularyBookItem[];
  onSwipeRight: (word: VocabularyBookItem) => void;
  onSwipeLeft: (word: VocabularyBookItem) => void;
  onFinish: () => void;
}

/**
 * CardDeck Component
 * 
 * Smooth card stack with swipe gestures.
 * Uses entering animation to prevent flicker on card transition.
 */
export default function CardDeck({ words, onSwipeRight, onSwipeLeft, onFinish }: CardDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const pendingCallback = useRef<{ direction: 'left' | 'right'; word: VocabularyBookItem } | null>(null);

  // Animation shared values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  
  // Entering animation for new card
  const enteringProgress = useSharedValue(1); // 1 = fully visible, 0 = hidden

  const currentWord = words[currentIndex];
  const nextWord = words[currentIndex + 1];

  // Reset deck when words change
  useEffect(() => {
    setCurrentIndex(0);
    translateX.value = 0;
    translateY.value = 0;
    enteringProgress.value = 1;
  }, [words, translateX, translateY, enteringProgress]);

  // Check if deck is finished
  useEffect(() => {
    if (currentIndex >= words.length && words.length > 0) {
      onFinish();
    }
  }, [currentIndex, words.length, onFinish]);

  // Process pending callback and advance to next card
  const advanceToNextCard = useCallback(() => {
    // Execute pending callback
    if (pendingCallback.current) {
      const { direction, word } = pendingCallback.current;
      if (direction === 'right') {
        onSwipeRight(word);
      } else {
        onSwipeLeft(word);
      }
      pendingCallback.current = null;
    }

    // Prepare entering animation: start from "next card" state
    enteringProgress.value = 0;
    
    // Reset position immediately
    translateX.value = 0;
    translateY.value = 0;

    // Advance index
    setCurrentIndex(prev => prev + 1);

    // Animate new card in
    enteringProgress.value = withSpring(1, { 
      damping: 18, 
      stiffness: 180,
      mass: 0.8,
    });
  }, [onSwipeRight, onSwipeLeft, translateX, translateY, enteringProgress]);

  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.4;
    })
    .onEnd((event) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldSwipe && currentWord) {
        const direction = event.translationX > 0 ? 'right' : 'left';
        const targetX = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;

        // Store callback data
        pendingCallback.current = { direction, word: currentWord };

        // Animate card out, then advance
        translateX.value = withTiming(
          targetX,
          { duration: CARD_OUT_DURATION },
          (finished) => {
            if (finished) {
              runOnJS(advanceToNextCard)();
            }
          }
        );
        translateY.value = withTiming(0, { duration: CARD_OUT_DURATION });
      } else {
        // Spring back to center
        translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
        translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
      }
    });

  // Animated style for current card (includes entering animation)
  const currentCardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
      [-12, 0, 12],
      Extrapolation.CLAMP
    );

    // Entering animation: scale up from 0.92 to 1
    const enteringScale = interpolate(
      enteringProgress.value,
      [0, 1],
      [0.92, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
        { scale: enteringScale },
      ],
    };
  });

  // Animated style for next card
  const nextCardStyle = useAnimatedStyle(() => {
    const swipeProgress = Math.abs(translateX.value) / (SCREEN_WIDTH / 2);
    
    const scale = interpolate(
      swipeProgress,
      [0, 1],
      [0.88, 0.92],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      swipeProgress,
      [0, 1],
      [0.4, 0.7],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // Swipe indicator styles
  const rightIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.6, 1],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  const leftIndicatorStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    const scale = interpolate(
      translateX.value,
      [0, -SWIPE_THRESHOLD],
      [0.6, 1],
      Extrapolation.CLAMP
    );
    return { opacity, transform: [{ scale }] };
  });

  // Empty state
  if (!currentWord) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>모든 카드를 학습했어요! 🎉</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Card Stack */}
      <View style={styles.deckArea}>
        {/* Next Card (Behind) */}
        {nextWord && (
          <Animated.View style={[styles.cardWrapper, styles.nextCard, nextCardStyle]}>
            <Flashcard key={`next-${nextWord.id}`} item={nextWord} isInteractive={false} />
          </Animated.View>
        )}

        {/* Current Card (Interactive) */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.cardWrapper, currentCardStyle]}>
            <Flashcard key={`current-${currentIndex}-${currentWord.id}`} item={currentWord} />

            {/* Swipe Indicators */}
            <Animated.View style={[styles.indicator, rightIndicatorStyle]}>
              <View style={styles.indicatorCircle}>
                <Check size={36} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={styles.indicatorTextRight}>알아요!</Text>
            </Animated.View>

            <Animated.View style={[styles.indicator, leftIndicatorStyle]}>
              <View style={[styles.indicatorCircle, styles.indicatorCircleLeft]}>
                <X size={36} color="#FFFFFF" strokeWidth={3} />
              </View>
              <Text style={styles.indicatorTextLeft}>몰라요</Text>
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Progress & Hints */}
      <View style={styles.footer}>
        <View style={styles.hintItem}>
          <View style={[styles.hintCircle, styles.hintCircleLeft]}>
            <X size={20} color="#D97D7D" />
          </View>
          <Text style={styles.hintTextLeft}>몰라요</Text>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {currentIndex + 1} / {words.length}
          </Text>
        </View>

        <View style={styles.hintItem}>
          <View style={[styles.hintCircle, styles.hintCircleRight]}>
            <Check size={20} color="#7AA06E" />
          </View>
          <Text style={styles.hintTextRight}>알아요</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckArea: {
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_WIDTH * 0.85 * 1.35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    ...StyleSheet.absoluteFillObject,
  },
  nextCard: {
    zIndex: -1,
  },
  indicator: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: 24,
    zIndex: 10,
  },
  indicatorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#7AA06E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  indicatorCircleLeft: {
    backgroundColor: '#D97D7D',
  },
  indicatorTextRight: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7AA06E',
  },
  indicatorTextLeft: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97D7D',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B4036',
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 40,
    marginTop: 32,
  },
  hintItem: {
    alignItems: 'center',
    opacity: 0.6,
  },
  hintCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  hintCircleLeft: {
    borderColor: '#D97D7D',
  },
  hintCircleRight: {
    borderColor: '#7AA06E',
  },
  hintTextLeft: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97D7D',
  },
  hintTextRight: {
    fontSize: 11,
    fontWeight: '600',
    color: '#7AA06E',
  },
  progressContainer: {
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8C857B',
  },
});

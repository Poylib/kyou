import { Tabs } from 'expo-router';
import { Book, Calendar, Home, PenLine, User } from 'lucide-react-native';
import React from 'react';
import { Platform } from 'react-native';

/**
 * Matcha Latte Theme Colors
 * Design System for consistent tab bar styling
 */
const theme = {
  brand: '#7AA06E',
  brandDark: '#56744C',
  textSub: '#8C857B',
  bgSurface: '#FFFFFF',
  bgCanvas: '#FAFAF8',
  brandLight: '#EFF5ED',
  textMain: '#4B4036',
};

/**
 * Tab Bar Configuration
 * - iOS: 88pt height with safe area consideration
 * - Android: 64dp height
 * - Accessible touch targets (44pt minimum)
 */
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 64;
const TAB_BAR_PADDING_BOTTOM = Platform.OS === 'ios' ? 28 : 8;
const TAB_BAR_PADDING_TOP = 12;
const ICON_SIZE = 24;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        // Tab Bar Styling
        tabBarActiveTintColor: theme.brand,
        tabBarInactiveTintColor: theme.textSub,
        tabBarStyle: {
          backgroundColor: theme.bgSurface,
          borderTopColor: theme.brandLight,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT,
          paddingBottom: TAB_BAR_PADDING_BOTTOM,
          paddingTop: TAB_BAR_PADDING_TOP,
          // Subtle shadow for elevation
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.03,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 2,
        },
        // Header Styling
        headerStyle: {
          backgroundColor: theme.bgCanvas,
        },
        headerTitleStyle: {
          color: theme.textMain,
          fontWeight: '700',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerTitleAlign: 'center',
      }}
    >
      {/* Tab 1: Home - Dashboard */}
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          headerTitle: 'Kyou',
          tabBarIcon: ({ color, focused }) => (
            <Home 
              size={ICON_SIZE} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Tab 2: Archive - Calendar/List View (Moved up for better flow) */}
      <Tabs.Screen
        name="archive"
        options={{
          title: '아카이브',
          headerTitle: '지난 일기',
          tabBarIcon: ({ color, focused }) => (
            <Calendar 
              size={ICON_SIZE} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Tab 3: Vocabulary - Word List */}
      <Tabs.Screen
        name="vocabulary"
        options={{
          title: '단어장',
          headerTitle: '나만의 단어장',
          tabBarIcon: ({ color, focused }) => (
            <Book 
              size={ICON_SIZE} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />

      {/* Tab 5: My Page - Profile & Settings */}
      <Tabs.Screen
        name="mypage"
        options={{
          title: '마이',
          headerTitle: '마이페이지',
          tabBarIcon: ({ color, focused }) => (
            <User 
              size={ICON_SIZE} 
              color={color} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}

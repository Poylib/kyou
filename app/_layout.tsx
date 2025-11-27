import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { useAuthStore } from '../src/stores/authStore';

// Import NativeWind global styles
import "../global.css";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

/**
 * Auth Guard Hook
 * Redirects users based on authentication state
 */
function useProtectedRoute() {
  const segments = useSegments();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    // Wait for auth to initialize
    if (!isInitialized) return;

    // Check if user is in auth group
    const inAuthGroup = segments[0] === '(auth)';

    if (!user && !inAuthGroup) {
      // User is not signed in and not on auth screen -> redirect to login
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      // User is signed in but on auth screen -> redirect to main app
      router.replace('/(tabs)');
    }
  }, [user, segments, isInitialized]);
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const colorScheme = useColorScheme();

  // Initialize auth store
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isInitialized]);

  // Show loading screen while initializing
  if (!loaded || !isInitialized) {
    return (
      <View className="flex-1 bg-bg-canvas items-center justify-center">
        <ActivityIndicator size="large" color="#7AA06E" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  // Apply auth guard
  useProtectedRoute();

  return <Slot />;
}

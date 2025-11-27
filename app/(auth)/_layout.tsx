import { Stack } from 'expo-router';

/**
 * Auth Stack Layout
 * 
 * Contains login screen only (Google OAuth).
 * No tab bar, clean auth flow.
 */
export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FAFAF8' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}


import { useRouter } from 'expo-router';
import { Leaf } from 'lucide-react-native';
import {
  ActivityIndicator,
  Image,
  Pressable,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';

/**
 * Login Screen
 * 
 * Clean, minimal login with Google OAuth only.
 * Works in Expo Go using web browser OAuth flow.
 */
export default function LoginScreen() {
  const router = useRouter();
  const { signInWithGoogle, isLoading, error, clearError } = useAuthStore();

  const handleGoogleSignIn = async () => {
    clearError();
    const result = await signInWithGoogle();
    
    if (result.success) {
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas">
      <View className="flex-1 px-6 justify-center">
        {/* Logo & Welcome */}
        <View className="items-center mb-16">
          <View className="w-24 h-24 rounded-full bg-brand-light items-center justify-center mb-6">
            <Leaf size={48} color="#7AA06E" strokeWidth={1.5} />
          </View>
          <Text className="text-4xl font-bold text-text-main">Kyou</Text>
          <Text className="text-xl text-brand mt-1">今日</Text>
          <Text className="text-base text-text-sub mt-4 text-center leading-6">
            오늘의 일기로{'\n'}일본어를 배워보세요
          </Text>
        </View>

        {/* Error Message */}
        {error && error !== 'cancelled' && (
          <View className="bg-error/10 rounded-xl p-4 mb-6">
            <Text className="text-error text-sm text-center">
              로그인에 실패했어요. 다시 시도해주세요.
            </Text>
          </View>
        )}

        {/* Google Sign In Button */}
        <Pressable
          onPress={handleGoogleSignIn}
          disabled={isLoading}
          className="h-14 rounded-full items-center justify-center flex-row bg-white border border-gray-200 active:bg-gray-50"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#4285F4" />
          ) : (
            <>
              {/* Google Logo */}
              <Image
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={{ width: 20, height: 20, marginRight: 12 }}
              />
              <Text className="text-gray-700 font-semibold text-base">
                Google로 시작하기
              </Text>
            </>
          )}
        </Pressable>

        {/* Info Text */}
        <Text className="text-text-muted text-xs text-center mt-6 leading-5">
          계속 진행하면 서비스 이용약관 및{'\n'}개인정보 처리방침에 동의하게 됩니다.
        </Text>
      </View>
    </SafeAreaView>
  );
}

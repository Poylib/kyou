import {
  Award,
  Bell,
  BookOpen,
  ChevronRight,
  Flame,
  GraduationCap,
  HelpCircle,
  Info,
  LogOut,
  Palette,
  Settings,
  User
} from 'lucide-react-native';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/authStore';
import { useDiaryStore } from '../../src/stores/diaryStore';

/**
 * MyPage Screen - Profile & Settings
 * 
 * Design Principles:
 * 1. Clear profile information at top
 * 2. Visual learning statistics
 * 3. Grouped settings menu
 * 4. Easy navigation to sub-pages
 */

// Menu item type
interface MenuItem {
  icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

export default function MyPageScreen() {
  // Auth state
  const { user, profile, signOut, isLoading } = useAuthStore();
  
  // Diary stats
  const { stats } = useDiaryStore();

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃 하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '로그아웃', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Auth guard will automatically redirect to login
          }
        },
      ]
    );
  };

  // Get user display info
  const displayName = profile?.nickname 
    || user?.user_metadata?.full_name 
    || user?.email?.split('@')[0] 
    || '사용자';
  
  const displayEmail = user?.email || '';
  
  const avatarUrl = profile?.avatar_url 
    || user?.user_metadata?.avatar_url 
    || user?.user_metadata?.picture;

  const defaultLevel = profile?.default_level || 'N4';

  // Format join date
  const joinDate = user?.created_at 
    ? new Date(user.created_at).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).replace(/\. /g, '.').replace('.', '')
    : '';

  // Settings menu items
  const settingsMenu: MenuItem[] = [
    { 
      icon: Bell, 
      label: '알림 설정',
      onPress: () => console.log('알림 설정')
    },
    { 
      icon: Palette, 
      label: '테마',
      value: '라이트',
      onPress: () => console.log('테마 설정')
    },
    { 
      icon: GraduationCap, 
      label: '기본 번역 레벨',
      value: defaultLevel,
      onPress: () => console.log('레벨 설정')
    },
  ];

  const accountMenu: MenuItem[] = [
    { 
      icon: User, 
      label: '프로필 수정',
      onPress: () => console.log('프로필 수정')
    },
    { 
      icon: LogOut, 
      label: '로그아웃',
      onPress: handleLogout,
      danger: true
    },
  ];

  const supportMenu: MenuItem[] = [
    { 
      icon: HelpCircle, 
      label: '고객센터',
      onPress: () => console.log('고객센터')
    },
    { 
      icon: Info, 
      label: '앱 정보',
      value: 'v1.0.0',
      onPress: () => console.log('앱 정보')
    },
  ];

  const renderMenuItem = (item: MenuItem, isLast: boolean) => (
    <Pressable
      key={item.label}
      onPress={item.onPress}
      disabled={isLoading}
      className={`flex-row items-center justify-between py-3.5 ${
        !isLast ? 'border-b border-gray-50' : ''
      } active:opacity-70`}
    >
      <View className="flex-row items-center">
        <item.icon 
          size={20} 
          color={item.danger ? '#D97D7D' : '#4B4036'} 
          strokeWidth={1.8} 
        />
        <Text className={`ml-3 text-base ${
          item.danger ? 'text-error' : 'text-text-main'
        }`}>
          {item.label}
        </Text>
      </View>
      <View className="flex-row items-center">
        {item.value && (
          <Text className="text-sm text-text-sub mr-2">{item.value}</Text>
        )}
        <ChevronRight size={18} color="#8C857B" strokeWidth={2} />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-canvas" edges={['left', 'right']}>
      <ScrollView 
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View className="mx-5 mt-4 mb-5">
          <View 
            className="bg-bg-surface rounded-3xl p-5"
            style={{
              shadowColor: '#7AA06E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.08,
              shadowRadius: 12,
            }}
          >
            <View className="flex-row items-center">
              {/* Avatar */}
              <View className="w-16 h-16 rounded-full bg-brand-light items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <Image 
                    source={{ uri: avatarUrl }} 
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <User size={28} color="#7AA06E" strokeWidth={1.5} />
                )}
              </View>

              {/* User Info */}
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-text-main">
                  {displayName}
                </Text>
                <Text className="text-sm text-text-sub mt-0.5" numberOfLines={1}>
                  {displayEmail}
                </Text>
                <View className="flex-row items-center mt-1.5">
                  <View className="bg-brand-light px-2 py-0.5 rounded-full mr-2">
                    <Text className="text-xs font-semibold text-brand-dark">
                      {defaultLevel}
                    </Text>
                  </View>
                  {joinDate && (
                    <Text className="text-xs text-text-sub">
                      {joinDate} 가입
                    </Text>
                  )}
                </View>
              </View>

              {/* Edit Button */}
              <Pressable 
                className="w-9 h-9 rounded-full bg-brand-light items-center justify-center active:bg-brand-light/70"
              >
                <Settings size={18} color="#56744C" strokeWidth={2} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Learning Stats */}
        <View className="mx-5 mb-5">
          <Text className="text-base font-semibold text-text-main mb-3">
            학습 통계
          </Text>
          <View className="flex-row gap-3">
            {/* Total Diaries */}
            <View 
              className="flex-1 bg-bg-surface rounded-2xl p-4 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="w-10 h-10 rounded-full bg-brand-light items-center justify-center mb-2">
                <BookOpen size={18} color="#7AA06E" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-text-main">
                {stats?.totalDiaries || 0}
              </Text>
              <Text className="text-xs text-text-sub mt-0.5">총 일기</Text>
            </View>

            {/* Total Vocabulary */}
            <View 
              className="flex-1 bg-bg-surface rounded-2xl p-4 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="w-10 h-10 rounded-full bg-accent/20 items-center justify-center mb-2">
                <GraduationCap size={18} color="#D4A853" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-text-main">
                {stats?.totalVocabulary || 0}
              </Text>
              <Text className="text-xs text-text-sub mt-0.5">학습 어휘</Text>
            </View>

            {/* Current Streak */}
            <View 
              className="flex-1 bg-bg-surface rounded-2xl p-4 items-center"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 8,
              }}
            >
              <View className="w-10 h-10 rounded-full bg-orange-100 items-center justify-center mb-2">
                <Flame size={18} color="#E85D04" strokeWidth={2} />
              </View>
              <Text className="text-2xl font-bold text-text-main">
                {stats?.currentStreak || 0}
              </Text>
              <Text className="text-xs text-text-sub mt-0.5">연속 작성</Text>
            </View>
          </View>

          {/* Max Streak Badge */}
          {(stats?.maxStreak || 0) > 0 && (
            <View className="mt-3 bg-brand-light/50 rounded-xl p-3 flex-row items-center">
              <Award size={18} color="#56744C" strokeWidth={2} />
              <Text className="ml-2 text-sm text-brand-dark">
                최고 기록: <Text className="font-bold">{stats?.maxStreak || 0}일</Text> 연속 작성
              </Text>
            </View>
          )}
        </View>

        {/* Settings Menu */}
        <View className="mx-5 mb-5">
          <Text className="text-base font-semibold text-text-main mb-3">
            설정
          </Text>
          <View 
            className="bg-bg-surface rounded-2xl px-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            {settingsMenu.map((item, index) => 
              renderMenuItem(item, index === settingsMenu.length - 1)
            )}
          </View>
        </View>

        {/* Account Menu */}
        <View className="mx-5 mb-5">
          <Text className="text-base font-semibold text-text-main mb-3">
            계정
          </Text>
          <View 
            className="bg-bg-surface rounded-2xl px-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            {accountMenu.map((item, index) => 
              renderMenuItem(item, index === accountMenu.length - 1)
            )}
          </View>
        </View>

        {/* Support Menu */}
        <View className="mx-5 mb-5">
          <Text className="text-base font-semibold text-text-main mb-3">
            지원
          </Text>
          <View 
            className="bg-bg-surface rounded-2xl px-4"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
            }}
          >
            {supportMenu.map((item, index) => 
              renderMenuItem(item, index === supportMenu.length - 1)
            )}
          </View>
        </View>

        {/* App Branding */}
        <View className="items-center mt-4 mb-8">
          <Text className="text-lg font-bold text-brand">Kyou 今日</Text>
          <Text className="text-xs text-text-sub mt-1">
            Record your today, Master Japanese.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

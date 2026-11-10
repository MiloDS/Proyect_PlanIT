import { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Alert,
  DevSettings,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Pencil,
  RotateCcw,
} from 'lucide-react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { colors } from '../styles/colors';
import { useAuth } from '../services/AuthContext';
import { AuthService } from '../services/authService';
import { useProfile } from '../services/ProfileContext';
import { resetOnboarding } from '../utils/storage';
import { getDisplayAvatar, getDisplayName } from '../utils/user';
import { messages } from '../utils/messages';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<AppStackParamList>
>;

type MenuItemProps = {
  icon: ReactNode;
  title: string;
  value?: string;
  isDestructive?: boolean;
  /** Sin onPress la fila solo muestra información */
  onPress?: () => void;
};

function MenuItem({ icon, title, value, isDestructive = false, onPress }: MenuItemProps) {
  if (!onPress) {
    return (
      <View style={styles.menuItem} accessible accessibilityLabel={`${title}: ${value ?? ''}`}>
        <View style={styles.menuLeft}>
          <View style={styles.menuIcon}>{icon}</View>
          <Text style={styles.menuTitle}>{title}</Text>
        </View>
        {!!value && <Text style={styles.menuValue}>{value}</Text>}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
    >
      <View style={styles.menuLeft}>
        <View style={styles.menuIcon}>{icon}</View>
        <Text style={[styles.menuTitle, isDestructive && styles.destructiveText]}>{title}</Text>
      </View>

      <View style={styles.menuRight}>
        {!!value && <Text style={styles.menuValue}>{value}</Text>}
        {!isDestructive && <ChevronRight size={18} color={colors.textMuted} />}
      </View>
    </Pressable>
  );
}

// Solo en desarrollo: la Intro aparece únicamente sin sesión y sin la marca de onboarding,
// así que se borran ambas y se recarga la app
async function replayOnboarding() {
  try {
    await resetOnboarding();
    await AuthService.logout();
    DevSettings.reload();
  } catch (err: any) {
    Alert.alert(messages.common.errorTitle, err.message || messages.auth.onboardingResetFailed);
  }
}

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useProfile();
  const avatarUrl = getDisplayAvatar(user, profile);
  const editProfile = () => navigation.navigate('EditProfile');

  const handleLogout = () => {
    Alert.alert(messages.auth.logoutTitle, messages.auth.logoutConfirm, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          // Al cerrar sesión, AppNavigator vuelve a mostrar Login
          try {
            await AuthService.logout();
          } catch (err: any) {
            Alert.alert(messages.common.errorTitle, err.message || messages.auth.logoutFailed);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatarContainer}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatar} />
          ) : (
            <User size={44} color={colors.white} />
          )}
        </View>

        <View style={styles.nameContainer}>
          <Text style={styles.userName}>{getDisplayName(user, profile)}</Text>
          <Pressable
            onPress={editProfile}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={({ pressed }) => [styles.editButton, pressed && styles.editButtonPressed]}
          >
            <Pencil size={17} color={colors.white} />
          </Pressable>
        </View>

        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.contentContainer}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <MenuItem
            icon={<User size={21} color={colors.textBody} />}
            title="Información personal"
            onPress={editProfile}
          />
          <MenuItem
            icon={<Bell size={21} color={colors.textBody} />}
            title="Notificaciones"
            onPress={() => navigation.navigate('Notifications')}
          />
          {/* Por ahora la app solo está en español */}
          <MenuItem
            icon={<Globe size={21} color={colors.textBody} />}
            title="Idioma"
            value="Español"
          />
          <MenuItem
            icon={<HelpCircle size={21} color={colors.textBody} />}
            title="Ayuda y soporte"
            onPress={() => navigation.navigate('Help')}
          />

          {__DEV__ && (
            <MenuItem
              icon={<RotateCcw size={21} color={colors.textBody} />}
              title="Ver la Intro de nuevo (desarrollo)"
              onPress={replayOnboarding}
            />
          )}

          <MenuItem
            icon={<LogOut size={21} color={colors.danger} />}
            title="Cerrar sesión"
            isDestructive
            onPress={handleLogout}
          />
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
  },

  /* Encabezado del perfil */
  profileHeader: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: colors.white,
    overflow: 'hidden',
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryDark,
    elevation: 5,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userName: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '700',
  },
  editButton: {
    marginLeft: 8,
    padding: 5,
  },
  editButtonPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.95 }],
  },
  userEmail: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '400',
  },

  /* Contenido */
  contentContainer: {
    flex: 1,
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -16,
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },

  /* Elementos del menú */
  menuItem: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemPressed: {
    backgroundColor: colors.surface,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  destructiveText: {
    color: colors.danger,
    fontWeight: '600',
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuValue: {
    color: colors.textMuted,
    fontSize: 12,
    marginRight: 5,
    fontWeight: '400',
  },
});

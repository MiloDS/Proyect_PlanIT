import { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  Switch,
  DevSettings,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Camera,
  Globe,
  HelpCircle,
  LogOut,
  ChevronRight,
  Pencil,
  Moon,
  RotateCcw,
} from 'lucide-react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

import { AppStackParamList, MainTabParamList } from '../types/navigation';
import { MemberAvatar } from '../components/MemberAvatar';
import { useAuth } from '../services/AuthContext';
import { AuthService } from '../services/authService';
import { useProfile } from '../services/ProfileContext';
import { useTheme } from '../services/ThemeContext';
import { getDisplayAvatar, getDisplayName } from '../utils/user';
import { messages } from '../utils/messages';
import { resetOnboarding } from '../utils/storage';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<AppStackParamList>
>;

// ─── MenuItem: fila de menú reutilizable ──────────────────────────────────────

type MenuItemProps = {
  icon: ReactNode;
  title: string;
  value?: string;
  isDestructive?: boolean;
  /** Sin onPress la fila solo muestra información */
  onPress?: () => void;
  /** Cuando se pasa, se renderiza el switch en lugar de la flecha */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  switchTrackColorOn?: string;
};

function MenuItem({
  icon,
  title,
  value,
  isDestructive = false,
  onPress,
  switchValue,
  onSwitchChange,
  switchTrackColorOn,
}: MenuItemProps) {
  const { colors } = useTheme();
  const themedStyles = makeStyles(colors);

  const hasSwitchControl = switchValue !== undefined && onSwitchChange !== undefined;

  // Fila de solo lectura (sin botón ni switch)
  if (!onPress && !hasSwitchControl) {
    return (
      <View
        style={themedStyles.menuItem}
        accessible
        accessibilityLabel={`${title}: ${value ?? ''}`}
      >
        <View style={themedStyles.menuLeft}>
          <View style={themedStyles.menuIcon}>{icon}</View>
          <Text style={themedStyles.menuTitle}>{title}</Text>
        </View>
        {!!value && <Text style={themedStyles.menuValue}>{value}</Text>}
      </View>
    );
  }

  // Fila con switch (modo oscuro u otras preferencias de toggle)
  if (hasSwitchControl) {
    return (
      <View style={themedStyles.menuItem} accessible accessibilityLabel={title}>
        <View style={themedStyles.menuLeft}>
          <View style={themedStyles.menuIcon}>{icon}</View>
          <Text style={themedStyles.menuTitle}>{title}</Text>
        </View>
        <Switch
          value={switchValue}
          onValueChange={onSwitchChange}
          trackColor={{ false: colors.inactive, true: switchTrackColorOn ?? colors.primary }}
          thumbColor={colors.white}
          accessibilityRole="switch"
          accessibilityState={{ checked: switchValue }}
        />
      </View>
    );
  }

  // Fila con botón (flecha o destructivo)
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [themedStyles.menuItem, pressed && themedStyles.menuItemPressed]}
    >
      <View style={themedStyles.menuLeft}>
        <View style={themedStyles.menuIcon}>{icon}</View>
        <Text style={[themedStyles.menuTitle, isDestructive && themedStyles.destructiveText]}>
          {title}
        </Text>
      </View>

      <View style={themedStyles.menuRight}>
        {!!value && <Text style={themedStyles.menuValue}>{value}</Text>}
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

// ─── Pantalla de Perfil ───────────────────────────────────────────────────────

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { isDark, toggleTheme, colors } = useTheme();
  const themedStyles = makeStyles(colors);

  const avatarUrl = getDisplayAvatar(user, profile) ?? null;
  const displayName = getDisplayName(user, profile);
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
    <View style={themedStyles.container}>
      <StatusBar style="light" />

      <View style={[themedStyles.profileHeader, { paddingTop: insets.top + 16 }]}>
        <Pressable
          onPress={editProfile}
          accessibilityRole="button"
          accessibilityLabel="Cambiar foto de perfil"
          style={({ pressed }) => [
            themedStyles.avatarButton,
            pressed && themedStyles.editButtonPressed,
          ]}
        >
          <View style={themedStyles.avatarContainer}>
            <MemberAvatar name={displayName} avatarUrl={avatarUrl} size={92} />
          </View>
          <View style={themedStyles.cameraBadge}>
            <Camera size={15} color={colors.primary} />
          </View>
        </Pressable>

        <View style={themedStyles.nameContainer}>
          <Text style={themedStyles.userName}>{displayName}</Text>
          <Pressable
            onPress={editProfile}
            accessibilityRole="button"
            accessibilityLabel="Editar perfil"
            style={({ pressed }) => [
              themedStyles.editButton,
              pressed && themedStyles.editButtonPressed,
            ]}
          >
            <Pencil size={17} color={colors.white} />
          </Pressable>
        </View>

        <Text style={themedStyles.userEmail}>{user?.email}</Text>
      </View>

      <View style={themedStyles.contentContainer}>
        <ScrollView
          style={themedStyles.scrollView}
          contentContainerStyle={themedStyles.scrollContent}
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
          {/* Modo oscuro */}
          <MenuItem
            icon={<Moon size={21} color={colors.textBody} />}
            title="Modo oscuro"
            switchValue={isDark}
            onSwitchChange={toggleTheme}
            switchTrackColorOn={colors.primary}
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

// ─── Estilos dinámicos ────────────────────────────────────────────────────────

function makeStyles(
  colors: ReturnType<typeof import('../services/ThemeContext').useTheme>['colors']
) {
  return StyleSheet.create({
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
    avatarButton: {
      marginBottom: 12,
    },
    avatarContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      borderWidth: 2,
      borderColor: colors.white,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryDark,
      elevation: 5,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 30,
      height: 30,
      borderRadius: 15,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.card,
      elevation: 3,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
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
      backgroundColor: colors.card,
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
}

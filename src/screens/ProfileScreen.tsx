import { ReactNode } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, CreditCard, Bell, Globe, HelpCircle, LogOut, ChevronRight, Pencil } from 'lucide-react-native';

import { colors } from '../styles/colors';
import { useAuth } from '../services/AuthContext';
import { AuthService } from '../services/authService';
import { getAvatarUrl, getFullName } from '../utils/user';

type MenuItemProps = {
  icon: ReactNode;
  title: string;
  value?: string;
  isDestructive?: boolean;
  onPress: () => void;
};

const MENU_ITEMS = [
  { Icon: User, title: 'Información personal' },
  { Icon: CreditCard, title: 'Métodos de pago' },
  { Icon: Bell, title: 'Notificaciones' },
  { Icon: Globe, title: 'Idioma', value: 'Español' },
  { Icon: HelpCircle, title: 'Ayuda y soporte' },
];

function MenuItem({ icon, title, value, isDestructive = false, onPress }: MenuItemProps) {
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

// Las pantallas de ajustes aún no existen
function showComingSoon(title: string) {
  Alert.alert(title, 'Próximamente');
}

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const avatarUrl = getAvatarUrl(user);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro de que deseas cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          // Al cerrar sesión, AppNavigator vuelve a mostrar Login
          try {
            await AuthService.logout();
          } catch (err: any) {
            Alert.alert('Error', err.message || 'No se pudo cerrar sesión');
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
          <Text style={styles.userName}>{getFullName(user)}</Text>
          <Pressable
            onPress={() => showComingSoon('Editar perfil')}
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
          {MENU_ITEMS.map(({ Icon, title, value }) => (
            <MenuItem
              key={title}
              icon={<Icon size={21} color={colors.textBody} />}
              title={title}
              value={value}
              onPress={() => showComingSoon(title)}
            />
          ))}

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

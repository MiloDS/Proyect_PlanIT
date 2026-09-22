import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Image, Alert, } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { User, CreditCard, Bell, Globe, HelpCircle, LogOut, ChevronRight, Pencil, Signal, Wifi, Battery } from 'lucide-react-native';

import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { AppStackParamList, MainTabParamList } from '../types/navigation';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "Profile">,
  NativeStackScreenProps<AppStackParamList>
>;

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  value?: string;
  isDestructive?: boolean;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  value,
  isDestructive = false,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.menuItem,
        pressed && styles.menuItemPressed,
      ]}
    >
      {/* Parte izquierda */}
      <View style={styles.menuLeft}>
        <View style={styles.menuIcon}>
          {icon}
        </View>

        <Text
          style={[
            styles.menuTitle,
            isDestructive && styles.destructiveText,
          ]}
        >
          {title}
        </Text>
      </View>

      {/* Parte derecha */}
      <View style={styles.menuRight}>
        {value && (
          <Text style={styles.menuValue}>
            {value}
          </Text>
        )}

        {!isDestructive && (
          <ChevronRight
            size={18}
            color="#94A3B8"
          />
        )}
      </View>
    </Pressable>
  );
};

export function ProfileScreen({ navigation }: Props)  {
  const insets = useSafeAreaInsets();

  const handleNavigation = (screenName: string) => {
    
    console.log(`Navegando a la pantalla: ${screenName}`);
  };

  const handleLogout = () => {
  Alert.alert(
    'Cerrar sesión',
    '¿Estás seguro de que deseas cerrar sesión?',
    [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: () => {
          console.log('Sesión cerrada');
          navigation
            .getParent<NativeStackNavigationProp<AppStackParamList>>()
            ?.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]
  );
};

  return (
      <View style={styles.container}>
        <StatusBar style="light" />

        {/* ENCABEZADO DEL PERFIL */}
        <View style={[styles.profileHeader, { paddingTop: insets.top + 16 }]}>

          {/* Avatar */}
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=300&auto=format&fit=crop',
              }}
              style={styles.avatar}
            />
          </View>

          {/* Nombre + editar */}
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>Laura Gómez</Text>

            <Pressable
              onPress={() =>
                handleNavigation('EditProfile')
              }
              style={({ pressed }) => [
                styles.editButton,
                pressed && styles.editButtonPressed,
              ]}
            >
              <Pencil
                size={17}
                color="#FFFFFF"
              />
            </Pressable>
          </View>

          {/* Correo */}
          <Text style={styles.userEmail}>laura.gomez@email.com</Text>
        </View>

        {/* CONTENIDO */}
        <View style={styles.contentContainer}>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >

            <MenuItem
              icon={
                <User
                  size={21}
                  color="#334155"
                />
              }
              title="Información personal"
              onPress={() =>
                handleNavigation('PersonalInfo')
              }
            />

            <MenuItem
              icon={
                <CreditCard
                  size={21}
                  color="#334155"
                />
              }
              title="Métodos de pago"
              onPress={() =>
                handleNavigation('PaymentMethods')
              }
            />

            <MenuItem
              icon={
                <Bell
                  size={21}
                  color="#334155"
                />
              }
              title="Notificaciones"
              onPress={() =>
                handleNavigation('Notifications')
              }
            />

            <MenuItem
              icon={
                <Globe
                  size={21}
                  color="#334155"
                />
              }
              title="Idioma"
              value="Español"
              onPress={() =>
                handleNavigation('Language')
              }
            />

            <MenuItem
              icon={
                <HelpCircle
                  size={21}
                  color="#334155"
                />
              }
              title="Ayuda y soporte"
              onPress={() =>
                handleNavigation('Help')
              }
            />

            <MenuItem
              icon={
                <LogOut
                  size={21}
                  color="#DC2626"
                />
              }
              title="Cerrar sesión"
              isDestructive
              onPress={handleLogout}
            />

          </ScrollView>
        </View>
      </View>
  );
}

/*ESTILOS*/
const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },

  container: {
    flex: 1,
    backgroundColor: '#05A86B',
  },

  /* ---------- Barra de estado ---------- */
  statusBar: {
    height: 32,
    paddingHorizontal: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#05A86B',
  },

  statusTime: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  /* ---------- Perfil ---------- */
  profileHeader: {
    backgroundColor: '#05A86B',
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
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#048A58',

    // Sombra para Android
    elevation: 5,

    // Sombra para iOS
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
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
    color: '#FFFFFF',
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

  /* ---------- Contenido ---------- */
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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

  /* ---------- Elementos del menú ---------- */
  menuItem: {
    minHeight: 65,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },

  menuItemPressed: {
    backgroundColor: '#F8FAFC',
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
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },

  destructiveText: {
    color: '#DC2626',
    fontWeight: '600',
  },

  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuValue: {
    color: '#94A3B8',
    fontSize: 12,
    marginRight: 5,
    fontWeight: '400',
  },
});
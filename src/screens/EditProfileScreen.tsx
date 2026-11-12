import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, ImageIcon, Lock, Trash2 } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { SheetOption } from '../types/components';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { MemberAvatar } from '../components/MemberAvatar';
import { OptionsSheet } from '../components/OptionsSheet';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../services/AuthContext';
import { PhotoService, PhotoSource } from '../services/photoService';
import { useProfile } from '../services/ProfileContext';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { messages } from '../utils/messages';
import { getDisplayAvatar, getDisplayName } from '../utils/user';
import { validateName } from '../utils/validation';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

const AVATAR_SIZE = 96;

export function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();
  const { profile, updateFullName, updateAvatar, removeAvatar } = useProfile();
  const currentName = getDisplayName(user, profile);
  const avatarUrl = getDisplayAvatar(user, profile) ?? null;
  const [name, setName] = useState(currentName);
  const [nameError, setNameError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoOptionsOpen, setPhotoOptionsOpen] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');

  // La foto se guarda en cuanto se elige; el botón de abajo es solo para el nombre
  const changePhoto = async (source: PhotoSource) => {
    setPhotoError('');
    try {
      const imageUri = await PhotoService.pickAvatar(source);
      if (!imageUri) return;
      setPhotoBusy(true);
      await updateAvatar(imageUri);
    } catch (err: any) {
      setPhotoError(err.message);
    } finally {
      setPhotoBusy(false);
    }
  };

  const confirmRemovePhoto = () => {
    Alert.alert(messages.profile.removePhotoTitle, messages.profile.removePhotoConfirm, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Quitar',
        style: 'destructive',
        onPress: async () => {
          setPhotoError('');
          setPhotoBusy(true);
          try {
            await removeAvatar();
          } catch (err: any) {
            setPhotoError(err.message);
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);
  };

  const photoOptions: SheetOption[] = [
    { label: 'Tomar foto', Icon: Camera, onPress: () => changePhoto('camera') },
    { label: 'Elegir de la galería', Icon: ImageIcon, onPress: () => changePhoto('library') },
  ];
  if (avatarUrl) {
    photoOptions.push({
      label: 'Quitar foto',
      Icon: Trash2,
      onPress: confirmRemovePhoto,
      destructive: true,
    });
  }

  const save = async () => {
    const error = validateName(name);
    setNameError(error);
    setSaveError('');
    if (error) return;
    if (name.trim() === currentName) {
      navigation.goBack();
      return;
    }

    setSaving(true);
    try {
      await updateFullName(name);
      navigation.goBack();
    } catch (err: any) {
      setSaveError(err.message);
      setSaving(false);
    }
  };

  return (
    <View style={[globalStyles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <ScreenHeader
        title="Información personal"
        subtitle="Así te ven en tus planes"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <Pressable
              onPress={() => setPhotoOptionsOpen(true)}
              disabled={photoBusy}
              accessibilityRole="button"
              accessibilityLabel="Cambiar foto de perfil"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <MemberAvatar
                name={name.trim() || currentName}
                avatarUrl={avatarUrl}
                size={AVATAR_SIZE}
              />
              {photoBusy && (
                <View style={styles.avatarBusy}>
                  <ActivityIndicator color={colors.white} />
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Camera size={16} color={colors.white} />
              </View>
            </Pressable>
            <Pressable
              onPress={() => setPhotoOptionsOpen(true)}
              disabled={photoBusy}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text style={styles.changePhotoText}>
                {photoBusy ? 'Guardando foto…' : 'Cambiar foto'}
              </Text>
            </Pressable>
            {!!photoError && (
              <View style={styles.photoErrorBox}>
                <Banner type="error" message={photoError} />
              </View>
            )}
          </View>

          <InputField
            label="Nombre"
            placeholder="Tu nombre"
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError('');
            }}
            autoCapitalize="words"
            error={nameError}
          />

          <Text style={styles.label}>Correo</Text>
          <View
            style={styles.readOnlyField}
            accessible
            accessibilityLabel={`Correo: ${user?.email}`}
          >
            <Text style={styles.readOnlyText} numberOfLines={1}>
              {user?.email}
            </Text>
            <Lock size={16} color={colors.textMuted} />
          </View>
          <Text style={styles.hint}>
            Es el correo con el que entras y con el que tus amigos te invitan a sus planes.
          </Text>
        </ScrollView>

        <View style={[styles.bottomAction, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {!!saveError && <Banner type="error" message={saveError} />}
          <Button variant="primary" style={styles.saveButton} loading={saving} onPress={save}>
            <Text style={globalStyles.primaryButtonText}>Guardar cambios</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

      <OptionsSheet
        visible={photoOptionsOpen}
        title="Foto de perfil"
        options={photoOptions}
        onClose={() => setPhotoOptionsOpen(false)}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 24,
      paddingTop: 24,
      paddingBottom: 24,
    },
    avatarSection: {
      alignItems: 'center',
      gap: 10,
      marginBottom: 24,
    },
    pressed: {
      opacity: 0.7,
    },
    avatarBusy: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: AVATAR_SIZE,
      height: AVATAR_SIZE,
      borderRadius: AVATAR_SIZE / 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.overlay,
    },
    cameraBadge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 2,
      borderColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryDark,
    },
    changePhotoText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
    },
    photoErrorBox: {
      alignSelf: 'stretch',
    },
    label: {
      fontSize: 13,
      color: colors.textBody,
      marginBottom: 6,
    },
    readOnlyField: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
      minHeight: 52,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      backgroundColor: colors.surfaceMuted,
    },
    readOnlyText: {
      flex: 1,
      fontSize: 16,
      color: colors.textSecondary,
    },
    hint: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
      marginTop: 6,
    },
    bottomAction: {
      paddingHorizontal: 24,
      paddingTop: 12,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    saveButton: {
      borderRadius: 16,
    },
  });
}

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, KeyboardAvoidingView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Lock } from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { Banner } from '../components/Banner';
import { Button } from '../components/Button';
import { InputField } from '../components/InputField';
import { MemberAvatar } from '../components/MemberAvatar';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../services/AuthContext';
import { useProfile } from '../services/ProfileContext';
import { MAX_NAME_LENGTH } from '../services/profileService';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { getDisplayAvatar, getDisplayName } from '../utils/user';

type Props = NativeStackScreenProps<AppStackParamList, 'EditProfile'>;

function validateName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Escribe tu nombre';
  if (trimmed.length > MAX_NAME_LENGTH) return `Máximo ${MAX_NAME_LENGTH} caracteres`;
  return '';
}

export function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { profile, updateFullName } = useProfile();
  const currentName = getDisplayName(user, profile);
  const [name, setName] = useState(currentName);
  const [nameError, setNameError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const signedInWithGoogle = user?.app_metadata?.provider === 'google';

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
    <View style={globalStyles.screen}>
      <StatusBar style="dark" />
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
            <MemberAvatar
              name={name.trim() || currentName}
              avatarUrl={getDisplayAvatar(user, profile) ?? null}
              size={88}
            />
            {signedInWithGoogle && (
              <Text style={styles.hint}>Tu foto viene de tu cuenta de Google.</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    gap: 8,
    marginBottom: 24,
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
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  saveButton: {
    borderRadius: 16,
  },
});

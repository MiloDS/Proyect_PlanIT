import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { CalendarDays } from 'lucide-react-native';

import { PlanCardProps } from '../types/components';
import { FavoriteButton } from './FavoriteButton';
import { MemberAvatar } from './MemberAvatar';
import { useImageFallback } from '../services/useImageFallback';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { formatShortDate, formatTime } from '../utils/date';

const MAX_AVATARS = 4;

function CardContent({
  plan,
  isFavorite,
  onToggleFavorite,
  styles,
}: Omit<PlanCardProps, 'coverUrl' | 'onPress'> & { styles: ReturnType<typeof makeStyles> }) {
  const startsAt = new Date(plan.startsAt);
  const placesLabel = plan.placeIds.length === 1 ? '1 lugar' : `${plan.placeIds.length} lugares`;
  const extraMembers = plan.members.length - MAX_AVATARS;

  return (
    <View style={styles.overlay}>
      <View style={styles.titleRow}>
        <Text style={styles.title} numberOfLines={2}>
          {plan.title}
        </Text>
        <FavoriteButton
          variant="floating"
          size={18}
          isFavorite={isFavorite}
          itemName={plan.title}
          onPress={onToggleFavorite}
        />
      </View>
      <Text style={styles.subtitle}>
        {formatShortDate(startsAt)} · {formatTime(startsAt)} · {placesLabel}
      </Text>

      <View style={styles.avatarRow}>
        {plan.members.slice(0, MAX_AVATARS).map((member, index) => (
          <MemberAvatar
            key={member.userId}
            name={member.fullName}
            avatarUrl={member.avatarUrl}
            style={[styles.avatar, { zIndex: MAX_AVATARS - index }]}
          />
        ))}
        {extraMembers > 0 && <Text style={styles.extraMembers}>+{extraMembers}</Text>}
      </View>
    </View>
  );
}

export function PlanCard({ coverUrl, onPress, ...props }: PlanCardProps) {
  const startsAt = new Date(props.plan.startsAt);
  const cover = useImageFallback(coverUrl);
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors, isDark);

  // Al ser un botón, el lector de pantalla trata la tarjeta como un solo elemento: el
  // favorito queda disponible como acción de la tarjeta
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessible={!!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${props.plan.title}, ${formatShortDate(startsAt)}, ${formatTime(startsAt)}`}
      accessibilityHint="Abre el detalle del plan"
      accessibilityActions={[
        {
          name: 'toggleFavorite',
          label: props.isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos',
        },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'toggleFavorite') props.onToggleFavorite();
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {cover.showImage && coverUrl ? (
        <View style={styles.background}>
          <Image
            source={{ uri: coverUrl }}
            style={styles.coverImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            onError={cover.onError}
          />
          <CardContent {...props} styles={styles} />
        </View>
      ) : (
        <View style={[styles.background, styles.placeholder]}>
          <CalendarDays size={64} color={themeColors.primary} style={styles.placeholderIcon} />
          <CardContent {...props} styles={styles} />
        </View>
      )}
    </Pressable>
  );
}

function makeStyles(colors: ThemeColors, isDark: boolean) {
  return StyleSheet.create({
    card: {
      height: 150,
      borderRadius: 18,
      overflow: 'hidden',
      backgroundColor: colors.card,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 3,
    },
    pressed: {
      opacity: 0.85,
    },
    background: {
      flex: 1,
    },
    // La tarjeta recorta las esquinas (overflow hidden)
    coverImage: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    placeholder: {
      backgroundColor: colors.primaryLight,
    },
    placeholderIcon: {
      position: 'absolute',
      right: 20,
      bottom: 16,
      opacity: 0.35,
    },
    overlay: {
      flex: 1,
      padding: 16,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.65)',
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },
    title: {
      flex: 1,
      fontSize: 17,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textBody,
      marginTop: 2,
    },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 'auto',
    },
    avatar: {
      borderWidth: 2,
      borderColor: colors.card,
      marginRight: -8,
    },
    extraMembers: {
      marginLeft: 14,
      fontSize: 12,
      fontWeight: '700',
      color: colors.textBody,
    },
  });
}

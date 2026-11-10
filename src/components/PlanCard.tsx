import { Image, ImageBackground, StyleSheet, Text, View } from 'react-native';
import { CalendarDays } from 'lucide-react-native';

import { PlanCardProps } from '../types/components';
import { PlanMember } from '../types/plans';
import { FavoriteButton } from './FavoriteButton';
import { colors } from '../styles/colors';
import { formatShortDate, formatTime } from '../utils/date';

const MAX_AVATARS = 4;

function getInitials(name: string | null): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function MemberAvatar({ member, index }: { member: PlanMember; index: number }) {
  const style = [styles.avatar, { zIndex: MAX_AVATARS - index }];
  if (member.avatarUrl) {
    return <Image source={{ uri: member.avatarUrl }} style={style} />;
  }
  return (
    <View style={[style, styles.avatarFallback]}>
      <Text style={styles.avatarInitials}>{getInitials(member.fullName) || '?'}</Text>
    </View>
  );
}

function CardContent({ plan, isFavorite, onToggleFavorite }: Omit<PlanCardProps, 'coverUrl'>) {
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
          <MemberAvatar key={member.userId} member={member} index={index} />
        ))}
        {extraMembers > 0 && <Text style={styles.extraMembers}>+{extraMembers}</Text>}
      </View>
    </View>
  );
}

export function PlanCard({ coverUrl, ...props }: PlanCardProps) {
  return (
    <View style={styles.card}>
      {coverUrl ? (
        <ImageBackground
          source={{ uri: coverUrl }}
          style={styles.background}
          imageStyle={styles.image}
        >
          <CardContent {...props} />
        </ImageBackground>
      ) : (
        <View style={[styles.background, styles.placeholder]}>
          <CalendarDays size={64} color={colors.primary} style={styles.placeholderIcon} />
          <CardContent {...props} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 150,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  background: {
    flex: 1,
  },
  image: {
    borderRadius: 18,
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
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.white,
    marginRight: -8,
  },
  avatarFallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  extraMembers: {
    marginLeft: 14,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textBody,
  },
});

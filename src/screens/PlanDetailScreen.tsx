import { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  CalendarDays,
  CalendarX,
  ChevronLeft,
  Clock,
  Crown,
  Lightbulb,
  LogOut,
  LucideIcon,
  Pencil,
  Share2,
  StickyNote,
  Trash2,
  UserMinus,
  UserPlus,
  Wallet,
} from 'lucide-react-native';

import { AppStackParamList } from '../types/navigation';
import { SuggestionAction } from '../types/components';
import { Plan, PlanMember, PlanSuggestion } from '../types/plans';
import { EmptyState } from '../components/EmptyState';
import { FavoriteButton } from '../components/FavoriteButton';
import { InviteCodeCard } from '../components/InviteCodeCard';
import { InviteMemberModal } from '../components/InviteMemberModal';
import { ItineraryList, ItinerarySummary, TRANSPORT_ICONS } from '../components/Itinerary';
import { MemberAvatar } from '../components/MemberAvatar';
import { PlanSuggestionCard } from '../components/PlanSuggestionCard';
import { ScreenHeader } from '../components/ScreenHeader';
import { useAuth } from '../services/AuthContext';
import { useFavorites } from '../services/FavoritesContext';
import { PlacesService } from '../services/placesService';
import { PlanReminders } from '../services/planReminders';
import { PlansService } from '../services/plansService';
import { PlanSuggestionsService } from '../services/planSuggestionsService';
import { useDevicePosition } from '../services/useDevicePosition';
import { usePlacesById } from '../services/usePlacesById';
import { useImageFallback } from '../services/useImageFallback';
import { usePlanSuggestions } from '../services/usePlanSuggestions';
import { useRouteLegs } from '../services/useRouteLegs';
import { colors } from '../styles/colors';
import { globalStyles } from '../styles/globalStyles';
import { useTheme, ThemeColors } from '../services/ThemeContext';
import { formatPesos } from '../utils/currency';
import { formatDuration, formatLongDate, formatTime, isUpcoming } from '../utils/date';
import { distanceKm } from '../utils/geo';
import { formatInviteCode } from '../utils/inviteCode';
import { buildItinerary, getTransportLabel } from '../utils/itinerary';
import { messages } from '../utils/messages';
import { describePlanChanges, getSuggestedPlaceIds } from '../utils/planSuggestions';
import { isSameEmail } from '../utils/validation';

type Props = NativeStackScreenProps<AppStackParamList, 'PlanDetail'>;

const HEADER_IMAGE_HEIGHT = 240;

function getMemberName(member: PlanMember): string {
  return member.fullName?.trim() || 'Sin nombre';
}

function InfoRow({ Icon, text }: { Icon: LucideIcon; text: string }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.infoRow}>
      <Icon size={17} color={colors.textSecondary} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

type MemberRowProps = {
  member: PlanMember;
  isMe: boolean;
  onRemove?: () => void;
};

function MemberRow({ member, isMe, onRemove }: MemberRowProps) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const name = getMemberName(member);
  const role = member.role === 'owner' ? 'Organiza el plan' : 'Invitado';

  return (
    <View style={styles.memberRow}>
      <MemberAvatar name={member.fullName} avatarUrl={member.avatarUrl} size={42} />
      <View style={styles.memberInfo} accessible accessibilityLabel={`${name}, ${role}`}>
        <Text style={styles.memberName} numberOfLines={1}>
          {isMe ? `${name} (tú)` : name}
        </Text>
        <View style={styles.memberRoleRow}>
          {member.role === 'owner' && <Crown size={12} color={colors.rating} />}
          <Text style={styles.memberRole}>{role}</Text>
        </View>
      </View>
      {!!onRemove && (
        <Pressable
          onPress={onRemove}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Quitar a ${name} del plan`}
          style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
        >
          <UserMinus size={18} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

export function PlanDetailScreen({ navigation, route }: Props) {
  const planId = route.params.plan.id;
  const insets = useSafeAreaInsets();
  const { colors: themeColors, isDark } = useTheme();
  const styles = makeStyles(themeColors);
  const { user } = useAuth();
  const position = useDevicePosition();
  const favorites = useFavorites();
  const [plan, setPlan] = useState<Plan>(route.params.plan);
  const [isGone, setIsGone] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [answering, setAnswering] = useState<{ id: string; action: SuggestionAction } | null>(null);
  const { suggestions, reload: reloadSuggestions } = usePlanSuggestions(planId);
  const places = usePlacesById(plan.placeIds);
  // El itinerario usa los lugares que Google todavía tiene, en el orden del plan
  const foundPlaceIds = places.places.map((place) => place.id);
  const routeLegs = useRouteLegs(foundPlaceIds, plan.transportMode);
  // Portada: la foto del primer lugar o, si no tiene o no carga, el ícono del plan
  const coverUrl = places.places[0]?.photoUrl ?? null;
  const cover = useImageFallback(coverUrl);

  // Todos ven las pendientes; las respondidas (de los últimos días) solo quien las envió
  const pendingSuggestions = suggestions.filter((item) => item.status === 'pending');
  const myAnswered = suggestions.filter(
    (item) => item.status !== 'pending' && item.authorId === user?.id
  );
  const visibleSuggestions = [...pendingSuggestions, ...myAnswered];
  const myPendingSuggestion = pendingSuggestions.find((item) => item.authorId === user?.id);
  // Nombres de los lugares que las sugerencias agregan (los del plan ya están cargados)
  const suggestedPlaces = usePlacesById(
    getSuggestedPlaceIds(pendingSuggestions.map((item) => item.changes)).filter(
      (id) => !plan.placeIds.includes(id)
    )
  );

  // La versión más reciente del plan; null si se eliminó o el usuario ya no es miembro
  const refresh = useCallback(
    async (isCancelled: () => boolean = () => false): Promise<Plan | null> => {
      try {
        const latest = await PlansService.get(planId);
        // El recordatorio sigue los cambios de fecha o nombre
        if (latest) PlanReminders.update(latest);
        else PlanReminders.cancel(planId);
        if (isCancelled()) return latest;
        if (latest) setPlan(latest);
        else setIsGone(true);
        return latest;
      } catch {
        // Sin conexión se sigue mostrando la última versión conocida
        return null;
      }
    },
    [planId]
  );

  // Al volver de editar el plan se ven los cambios
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      refresh(() => cancelled);
      reloadSuggestions();
      return () => {
        cancelled = true;
      };
    }, [refresh, reloadSuggestions])
  );

  if (isGone) {
    return (
      <View style={globalStyles.screen}>
        <StatusBar style="dark" />
        <ScreenHeader title="Plan" onBack={() => navigation.goBack()} />
        <EmptyState
          icon={<CalendarX size={28} color={colors.primary} />}
          title={messages.plans.unavailableTitle}
          message={messages.plans.unavailableMessage}
          actionLabel="Volver"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const startsAt = new Date(plan.startsAt);
  const isOwner = plan.ownerId === user?.id;
  const owner = plan.members.find((member) => member.role === 'owner');
  const missingPlaces = places.loading ? 0 : plan.placeIds.length - places.places.length;

  const itinerary = buildItinerary(startsAt, foundPlaceIds, plan.stayMinutes, routeLegs.legs);
  const timeRange = itinerary.endsAt
    ? `${formatTime(startsAt)} – ${formatTime(itinerary.endsAt)} (aprox.)`
    : formatTime(startsAt);
  const budgetText =
    plan.budgetPerPerson !== null ? `${formatPesos(plan.budgetPerPerson)} por persona` : null;

  const share = () => {
    const details = [getTransportLabel(plan.transportMode, true), budgetText].filter(Boolean);
    const lines = [plan.title, `${formatLongDate(startsAt)} · ${timeRange}`, details.join(' · ')];
    if (plan.notes) lines.push(`Notas: ${plan.notes}`);
    lines.push(`Únete en PlanIt con el código ${formatInviteCode(plan.inviteCode)}`);
    if (places.places.length > 0) {
      lines.push(
        '',
        'Itinerario:',
        ...places.places.map((place, index) => {
          const stop = itinerary.stops[index];
          const time = stop ? `${formatTime(stop.arrivesAt)} ` : '';
          const stay = stop ? ` (${formatDuration(stop.stayMinutes)})` : '';
          return `${index + 1}. ${time}${place.name}${stay}: ${PlacesService.getMapsUrl(place)}`;
        })
      );
    }
    Share.share({ message: lines.join('\n') });
  };

  const invite = async (email: string): Promise<string> => {
    if (isSameEmail(email, user?.email)) throw new Error(messages.plans.inviteYourself);
    const membersBefore = plan.members.length;
    await PlansService.invite(plan.id, email);
    const latest = await refresh();
    // La base de datos no avisa si la persona ya era miembro: se nota en que no cambió nada
    if (latest && latest.members.length === membersBefore) {
      return messages.plans.alreadyMember;
    }
    return messages.plans.memberAdded(email);
  };

  const regenerateCode = async () => {
    const inviteCode = await PlansService.regenerateInviteCode(plan.id);
    setPlan((current) => ({ ...current, inviteCode }));
  };

  const ownerName = owner ? getMemberName(owner) : 'Quien organiza';
  const canSuggest = !isOwner && isUpcoming(startsAt);

  const getPlaceName = (placeId: string): string => {
    const place = [...places.places, ...suggestedPlaces.places].find((item) => item.id === placeId);
    if (place) return place.name;
    return places.loading || suggestedPlaces.loading ? 'Cargando lugar…' : 'Lugar no disponible';
  };

  // Un invitado no edita el plan: propone los cambios en el mismo formulario
  const suggestChanges = () => {
    if (myPendingSuggestion) {
      Alert.alert(messages.suggestions.alreadyPendingTitle, messages.suggestions.alreadyPending);
      return;
    }
    navigation.navigate('CreatePlan', { plan, suggest: true });
  };

  const answerSuggestion = (suggestion: PlanSuggestion, action: SuggestionAction) => {
    const name = suggestion.authorName?.trim() || 'Esta persona';
    const confirmations = {
      accept: {
        title: messages.suggestions.acceptTitle,
        message: messages.suggestions.acceptConfirm(name),
        confirm: 'Aceptar',
        style: 'default' as const,
        run: () => PlanSuggestionsService.accept(suggestion.id),
      },
      reject: {
        title: messages.suggestions.rejectTitle,
        message: messages.suggestions.rejectConfirm(name),
        confirm: 'Rechazar',
        style: 'destructive' as const,
        run: () => PlanSuggestionsService.reject(suggestion.id),
      },
      withdraw: {
        title: messages.suggestions.withdrawTitle,
        message: messages.suggestions.withdrawConfirm,
        confirm: 'Retirar',
        style: 'destructive' as const,
        run: () => PlanSuggestionsService.withdraw(suggestion.id),
      },
    };
    const { title, message, confirm, style, run } = confirmations[action];

    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: confirm,
        style,
        onPress: async () => {
          setAnswering({ id: suggestion.id, action });
          try {
            await run();
            // Al aceptar cambian los datos, el itinerario y el recordatorio del plan
            if (action === 'accept') await refresh();
          } catch (err: any) {
            Alert.alert(title, err.message);
          } finally {
            await reloadSuggestions();
            setAnswering(null);
          }
        },
      },
    ]);
  };

  const removeMember = (member: PlanMember) => {
    const name = getMemberName(member);
    Alert.alert(
      messages.plans.removeMemberTitle,
      messages.plans.removeMemberConfirm(name, plan.title),
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            try {
              await PlansService.removeMember(plan.id, member.userId);
              setPlan((current) => ({
                ...current,
                members: current.members.filter((item) => item.userId !== member.userId),
              }));
            } catch (err: any) {
              Alert.alert(messages.plans.removeMemberFailedTitle, err.message);
            }
          },
        },
      ]
    );
  };

  // El dueño elimina el plan para todos; un invitado solo se sale
  const leaveOrDelete = () => {
    const action = isOwner
      ? {
          title: messages.plans.deleteTitle,
          message: messages.plans.deleteConfirm(plan.title),
          confirm: 'Eliminar',
          run: () => PlansService.remove(plan.id),
          errorTitle: messages.plans.deleteFailedTitle,
        }
      : {
          title: messages.plans.leaveTitle,
          message: messages.plans.leaveConfirm(plan.title),
          confirm: 'Salir',
          run: () => PlansService.removeMember(plan.id, user?.id ?? ''),
          errorTitle: messages.plans.leaveFailedTitle,
        };

    Alert.alert(action.title, action.message, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: action.confirm,
        style: 'destructive',
        onPress: async () => {
          setLeaving(true);
          try {
            await action.run();
            // El plan desaparece de los favoritos y recordatorios de esta persona
            favorites.reload();
            PlanReminders.cancel(plan.id);
            navigation.goBack();
          } catch (err: any) {
            setLeaving(false);
            Alert.alert(action.errorTitle, err.message);
          }
        },
      },
    ]);
  };

  const renderPlaces = () => {
    if (places.loading && places.places.length === 0) {
      return <ActivityIndicator color={colors.primary} style={styles.loading} />;
    }
    if (places.error) {
      return (
        <View style={styles.inlineMessage}>
          <Text style={styles.mutedText}>{places.error}</Text>
          <Pressable onPress={places.retry} accessibilityRole="button" hitSlop={8}>
            <Text style={styles.link}>Reintentar</Text>
          </Pressable>
        </View>
      );
    }
    if (plan.placeIds.length === 0) {
      return <Text style={styles.mutedText}>Este plan todavía no tiene lugares.</Text>;
    }
    return (
      <View>
        <ItineraryList
          places={places.places}
          itinerary={itinerary}
          transportMode={plan.transportMode}
          legs={routeLegs.legs}
          legsLoading={routeLegs.loading}
          getDistanceKm={(place) =>
            position ? distanceKm(position.coordinates, place.location) : null
          }
          onPressPlace={(place) => navigation.navigate('PlaceDetail', { place })}
        />
        <ItinerarySummary
          itinerary={itinerary}
          legsLoading={routeLegs.loading}
          legsError={routeLegs.error}
          onRetryLegs={routeLegs.retry}
        />
        {missingPlaces > 0 && (
          <Text style={[styles.mutedText, styles.missingPlaces]}>
            {messages.plans.missingPlaces(missingPlaces)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[globalStyles.screen, { backgroundColor: themeColors.background }]}>
      <StatusBar style={cover.showImage ? 'light' : isDark ? 'light' : 'dark'} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {cover.showImage && coverUrl ? (
          <Image
            source={{ uri: coverUrl }}
            style={styles.headerImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={150}
            onError={cover.onError}
          />
        ) : (
          <View style={[styles.headerImage, styles.headerPlaceholder]}>
            <CalendarDays size={56} color={colors.primary} />
          </View>
        )}

        <View style={styles.sheet}>
          {!isUpcoming(startsAt) && <Text style={styles.pastBadge}>Ya pasó</Text>}
          <Text style={styles.title} accessibilityRole="header">
            {plan.title}
          </Text>

          <View style={styles.infoList}>
            <InfoRow Icon={CalendarDays} text={formatLongDate(startsAt)} />
            <InfoRow Icon={Clock} text={timeRange} />
            <InfoRow
              Icon={TRANSPORT_ICONS[plan.transportMode]}
              text={getTransportLabel(plan.transportMode, true)}
            />
            {!!budgetText && <InfoRow Icon={Wallet} text={budgetText} />}
            {!!owner && (
              <InfoRow
                Icon={Crown}
                text={isOwner ? 'Tú organizas este plan' : `Organiza ${getMemberName(owner)}`}
              />
            )}
          </View>

          {!!plan.notes && (
            <View style={styles.notes}>
              <StickyNote size={17} color={colors.textSecondary} />
              <Text style={styles.notesText}>{plan.notes}</Text>
            </View>
          )}

          {(visibleSuggestions.length > 0 || canSuggest) && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  Sugerencias
                  {pendingSuggestions.length > 0 ? ` (${pendingSuggestions.length})` : ''}
                </Text>
                {canSuggest && !myPendingSuggestion && (
                  <Pressable
                    onPress={suggestChanges}
                    accessibilityRole="button"
                    hitSlop={8}
                    style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
                  >
                    <Lightbulb size={16} color={colors.primary} />
                    <Text style={styles.link}>Sugerir cambios</Text>
                  </Pressable>
                )}
              </View>
              {visibleSuggestions.length === 0 ? (
                <Text style={styles.mutedText}>
                  ¿Cambiarías algo del plan? Sugiérelo y {ownerName} decide si lo aplica.
                </Text>
              ) : (
                <View style={styles.list}>
                  {visibleSuggestions.map((suggestion) => (
                    <PlanSuggestionCard
                      key={suggestion.id}
                      suggestion={suggestion}
                      rows={describePlanChanges(plan, suggestion.changes, getPlaceName)}
                      isMine={suggestion.authorId === user?.id}
                      canAnswer={isOwner}
                      busyAction={answering?.id === suggestion.id ? answering.action : null}
                      onAction={(action) => answerSuggestion(suggestion, action)}
                    />
                  ))}
                </View>
              )}
            </>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Itinerario ({plan.placeIds.length})</Text>
          </View>
          {renderPlaces()}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personas ({plan.members.length})</Text>
            {isOwner && (
              <Pressable
                onPress={() => setInviteOpen(true)}
                accessibilityRole="button"
                hitSlop={8}
                style={({ pressed }) => [styles.inviteButton, pressed && styles.pressed]}
              >
                <UserPlus size={16} color={colors.primary} />
                <Text style={styles.link}>Invitar</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.list}>
            {plan.members.map((member) => (
              <MemberRow
                key={member.userId}
                member={member}
                isMe={member.userId === user?.id}
                onRemove={
                  isOwner && member.role === 'member' ? () => removeMember(member) : undefined
                }
              />
            ))}
          </View>
          <InviteCodeCard
            code={plan.inviteCode}
            planTitle={plan.title}
            onRegenerate={isOwner ? regenerateCode : undefined}
          />

          <Pressable
            onPress={leaveOrDelete}
            disabled={leaving}
            accessibilityRole="button"
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
          >
            {leaving ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <>
                {isOwner ? (
                  <Trash2 size={18} color={colors.danger} />
                ) : (
                  <LogOut size={18} color={colors.danger} />
                )}
                <Text style={styles.dangerText}>
                  {isOwner ? 'Eliminar plan' : 'Salir del plan'}
                </Text>
              </>
            )}
          </Pressable>

          {places.places.length > 0 && <Text style={styles.attribution}>Datos de Google Maps</Text>}
        </View>
      </ScrollView>

      <View style={[styles.topActions, { top: insets.top + 8 }]}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
        >
          <ChevronLeft size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.topActionsRight}>
          <FavoriteButton
            variant="floating"
            isFavorite={favorites.isFavoritePlan(plan.id)}
            itemName={plan.title}
            onPress={() => favorites.togglePlan(plan.id)}
          />
          <Pressable
            onPress={share}
            accessibilityRole="button"
            accessibilityLabel="Compartir"
            style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
          >
            <Share2 size={19} color={colors.textPrimary} />
          </Pressable>
          {(isOwner || canSuggest) && (
            <Pressable
              onPress={isOwner ? () => navigation.navigate('CreatePlan', { plan }) : suggestChanges}
              accessibilityRole="button"
              accessibilityLabel={isOwner ? 'Editar plan' : 'Sugerir cambios'}
              style={({ pressed }) => [styles.circleButton, pressed && styles.pressed]}
            >
              <Pencil size={18} color={colors.textPrimary} />
            </Pressable>
          )}
        </View>
      </View>

      <InviteMemberModal
        visible={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={invite}
      />
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    scrollContent: {
      paddingBottom: 32,
    },
    headerImage: {
      width: '100%',
      height: HEADER_IMAGE_HEIGHT,
    },
    headerPlaceholder: {
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sheet: {
      marginTop: -24,
      backgroundColor: colors.background,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      paddingHorizontal: 24,
      paddingTop: 22,
    },
    pastBadge: {
      alignSelf: 'flex-start',
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
      backgroundColor: colors.surfaceMuted,
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      marginBottom: 8,
      overflow: 'hidden',
    },
    title: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    infoList: {
      gap: 8,
      marginTop: 12,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoText: {
      fontSize: 14,
      color: colors.textBody,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 24,
      marginBottom: 10,
    },
    sectionTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    inviteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    link: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
    },
    list: {
      gap: 10,
    },
    loading: {
      marginVertical: 16,
    },
    inlineMessage: {
      alignItems: 'flex-start',
      gap: 6,
    },
    mutedText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
    },
    missingPlaces: {
      marginTop: 10,
    },
    notes: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 16,
      padding: 14,
      borderRadius: 14,
      backgroundColor: colors.surface,
    },
    notesText: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textBody,
    },
    memberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    memberInfo: {
      flex: 1,
    },
    memberName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    memberRoleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 1,
    },
    memberRole: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    removeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surfaceMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dangerButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      minHeight: 50,
      marginTop: 32,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerSurface,
    },
    dangerText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.danger,
    },
    attribution: {
      fontSize: 10,
      color: colors.textMuted,
      marginTop: 16,
    },
    topActions: {
      position: 'absolute',
      left: 20,
      right: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    topActionsRight: {
      flexDirection: 'row',
      gap: 10,
    },
    circleButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
    },
    pressed: {
      opacity: 0.7,
    },
  });
}

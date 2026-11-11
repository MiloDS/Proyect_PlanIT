import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowDown,
  ArrowUp,
  Bus,
  Car,
  ChevronDown,
  Flag,
  Footprints,
  Hourglass,
  LucideIcon,
  X,
} from 'lucide-react-native';

import { ItineraryListProps, ItinerarySummaryProps } from '../types/components';
import { RouteLeg, TransportMode } from '../types/plans';
import { PlaceListItem } from './PlaceListItem';
import { colors } from '../styles/colors';
import { formatDuration, formatTime } from '../utils/date';
import { formatDistance } from '../utils/geo';

export const TRANSPORT_ICONS: Record<TransportMode, LucideIcon> = {
  walk: Footprints,
  drive: Car,
  transit: Bus,
};

function legText(leg: RouteLeg | null, loading: boolean): string {
  if (!leg) return loading ? 'Calculando traslado…' : 'Sin datos del traslado';
  if (leg.durationSeconds === null) return 'No hay ruta entre estos lugares';
  const parts = [formatDuration(leg.durationSeconds / 60)];
  if (leg.distanceMeters) parts.push(formatDistance(leg.distanceMeters));
  return parts.join(' · ');
}

function IconButton({
  Icon,
  label,
  onPress,
  disabled = false,
}: {
  Icon: LucideIcon;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
    >
      <Icon size={18} color={disabled ? colors.inactive : colors.textSecondary} />
    </Pressable>
  );
}

/**
 * Lugares del plan en orden, con la hora de llegada, el tiempo en cada uno y el traslado
 * al siguiente
 */
export function ItineraryList({
  places,
  itinerary,
  transportMode,
  legs,
  legsLoading,
  getDistanceKm,
  onPressPlace,
  onMove,
  onRemove,
  onChangeStay,
}: ItineraryListProps) {
  const editable = !!onMove;
  const LegIcon = TRANSPORT_ICONS[transportMode];

  return (
    <View>
      {places.map((place, index) => {
        const stop = itinerary.stops[index];
        if (!stop) return null;
        const isLast = index === places.length - 1;

        return (
          <Fragment key={place.id}>
            <View style={styles.stopHeader}>
              <View style={styles.stopNumber}>
                <Text style={styles.stopNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stopTime}>
                {formatTime(stop.arrivesAt)} – {formatTime(stop.leavesAt)}
              </Text>
              {!editable && (
                <Text style={styles.stopStay}>· {formatDuration(stop.stayMinutes)}</Text>
              )}
            </View>

            <PlaceListItem
              place={place}
              distanceKm={getDistanceKm(place)}
              showRating={!editable}
              onPress={onPressPlace ? () => onPressPlace(place) : undefined}
              action={
                onRemove && (
                  <Pressable
                    onPress={() => onRemove(index)}
                    accessibilityRole="button"
                    accessibilityLabel={`Quitar ${place.name}`}
                    hitSlop={8}
                  >
                    <X size={18} color={colors.textSecondary} />
                  </Pressable>
                )
              }
            />

            {editable && (
              <View style={styles.controls}>
                <Pressable
                  onPress={() => onChangeStay?.(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Tiempo en ${place.name}: ${formatDuration(stop.stayMinutes)}. Cambiar`}
                  style={({ pressed }) => [styles.stayChip, pressed && styles.pressed]}
                >
                  <Hourglass size={14} color={colors.primary} />
                  <Text style={styles.stayChipText}>{formatDuration(stop.stayMinutes)}</Text>
                  <ChevronDown size={14} color={colors.primary} />
                </Pressable>
                <View style={styles.moveButtons}>
                  <IconButton
                    Icon={ArrowUp}
                    label={`Subir ${place.name}`}
                    onPress={() => onMove(index, -1)}
                    disabled={index === 0}
                  />
                  <IconButton
                    Icon={ArrowDown}
                    label={`Bajar ${place.name}`}
                    onPress={() => onMove(index, 1)}
                    disabled={isLast}
                  />
                </View>
              </View>
            )}

            {!isLast && (
              <View style={styles.leg}>
                <View style={styles.legLine} />
                <LegIcon size={16} color={colors.textSecondary} />
                <Text style={styles.legText}>{legText(legs[index] ?? null, legsLoading)}</Text>
              </View>
            )}
          </Fragment>
        );
      })}
    </View>
  );
}

/** Hora de fin del plan y total de traslados */
export function ItinerarySummary({
  itinerary,
  legsLoading,
  legsError,
  onRetryLegs,
}: ItinerarySummaryProps) {
  if (!itinerary.endsAt) return null;

  const details: string[] = [];
  if (itinerary.travelMinutes > 0) {
    details.push(`${formatDuration(itinerary.travelMinutes)} de traslados`);
  }
  if (itinerary.distanceMeters > 0) details.push(formatDistance(itinerary.distanceMeters));
  let note = '';
  if (legsLoading) note = 'Calculando traslados…';
  else if (itinerary.unknownLegs > 0) {
    note =
      itinerary.unknownLegs === 1
        ? 'Sin contar 1 traslado que no pudimos calcular.'
        : `Sin contar ${itinerary.unknownLegs} traslados que no pudimos calcular.`;
  }

  return (
    <View style={styles.summary}>
      <View style={styles.summaryRow}>
        <Flag size={18} color={colors.primary} />
        <Text style={styles.summaryTitle}>Termina aprox. a las {formatTime(itinerary.endsAt)}</Text>
      </View>
      {details.length > 0 && <Text style={styles.summaryText}>{details.join(' · ')}</Text>}
      {!!note && <Text style={styles.summaryNote}>{note}</Text>}
      {!!legsError && !legsLoading && (
        <Pressable onPress={onRetryLegs} accessibilityRole="button" hitSlop={8}>
          <Text style={styles.retry}>{legsError} Reintentar</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stopNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  stopNumberText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  stopTime: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  stopStay: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  stayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
  },
  stayChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark,
  },
  moveButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
    paddingLeft: 4,
    marginVertical: 4,
  },
  legLine: {
    position: 'absolute',
    left: 10,
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
  },
  legText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  summary: {
    gap: 4,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  summaryText: {
    fontSize: 13,
    color: colors.textBody,
    marginLeft: 26,
  },
  summaryNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 26,
  },
  retry: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 26,
    marginTop: 2,
  },
  pressed: {
    opacity: 0.7,
  },
});

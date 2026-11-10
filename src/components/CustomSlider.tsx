import { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  AccessibilityActionEvent,
  GestureResponderEvent,
} from 'react-native';
import { CustomSliderProps } from '../types/components';
import { colors } from '../styles/colors';

const THUMB_SIZE = 22;

export function CustomSlider({
  minimumValue,
  maximumValue,
  step = 1,
  value,
  onValueChange,
  minimumTrackTintColor = colors.primary,
  maximumTrackTintColor = colors.primaryLight,
  thumbTintColor = colors.primary,
}: CustomSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  // Dónde empezó el toque: locationX dentro de la barra y pageX en la pantalla
  const gestureStartRef = useRef({ locationX: 0, pageX: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const positionToValue = (x: number) => {
    if (trackWidth <= 0) return minimumValue;

    const ratio = Math.min(Math.max(x / trackWidth, 0), 1);
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;

    return Math.min(Math.max(steppedValue, minimumValue), maximumValue);
  };

  const handleGrant = (event: GestureResponderEvent) => {
    // locationX es relativo al contenedor porque la barra y el círculo no reciben toques
    const { locationX, pageX } = event.nativeEvent;
    gestureStartRef.current = { locationX, pageX };
    onValueChange(positionToValue(locationX));
  };

  const handleMove = (event: GestureResponderEvent) => {
    const start = gestureStartRef.current;
    onValueChange(positionToValue(start.locationX + event.nativeEvent.pageX - start.pageX));
  };

  const handleAccessibilityAction = (event: AccessibilityActionEvent) => {
    const delta = event.nativeEvent.actionName === 'increment' ? step : -step;
    onValueChange(Math.min(Math.max(value + delta, minimumValue), maximumValue));
  };

  const percentage = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = percentage * trackWidth;

  return (
    <View
      style={styles.container}
      onLayout={handleLayout}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
      accessibilityRole="adjustable"
      accessibilityValue={{ min: minimumValue, max: maximumValue, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <View style={[styles.track, { backgroundColor: maximumTrackTintColor }]}>
        <View
          style={[
            styles.filledTrack,
            { width: thumbPosition, backgroundColor: minimumTrackTintColor },
          ]}
        />
        <View
          style={[
            styles.thumb,
            {
              left: thumbPosition - THUMB_SIZE / 2,
              backgroundColor: thumbTintColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingVertical: 10,
  },
  track: {
    height: 6,
    borderRadius: 3,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  filledTrack: {
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    position: 'absolute',
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});

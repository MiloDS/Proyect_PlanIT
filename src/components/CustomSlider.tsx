import { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, LayoutChangeEvent, AccessibilityActionEvent } from 'react-native';
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
  const trackWidthRef = useRef(0);
  const startXRef = useRef(0);

  // El PanResponder se crea una sola vez: lee las props más recientes desde esta ref
  const propsRef = useRef({ minimumValue, maximumValue, step, onValueChange });
  propsRef.current = { minimumValue, maximumValue, step, onValueChange };

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  };

  const positionToValue = (x: number) => {
    const { minimumValue: min, maximumValue: max, step: stepSize } = propsRef.current;
    const width = trackWidthRef.current;
    if (width <= 0) return min;

    const ratio = Math.min(Math.max(x / width, 0), 1);
    const rawValue = min + ratio * (max - min);
    const steppedValue = Math.round(rawValue / stepSize) * stepSize;

    return Math.min(Math.max(steppedValue, min), max);
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        // locationX es relativo al contenedor porque la barra y el círculo no reciben toques
        const touchX = event.nativeEvent.locationX;
        startXRef.current = touchX;
        propsRef.current.onValueChange(positionToValue(touchX));
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = startXRef.current + gestureState.dx;
        propsRef.current.onValueChange(positionToValue(newX));
      },
    })
  ).current;

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
      accessibilityRole="adjustable"
      accessibilityValue={{ min: minimumValue, max: maximumValue, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}
      {...panResponder.panHandlers}
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

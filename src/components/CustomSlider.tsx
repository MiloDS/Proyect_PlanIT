import { useRef, useState } from 'react';
import { View, PanResponder, StyleSheet, LayoutChangeEvent } from 'react-native';
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
  maximumTrackTintColor = '#D1FAE5',
  thumbTintColor = colors.primary,
}: CustomSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    trackWidthRef.current = width;
    setTrackWidth(width);
  };

  const positionToValue = (x: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return minimumValue;

    const ratio = Math.min(Math.max(x / width, 0), 1);
    const rawValue = minimumValue + ratio * (maximumValue - minimumValue);
    const steppedValue = Math.round(rawValue / step) * step;

    return Math.min(Math.max(steppedValue, minimumValue), maximumValue);
  };

  const startXRef = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        const touchX = event.nativeEvent.locationX;
        startXRef.current = touchX;
        onValueChange(positionToValue(touchX));
      },
      onPanResponderMove: (_, gestureState) => {
        const newX = startXRef.current + gestureState.dx;
        onValueChange(positionToValue(newX));
      },
    })
  ).current;

  const percentage = (value - minimumValue) / (maximumValue - minimumValue);
  const thumbPosition = percentage * trackWidth;

  return (
    <View style={styles.container}>
      <View
        style={[styles.track, { backgroundColor: maximumTrackTintColor }]}
        onLayout={handleLayout}
        {...panResponder.panHandlers}
      >
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
});
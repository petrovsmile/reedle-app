import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function Slider({
  style,
  value,
  minimumValue = 0,
  maximumValue = 1,
  step = 0,
  minimumTrackTintColor = '#3f51b5',
  maximumTrackTintColor = '#bdbdbd',
  disabled = false,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
}) {
  const range = maximumValue - minimumValue;
  const progress = range > 0
    ? Math.max(0, Math.min(100, ((value - minimumValue) / range) * 100))
    : 0;

  const emitValue = (event, callback) => {
    if (callback) callback(Number(event.currentTarget.value));
  };

  return (
    <View style={[styles.container, style]}>
      <input
        className="reedle-web-slider"
        aria-label="Перейти к странице"
        type="range"
        min={minimumValue}
        max={maximumValue}
        step={step || 1}
        value={value}
        disabled={disabled}
        onChange={(event) => emitValue(event, onValueChange)}
        onMouseDown={(event) => emitValue(event, onSlidingStart)}
        onTouchStart={(event) => emitValue(event, onSlidingStart)}
        onMouseUp={(event) => emitValue(event, onSlidingComplete)}
        onTouchEnd={(event) => emitValue(event, onSlidingComplete)}
        onKeyUp={(event) => emitValue(event, onSlidingComplete)}
        style={{
          width: '100%',
          height: '100%',
          margin: 0,
          cursor: disabled ? 'default' : 'pointer',
          accentColor: minimumTrackTintColor,
          background: `linear-gradient(to right, ${minimumTrackTintColor} 0%, ${minimumTrackTintColor} ${progress}%, ${maximumTrackTintColor} ${progress}%, ${maximumTrackTintColor} 100%)`,
          '--reedle-slider-color': minimumTrackTintColor,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
});

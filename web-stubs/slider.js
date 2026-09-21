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
  const [liveValue, setLiveValue] = React.useState(value);
  const liveValueRef = React.useRef(value);
  const isSlidingRef = React.useRef(false);

  React.useEffect(() => {
    if (isSlidingRef.current) return;

    liveValueRef.current = value;
    setLiveValue(value);
  }, [value]);

  const range = maximumValue - minimumValue;
  const progress = range > 0
    ? Math.max(0, Math.min(100, ((liveValue - minimumValue) / range) * 100))
    : 0;

  const emitValue = (event, callback) => {
    if (callback) callback(Number(event.currentTarget.value));
  };

  const startSliding = (event) => {
    isSlidingRef.current = true;
    emitValue(event, onSlidingStart);
  };

  const changeValue = (event) => {
    var nextValue = Number(event.currentTarget.value);
    if (nextValue === liveValueRef.current) return;

    liveValueRef.current = nextValue;
    setLiveValue(nextValue);
    if (onValueChange) onValueChange(nextValue);
  };

  const completeSliding = (event) => {
    changeValue(event);
    isSlidingRef.current = false;
    emitValue(event, onSlidingComplete);
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
        value={liveValue}
        disabled={disabled}
        onInput={changeValue}
        onChange={changeValue}
        onMouseDown={startSliding}
        onTouchStart={startSliding}
        onMouseUp={completeSliding}
        onTouchEnd={completeSliding}
        onKeyUp={completeSliding}
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

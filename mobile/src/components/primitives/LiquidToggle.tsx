import React, { useRef, useEffect } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';

export interface LiquidToggleProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  activeTrackColor?: string;
  inactiveTrackColor?: string;
  thumbColor?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const PADDING = 3;
const TRAVEL_DISTANCE = TRACK_WIDTH - THUMB_SIZE - PADDING * 2; // 20px

/**
 * LiquidToggle
 * 
 * An ultra-fluid iOS/Mercury switch with dynamic liquid deformation:
 * - Glides across the track with spring physics.
 * - Stretches horizontally (scaleX: 1.35) and compresses vertically (scaleY: 0.82)
 *   during transit to mimic a physical liquid droplet in motion.
 * - Rebounds and settles with an organic elastic wobble upon arrival.
 */
export const LiquidToggle: React.FC<LiquidToggleProps> = ({
  checked,
  onToggle,
  disabled = false,
  activeTrackColor = '#10B981',
  inactiveTrackColor = '#27272A',
  thumbColor = '#FFFFFF',
  style,
  accessibilityLabel,
}) => {
  const translateX = useRef(new Animated.Value(checked ? TRAVEL_DISTANCE : 0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const toValue = checked ? TRAVEL_DISTANCE : 0;

    Animated.parallel([
      // Smooth spring translation across track
      Animated.spring(translateX, {
        toValue,
        damping: 15,
        stiffness: 220,
        mass: 0.6,
        useNativeDriver: true,
      }),
      // Liquid droplet stretch & settle sequence
      Animated.sequence([
        // Mid-transit stretch
        Animated.timing(scaleX, {
          toValue: 1.35,
          duration: 70,
          useNativeDriver: true,
        }),
        // Liquid bounce settle
        Animated.spring(scaleX, {
          toValue: 1,
          damping: 7,
          stiffness: 200,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        // Mid-transit vertical compression
        Animated.timing(scaleY, {
          toValue: 0.82,
          duration: 70,
          useNativeDriver: true,
        }),
        // Liquid bounce settle
        Animated.spring(scaleY, {
          toValue: 1,
          damping: 7,
          stiffness: 200,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [checked]);

  const handlePressIn = () => {
    if (disabled) return;
    // Fluid pre-press anticipation squash
    Animated.parallel([
      Animated.spring(scaleX, {
        toValue: 1.15,
        damping: 12,
        stiffness: 350,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 0.90,
        damping: 12,
        stiffness: 350,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.parallel([
      Animated.spring(scaleX, {
        toValue: 1,
        damping: 8,
        stiffness: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        damping: 8,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <Pressable
      onPress={onToggle}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityState={{ checked }}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        { backgroundColor: checked ? activeTrackColor : inactiveTrackColor },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: thumbColor,
            transform: [{ translateX }, { scaleX }, { scaleY }],
          },
        ]}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: PADDING,
    justifyContent: 'center',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
});

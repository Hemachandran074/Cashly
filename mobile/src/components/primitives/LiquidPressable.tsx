import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';

export type LiquidMotionType = 'pill' | 'bubble' | 'subtle';

export interface LiquidPressableProps {
  onPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  motionType?: LiquidMotionType;
  disabled?: boolean;
  activeOpacity?: number;
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: object;
  hitSlop?: object | number;
  testID?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * LiquidPressable
 * 
 * An ultra-fluid, physical button wrapper that delivers organic "liquid motion":
 * - 'pill': Non-linear volume-conserving squish & stretch (compresses vertically,
 *           bulges horizontally, then rebounds with an elastic liquid wobble).
 * - 'bubble': Radial jelly compression and fluid spring overshoot (for circular buttons).
 * - 'subtle': Gentle elastic scale spring for compact chips and secondary actions.
 */
export const LiquidPressable: React.FC<LiquidPressableProps> = ({
  onPress,
  onPressIn,
  onPressOut,
  onLongPress,
  style,
  children,
  motionType = 'pill',
  disabled = false,
  activeOpacity = 0.88,
  accessibilityRole = 'button',
  accessibilityLabel,
  accessibilityState,
  hitSlop,
  testID,
}) => {
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const handlePressIn = (event: GestureResponderEvent) => {
    if (disabled) return;

    let targetScaleX = 0.94;
    let targetScaleY = 0.91;

    if (motionType === 'pill') {
      // Liquid droplet squash: height compresses, width expands organically
      targetScaleX = 1.03;
      targetScaleY = 0.90;
    } else if (motionType === 'bubble') {
      // Radial bubble compression
      targetScaleX = 0.88;
      targetScaleY = 0.88;
    } else {
      // Subtle uniform scale
      targetScaleX = 0.95;
      targetScaleY = 0.95;
    }

    Animated.parallel([
      Animated.spring(scaleX, {
        toValue: targetScaleX,
        damping: 14,
        stiffness: 350,
        mass: 0.5,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: targetScaleY,
        damping: 14,
        stiffness: 350,
        mass: 0.5,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: activeOpacity,
        duration: 70,
        useNativeDriver: true,
      }),
    ]).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    if (disabled) return;

    // Liquid rebound: elastic bounce with organic settling oscillation
    Animated.parallel([
      Animated.spring(scaleX, {
        toValue: 1,
        damping: 8,
        stiffness: 190,
        mass: 0.6,
        useNativeDriver: true,
      }),
      Animated.spring(scaleY, {
        toValue: 1,
        damping: 8,
        stiffness: 190,
        mass: 0.6,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();

    onPressOut?.(event);
  };

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onLongPress={onLongPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole as any}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      hitSlop={hitSlop}
      testID={testID}
      style={[
        style,
        {
          opacity,
          transform: [{ scaleX }, { scaleY }],
        },
      ]}
    >
      {children}
    </AnimatedPressable>
  );
};

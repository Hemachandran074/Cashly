import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme';
import { LiquidPressable } from './LiquidPressable';

export interface SegmentOption<T extends string = string> {
  id: T;
  label: string;
  badge?: string | number;
}

export interface LiquidSegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  selectedId: T;
  onSelect: (id: T) => void;
  style?: StyleProp<ViewStyle>;
  tabStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  activeTextStyle?: StyleProp<TextStyle>;
  activeBackgroundColor?: string;
  inactiveBackgroundColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  accessibilityLabel?: string;
}

/**
 * LiquidSegmentedControl
 * 
 * A tactile segmented button switch featuring:
 * - Fluid sliding liquid capsule that stretches in mid-transit (scaleX: 1.18, scaleY: 0.88)
 *   and bounces back with organic liquid overshoot upon landing.
 * - Non-linear squash & stretch on touch-down via LiquidPressable.
 * - Dynamic width measurement for pixel-perfect alignment across 2, 3, or more segments.
 */
export const LiquidSegmentedControl = <T extends string>({
  options,
  selectedId,
  onSelect,
  style,
  tabStyle,
  textStyle,
  activeTextStyle,
  activeBackgroundColor = '#FFFFFF',
  inactiveBackgroundColor = '#222226',
  activeTextColor = '#000000',
  inactiveTextColor = '#A1A1AA',
  accessibilityLabel,
}: LiquidSegmentedControlProps<T>): React.ReactElement => {
  const [containerWidth, setContainerWidth] = useState(0);

  const selectedIndex = Math.max(
    0,
    options.findIndex((opt) => opt.id === selectedId)
  );

  const padding = 3;
  const numTabs = Math.max(1, options.length);
  const tabWidth = containerWidth > 0 ? (containerWidth - padding * 2) / numTabs : 0;

  const translateX = useRef(new Animated.Value(0)).current;
  const scaleX = useRef(new Animated.Value(1)).current;
  const scaleY = useRef(new Animated.Value(1)).current;
  const isInitial = useRef(true);

  // Update highlighter position whenever selectedIndex or tabWidth changes
  useEffect(() => {
    if (tabWidth <= 0) return;

    const targetX = selectedIndex * tabWidth;

    if (isInitial.current) {
      translateX.setValue(targetX);
      isInitial.current = false;
      return;
    }

    Animated.parallel([
      // 1. Spring glide to target segment
      Animated.spring(translateX, {
        toValue: targetX,
        damping: 16,
        stiffness: 200,
        mass: 0.65,
        useNativeDriver: true,
      }),
      // 2. Liquid droplet stretch in flight & bouncy recovery
      Animated.sequence([
        Animated.timing(scaleX, {
          toValue: 1.18,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleX, {
          toValue: 1,
          damping: 7,
          stiffness: 190,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
      // 3. Liquid droplet height squash & recovery
      Animated.sequence([
        Animated.timing(scaleY, {
          toValue: 0.88,
          duration: 80,
          useNativeDriver: true,
        }),
        Animated.spring(scaleY, {
          toValue: 1,
          damping: 7,
          stiffness: 190,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [selectedIndex, tabWidth]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== containerWidth) {
      setContainerWidth(width);
    }
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        { backgroundColor: inactiveBackgroundColor },
        style,
      ]}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {/* Liquid Sliding Pill Highlighter */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.highlighter,
            {
              width: tabWidth,
              backgroundColor: activeBackgroundColor,
              transform: [
                { translateX },
                { scaleX },
                { scaleY },
              ],
            },
          ]}
          pointerEvents="none"
        />
      )}

      {/* Segment Buttons */}
      <View style={styles.tabsRow}>
        {options.map((option) => {
          const isSelected = option.id === selectedId;

          return (
            <LiquidPressable
              key={option.id}
              motionType="pill"
              onPress={() => onSelect(option.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={option.label}
              style={[styles.tab, tabStyle]}
            >
              <Text
                numberOfLines={1}
                style={[
                  styles.tabText,
                  { color: isSelected ? activeTextColor : inactiveTextColor },
                  textStyle,
                  isSelected && styles.tabTextActive,
                  isSelected && activeTextStyle,
                ]}
              >
                {option.label}
              </Text>
            </LiquidPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    padding: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  highlighter: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 3,
    borderRadius: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabText: {
    fontSize: 12,
    fontFamily: theme.typography.fonts.delightMedium,
    fontWeight: '500',
    textAlign: 'center',
  },
  tabTextActive: {
    fontWeight: '700',
  },
});

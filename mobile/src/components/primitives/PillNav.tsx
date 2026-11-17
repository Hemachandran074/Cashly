import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { Home, BarChart2, Calendar, Settings } from 'lucide-react-native';
import { LiquidPressable } from './LiquidPressable';

export type TabRoute = 'home' | 'analytics' | 'calendar' | 'settings';

export interface PillNavProps {
  currentTab: TabRoute;
  onTabChange: (tab: TabRoute) => void;
  style?: ViewStyle;
}

const TAB_INDEX_MAP: Record<TabRoute, number> = {
  home: 0,
  analytics: 1,
  calendar: 2,
  settings: 3,
};

const STEP_WIDTH = 60; // 48 button width + 12 gap

export const PillNav: React.FC<PillNavProps> = ({
  currentTab,
  onTabChange,
  style,
}) => {
  const activeIndex = TAB_INDEX_MAP[currentTab] ?? 0;
  const translateX = useRef(new Animated.Value(activeIndex * STEP_WIDTH)).current;
  const liquidScaleX = useRef(new Animated.Value(1)).current;
  const liquidScaleY = useRef(new Animated.Value(1)).current;

  // Animate the highlighter smoothly to the active tab's position with liquid droplet stretch & settle
  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: activeIndex * STEP_WIDTH,
        damping: 16,
        stiffness: 190,
        mass: 0.7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        // Stretch horizontally in mid-transit like a fluid droplet
        Animated.timing(liquidScaleX, {
          toValue: 1.18,
          duration: 90,
          useNativeDriver: true,
        }),
        // Liquid bounce settle upon arrival
        Animated.spring(liquidScaleX, {
          toValue: 1,
          damping: 7,
          stiffness: 180,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        // Compress vertically during stretch
        Animated.timing(liquidScaleY, {
          toValue: 0.88,
          duration: 90,
          useNativeDriver: true,
        }),
        // Liquid bounce settle
        Animated.spring(liquidScaleY, {
          toValue: 1,
          damping: 7,
          stiffness: 180,
          mass: 0.5,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [activeIndex]);

  const tabs: { id: TabRoute; renderIcon: (color: string) => React.ReactNode }[] = [
    {
      id: 'home',
      renderIcon: (color) => <Home size={22} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'analytics',
      renderIcon: (color) => <BarChart2 size={22} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'calendar',
      renderIcon: (color) => <Calendar size={22} color={color} strokeWidth={2.2} />,
    },
    {
      id: 'settings',
      renderIcon: (color) => <Settings size={22} color={color} strokeWidth={2.2} />,
    },
  ];

  return (
    <View style={[styles.wrapper, style]} pointerEvents="box-none">
      <View style={styles.pillContainer}>
        {/* Animated Sliding White Squircle Highlighter with Liquid Droplet Morph */}
        <Animated.View
          style={[
            styles.animatedHighlighter,
            {
              transform: [
                { translateX },
                { scaleX: liquidScaleX },
                { scaleY: liquidScaleY },
              ],
            },
          ]}
          pointerEvents="none"
        />

        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          const iconColor = isActive ? '#000000' : '#FFFFFF';

          return (
            <LiquidPressable
              key={tab.id}
              motionType="bubble"
              onPress={() => onTabChange(tab.id)}
              style={styles.tabButton}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              {tab.renderIcon(iconColor)}
            </LiquidPressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 28,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  pillContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    borderRadius: 22, // Rounded square container
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#2A2A30',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    gap: 12,
  },
  animatedHighlighter: {
    position: 'absolute',
    top: 8,
    left: 10,
    width: 48,
    height: 48,
    borderRadius: 14, // Rounded square (squircle) matching button shape
    backgroundColor: '#FFFFFF',
    zIndex: 0,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  tabButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});

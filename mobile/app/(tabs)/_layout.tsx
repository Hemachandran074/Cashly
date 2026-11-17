import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, PanResponder } from 'react-native';
import { Tabs, useRouter, usePathname } from 'expo-router';
import { PillNav, TabRoute } from '../../src/components/primitives/PillNav';
import { theme, useAppTheme } from '../../src/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const TAB_ORDER: TabRoute[] = ['home', 'analytics', 'calendar', 'settings'];

export default function TabLayout() {
  const { colors } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Determine active tab route based on pathname
  const getCurrentTab = (): TabRoute => {
    if (pathname.includes('/analytics')) return 'analytics';
    if (pathname.includes('/calendar')) return 'calendar';
    if (pathname.includes('/settings')) return 'settings';
    return 'home';
  };

  const handleTabChange = (tab: TabRoute) => {
    switch (tab) {
      case 'home':
        router.push('/(tabs)');
        break;
      case 'analytics':
        router.push('/(tabs)/analytics');
        break;
      case 'calendar':
        router.push('/(tabs)/calendar');
        break;
      case 'settings':
        router.push('/(tabs)/settings');
        break;
    }
  };

  // PanResponder to enable smooth horizontal swipe navigation between tab pages
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only capture deliberate horizontal swipes (prevents interrupting vertical ScrollViews)
        return (
          Math.abs(gestureState.dx) > 35 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 2.5
        );
      },
      onPanResponderRelease: (_, gestureState) => {
        const current = getCurrentTab();
        const currentIndex = TAB_ORDER.indexOf(current);

        if (gestureState.dx < -50 && currentIndex < TAB_ORDER.length - 1) {
          // Swiped left -> Go to next tab
          handleTabChange(TAB_ORDER[currentIndex + 1]);
        } else if (gestureState.dx > 50 && currentIndex > 0) {
          // Swiped right -> Go to previous tab
          handleTabChange(TAB_ORDER[currentIndex - 1]);
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} {...panResponder.panHandlers}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' }, // We use our floating PillNav instead of default tab bar
          animation: 'shift',
          // Silky smooth horizontal slide animation between tab screens
          sceneStyleInterpolator: ({ current }) => ({
            sceneStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [-SCREEN_WIDTH * 0.45, 0, SCREEN_WIDTH * 0.45],
                  }),
                },
              ],
              opacity: current.progress.interpolate({
                inputRange: [-1, -0.6, 0, 0.6, 1],
                outputRange: [0, 0.35, 1, 0.35, 0],
              }),
            },
          }),
          transitionSpec: {
            animation: 'spring',
            config: {
              stiffness: 900,
              damping: 400,
              mass: 2.5,
              overshootClamping: true,
              restDisplacementThreshold: 0.01,
              restSpeedThreshold: 0.01,
            },
          },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="analytics" options={{ title: 'Analytics' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>

      {/* Floating Black Pill Bottom Navigation with smoothly animated sliding highlighter */}
      <PillNav
        currentTab={getCurrentTab()}
        onTabChange={handleTabChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

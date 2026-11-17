import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { theme, useAppTheme } from '../src/theme';
import { useAuthStore } from '../src/features/auth/authStore';

export default function RootLayout() {
  const { colors } = useAppTheme();
  const [fontsLoaded] = useFonts({
    'Delight-Regular': require('../src/fonts/delight-regular.otf'),
    'Delight-Medium': require('../src/fonts/delight-medium.otf'),
    'Delight-SemiBold': require('../src/fonts/delight-semibold.otf'),
    'Delight-Bold': require('../src/fonts/delight-bold.otf'),
    'Delight-Black': require('../src/fonts/delight-black.otf'),
  });

  useEffect(() => {
    useAuthStore.getState().initialize();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBar} />
        <ActivityIndicator size="small" color={colors.text} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={colors.statusBar} />
        <Slot />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

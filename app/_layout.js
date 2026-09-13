import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { StoreProvider, useStore } from '../src/store';
import { Splash } from '../src/components/Splash';
import { colors } from '../src/theme';

// Hold the native launch screen until the app is genuinely ready to draw, so
// there is no white flash between it and the first screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Long enough to read "Welcome to nimoh" without it turning into a wait.
const WELCOME_MS = 1600;

/**
 * Routes are declared inside guards rather than redirected from an effect.
 *
 * The effect version mounted the tab group first and only pushed the sign-in
 * screen on the next tick, which is why Today flashed up between the splash and
 * the login page. A guarded screen does not exist while its condition is false,
 * so there is nothing to render and nothing to flash.
 */
function Gate() {
  const { ready, account } = useStore();

  if (!ready) return <Splash />;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.white },
          animation: 'fade',
        }}
      >
        <Stack.Protected guard={!account}>
          <Stack.Screen name="sign-in" />
          <Stack.Screen name="sign-up" />
        </Stack.Protected>

        <Stack.Protected guard={!!account}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="log" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="personal" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Quicksand_400Regular: require('../assets/fonts/Quicksand_400Regular.ttf'),
    Quicksand_500Medium: require('../assets/fonts/Quicksand_500Medium.ttf'),
    Quicksand_600SemiBold: require('../assets/fonts/Quicksand_600SemiBold.ttf'),
    Quicksand_700Bold: require('../assets/fonts/Quicksand_700Bold.ttf'),
  });

  // Fonts usually resolve in a few frames, which would flash the welcome rather
  // than show it. Hold it for a beat regardless of how fast the load was.
  const [welcomeDone, setWelcomeDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setWelcomeDone(true), WELCOME_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded || !welcomeDone) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Gate />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React, { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
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

const AUTH_ROUTES = ['sign-in', 'sign-up'];

function Gate() {
  const { ready, account } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inAuth = AUTH_ROUTES.includes(segments[0]);
    if (!account && !inAuth) router.replace('/sign-in');
    else if (account && inAuth) router.replace('/');
  }, [ready, account, segments, router]);

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
      />
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

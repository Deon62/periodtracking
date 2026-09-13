import React, { useEffect } from 'react';
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

function Gate() {
  const { ready, onboarded } = useStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    const inOnboarding = segments[0] === 'onboarding';
    if (!onboarded && !inOnboarding) router.replace('/onboarding');
    else if (onboarded && inOnboarding) router.replace('/');
  }, [ready, onboarded, segments, router]);

  if (!ready) return <Splash />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.white },
        animation: 'fade',
      }}
    />
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    Quicksand_400Regular: require('../assets/fonts/Quicksand_400Regular.ttf'),
    Quicksand_500Medium: require('../assets/fonts/Quicksand_500Medium.ttf'),
    Quicksand_600SemiBold: require('../assets/fonts/Quicksand_600SemiBold.ttf'),
    Quicksand_700Bold: require('../assets/fonts/Quicksand_700Bold.ttf'),
  });

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
  }, [loaded]);

  if (!loaded) return <Splash />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <StatusBar style="dark" />
          <Gate />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

import React from 'react';
import { Tabs } from 'expo-router';
import { TabBar } from '../../src/components/TabBar';
import { Tour } from '../../src/components/Tour';
import { colors } from '../../src/theme';

export default function TabsLayout() {
  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.white },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Today' }} />
        <Tabs.Screen name="calendar" options={{ title: 'Calendar' }} />
        <Tabs.Screen name="insights" options={{ title: 'Insights' }} />
        <Tabs.Screen name="profile" options={{ title: 'You' }} />
      </Tabs>

      {/* Lives here rather than in the root layout so it can never appear over
          sign in, and renders itself as null once it has been seen. */}
      <Tour />
    </>
  );
}

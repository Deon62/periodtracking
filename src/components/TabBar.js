import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow, font } from '../theme';
import { Icon } from '../icons';
import { Text } from './ui';

const LABELS = {
  index: { label: 'Today', icon: 'home' },
  calendar: { label: 'Calendar', icon: 'calendar' },
  insights: { label: 'Insights', icon: 'insights' },
  profile: { label: 'You', icon: 'user' },
};

export const TAB_BAR_HEIGHT = 66;

export function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 10) }]}
      pointerEvents="box-none"
    >
      <View style={styles.bar}>
        {state.routes.map((route, i) => {
          const meta = LABELS[route.name];
          if (!meta) return null;
          const focused = state.index === i;

          const onPress = () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <Pressable key={route.key} onPress={onPress} style={styles.tab}>
              <Icon
                name={meta.icon}
                size={22}
                color={focused ? colors.brand : colors.faint}
                strokeWidth={focused ? 2 : 1.7}
              />
              <Text
                weight={focused ? 'semibold' : 'medium'}
                style={[styles.label, { color: focused ? colors.brand : colors.faint }]}
              >
                {meta.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 18,
    backgroundColor: 'transparent',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 6,
    ...shadow,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.2,
    fontFamily: font.medium,
  },
});

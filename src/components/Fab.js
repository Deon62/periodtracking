import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { Icon } from '../icons';
import { TAB_BAR_HEIGHT } from './TabBar';

/** Floating action button, parked just above the tab bar on the right. */
export function Fab({ onPress, icon = 'plus', label }) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(insets.bottom, 10) + TAB_BAR_HEIGHT + 16;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.fab,
        { bottom },
        pressed && { transform: [{ scale: 0.93 }], opacity: 0.92 },
      ]}
    >
      <Icon name={icon} size={25} color={colors.white} strokeWidth={2.2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});

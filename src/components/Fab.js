import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import { Icon } from '../icons';
import { TAB_BAR_HEIGHT } from './TabBar';

const SIZE = 58;
const GAP = 12;

/**
 * Floating action button, parked just above the tab bar on the right.
 *
 * `stack` lifts it clear of the buttons below it, so a column of them keeps
 * even spacing without any screen having to know the button's own height.
 */
export function Fab({ onPress, icon = 'plus', label, stack = 0, variant = 'primary' }) {
  const insets = useSafeAreaInsets();
  const bottom =
    Math.max(insets.bottom, 10) + TAB_BAR_HEIGHT + 6 + stack * (SIZE + GAP);

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
        variant === 'secondary' && styles.fabSecondary,
        { bottom },
        pressed && { transform: [{ scale: 0.93 }], opacity: 0.92 },
      ]}
    >
      <Icon
        name={icon}
        size={variant === 'secondary' ? 23 : 25}
        color={variant === 'secondary' ? colors.brand : colors.white}
        strokeWidth={variant === 'secondary' ? 1.9 : 2.2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 22,
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  // Lighter than the add button on purpose: one primary action per screen.
  fabSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.4,
    borderColor: colors.brandSoft,
  },
});

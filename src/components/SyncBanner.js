import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store';
import { colors, radius, shadow } from '../theme';
import { Icon } from '../icons';
import { Text } from './ui';

/**
 * Says so when a write did not reach the server.
 *
 * Without this the app is a convincing liar: the optimistic update paints the
 * change on screen, the request fails, and nothing anywhere admits it until she
 * signs out and finds the data gone. The detail goes to the Metro log; this is
 * just the part she needs.
 */
export function SyncBanner() {
  const { syncError, dismissSyncError } = useStore();
  const insets = useSafeAreaInsets();

  if (!syncError) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Pressable
        onPress={dismissSyncError}
        style={({ pressed }) => [styles.banner, pressed && { opacity: 0.9 }]}
      >
        <Icon name="close" size={15} color={colors.white} strokeWidth={2.2} />
        <Text weight="semibold" style={styles.text} numberOfLines={2}>
          {syncError}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16, zIndex: 50 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    ...shadow,
  },
  text: { flex: 1, fontSize: 13, color: colors.white, lineHeight: 18 },
});

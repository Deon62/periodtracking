import React from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius, shadow } from '../theme';
import { Icon } from '../icons';
import { Text } from './ui';

/**
 * The app's own confirmation dialog, in place of Alert.alert.
 *
 * The system alert is the one surface that ignores the typeface, the pink and
 * the rounded corners, so every destructive choice used to be made in a box
 * that looked like a different app. This one is quiet by default and only goes
 * pink on the action that cannot be undone.
 */
export function ConfirmDialog({
  visible,
  icon,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive,
  /** A notice rather than a choice: one button, which just closes it. */
  dismissOnly,
  onConfirm,
  onCancel,
}) {
  const press = (fn, style = Haptics.ImpactFeedbackStyle.Light) => () => {
    Haptics.impactAsync(style).catch(() => {});
    fn?.();
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel}>
        {/* Swallow taps on the card so the backdrop only closes from outside. */}
        <Pressable style={styles.card} onPress={() => {}}>
          {!!icon && (
            <View style={[styles.puck, destructive && { backgroundColor: colors.brandSoft }]}>
              <Icon
                name={icon}
                size={21}
                color={destructive ? colors.brand : colors.inkSoft}
                strokeWidth={1.9}
              />
            </View>
          )}

          <Text weight="bold" style={styles.title}>
            {title}
          </Text>
          {!!message && (
            <Text weight="medium" style={styles.message}>
              {message}
            </Text>
          )}

          <View style={styles.actions}>
            {!dismissOnly && (
              <Pressable
                onPress={press(onCancel)}
                style={({ pressed }) => [styles.button, styles.cancel, pressed && { opacity: 0.6 }]}
              >
                <Text weight="semibold" style={styles.cancelText}>
                  {cancelLabel}
                </Text>
              </Pressable>
            )}
            <Pressable
              onPress={press(onConfirm, Haptics.ImpactFeedbackStyle.Medium)}
              style={({ pressed }) => [
                styles.button,
                destructive ? styles.confirmDanger : styles.confirm,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text weight="semibold" style={styles.confirmText}>
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18,18,24,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 26,
    alignItems: 'center',
    ...shadow,
  },
  puck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.slateTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: { fontSize: 19, letterSpacing: -0.3, textAlign: 'center' },
  message: {
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 24, alignSelf: 'stretch' },
  button: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancel: { backgroundColor: colors.slateTint },
  cancelText: { fontSize: 15, color: colors.inkSoft },
  confirm: { backgroundColor: colors.ink },
  confirmDanger: { backgroundColor: colors.brand },
  confirmText: { fontSize: 15, color: colors.white },
});

import React from 'react';
import { View, StyleSheet, Pressable, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { Icon } from '../../src/icons';
import { Screen, Text, Row, Hairline } from '../../src/components/ui';

/**
 * A hub, not a form. Everything editable lives on its own page so this screen
 * stays short enough to never scroll.
 */
export default function Profile() {
  const router = useRouter();
  const { settings, model, logout } = useStore();

  const confirmLogout = () =>
    Alert.alert('Log out', 'Your logged data stays on this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);

  return (
    <Screen scroll={false}>
      <Row style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text weight="medium" style={styles.eyebrow}>
            PROFILE
          </Text>
          <Text weight="bold" style={styles.title}>
            You
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/settings')}
          hitSlop={12}
          style={({ pressed }) => [styles.gear, pressed && { opacity: 0.6 }]}
        >
          <Icon name="settings" size={20} color={colors.ink} strokeWidth={1.8} />
        </Pressable>
      </Row>

      <View style={styles.identity}>
        <Pressable onPress={() => router.push('/personal')} style={styles.avatarWrap}>
          {settings.avatarUri ? (
            <Image source={{ uri: settings.avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarEmpty}>
              <Text weight="bold" style={styles.avatarText}>
                {(settings.name || 'A').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            <Icon name="camera" size={14} color={colors.white} strokeWidth={1.9} />
          </View>
        </Pressable>

        <Text weight="bold" style={styles.name}>
          {settings.name || 'Add your name'}
        </Text>
        <Text weight="medium" style={styles.sub}>
          {model.regularity === 'unknown'
            ? 'Getting to know your cycle'
            : `${model.avgCycle}-day cycle · ${model.regularity}`}
        </Text>
      </View>

      <View style={styles.links}>
        <Link
          icon="user"
          label="Personal details"
          sub="Photo, name, birth year, goal"
          onPress={() => router.push('/personal')}
        />
        <Hairline inset={32} />
        <Link
          icon="settings"
          label="Settings"
          sub="Cycle, reminders, privacy"
          onPress={() => router.push('/settings')}
        />
      </View>

      <View style={{ flex: 1 }} />

      <Pressable
        onPress={confirmLogout}
        style={({ pressed }) => [styles.logout, pressed && { opacity: 0.6 }]}
      >
        <Icon name="logout" size={17} color={colors.inkSoft} strokeWidth={1.8} />
        <Text weight="semibold" style={styles.logoutText}>
          Log out
        </Text>
      </Pressable>
    </Screen>
  );
}

function Link({ icon, label, sub, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.link, pressed && { opacity: 0.55 }]}
    >
      <View style={styles.linkIcon}>
        <Icon name={icon} size={18} color={colors.inkSoft} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1 }}>
        <Text weight="semibold" style={styles.linkLabel}>
          {label}
        </Text>
        <Text weight="medium" style={styles.linkSub}>
          {sub}
        </Text>
      </View>
      <Icon name="chevronRight" size={17} color={colors.faint} strokeWidth={2} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  top: { alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 4,
  },
  title: { fontSize: 28, letterSpacing: -0.5 },
  gear: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slateTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { alignItems: 'center', marginTop: 30 },
  avatarWrap: { width: 92, height: 92, borderRadius: 46, marginBottom: 14 },
  avatarImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.slateSoft,
  },
  avatarEmpty: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: colors.slateTint,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 31, color: colors.inkSoft },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.white,
  },
  name: { fontSize: 21, letterSpacing: -0.3, textAlign: 'center' },
  sub: { fontSize: 13, color: colors.muted, marginTop: 4, textAlign: 'center' },
  links: { marginTop: 34 },
  link: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  linkIcon: { width: 32, alignItems: 'flex-start' },
  linkLabel: { fontSize: 15.5 },
  linkSub: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  logoutText: { fontSize: 14.5, color: colors.inkSoft },
});

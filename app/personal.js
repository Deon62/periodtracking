import React, { useState } from 'react';
import { View, StyleSheet, Pressable, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useStore } from '../src/store';
import { colors, radius, font } from '../src/theme';
import { Icon } from '../src/icons';
import { Screen, Text, Row, PageHeader, Section, Hairline } from '../src/components/ui';
import { ConfirmDialog } from '../src/components/ConfirmDialog';

const GOALS = [
  { id: 'track', label: 'Track my cycle', hint: 'Know what is coming' },
  { id: 'conceive', label: 'Trying to conceive', hint: 'Focus on fertile days' },
  { id: 'avoid', label: 'Avoiding pregnancy', hint: 'Awareness, not contraception' },
];

const THIS_YEAR = new Date().getFullYear();

export default function PersonalDetails() {
  const router = useRouter();
  const { settings, setSettings, setAvatar, removeAvatar } = useStore();
  const [editingName, setEditingName] = useState(false);
  const [needsPhotoAccess, setNeedsPhotoAccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const year = settings.birthYear;
  const age = year ? THIS_YEAR - year : null;

  const pickPhoto = async () => {
    if (uploading) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      setNeedsPhotoAccess(true);
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      // 0.5 on an already-cropped square keeps the upload small; an avatar is
      // never shown above 100pt. `base64` is what the upload actually reads.
      quality: 0.5,
      base64: true,
    });
    if (res.canceled || !res.assets?.length) return;

    setUploadError('');
    setUploading(true);
    const { error } = await setAvatar(res.assets[0]);
    setUploading(false);
    if (error) setUploadError('That photo did not upload. Try again.');
  };

  const removePhoto = () => {
    if (uploading) return;
    setUploadError('');
    removeAvatar();
  };

  const setYear = (v) => setSettings({ birthYear: Math.min(THIS_YEAR - 8, Math.max(1940, v)) });

  return (
    <Screen contentStyle={{ paddingBottom: 56 }}>
      <PageHeader
        title="Personal details"
        subtitle="Profile"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      />

      <View style={styles.photoBlock}>
        <Pressable onPress={pickPhoto} style={styles.avatarWrap}>
          {settings.avatarUri ? (
            <Image source={{ uri: settings.avatarUri }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarEmpty}>
              <Text weight="bold" style={styles.avatarText}>
                {(settings.name || 'A').trim().charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          {uploading && (
            <View style={styles.avatarBusy}>
              <ActivityIndicator color={colors.white} />
            </View>
          )}

          <View style={styles.avatarBadge}>
            <Icon name="camera" size={14} color={colors.white} strokeWidth={1.9} />
          </View>
        </Pressable>

        <Pressable
          onPress={settings.avatarUri ? removePhoto : pickPhoto}
          disabled={uploading}
        >
          <Text weight="semibold" style={styles.photoAction}>
            {uploading
              ? 'Uploading…'
              : settings.avatarUri
              ? 'Remove photo'
              : 'Add a photo'}
          </Text>
        </Pressable>

        {!!uploadError && (
          <Text weight="medium" style={styles.photoError}>
            {uploadError}
          </Text>
        )}
      </View>

      <Section title="Name" first>
        <Pressable onPress={() => setEditingName(true)} style={styles.field}>
          {editingName ? (
            <TextInput
              value={settings.name}
              onChangeText={(v) => setSettings({ name: v })}
              onBlur={() => setEditingName(false)}
              placeholder="Your name"
              placeholderTextColor={colors.faint}
              autoFocus
              returnKeyType="done"
              style={styles.fieldInput}
            />
          ) : (
            <Text
              weight="medium"
              style={[styles.fieldValue, !settings.name && { color: colors.faint }]}
            >
              {settings.name || 'Your name'}
            </Text>
          )}
          <Icon name="note" size={16} color={colors.faint} strokeWidth={1.8} />
        </Pressable>
      </Section>

      <Section title="Birth year">
        <Row style={styles.yearRow}>
          <Pressable
            onPress={() => setYear((year || 1998) - 1)}
            style={styles.yearButton}
            hitSlop={6}
          >
            <Icon name="minus" size={17} color={colors.inkSoft} strokeWidth={2.2} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text weight="bold" style={styles.yearValue}>
              {year || '—'}
            </Text>
            <Text weight="medium" style={styles.yearHint}>
              {age ? `${age} years old` : 'Tap + to set'}
            </Text>
          </View>
          <Pressable
            onPress={() => setYear((year || 1997) + 1)}
            style={styles.yearButton}
            hitSlop={6}
          >
            <Icon name="plus" size={17} color={colors.inkSoft} strokeWidth={2.2} />
          </Pressable>
        </Row>
      </Section>

      <Section title="What you are using this for">
        {GOALS.map((g, i) => {
          const active = settings.goal === g.id;
          return (
            <View key={g.id}>
              <Pressable
                onPress={() => setSettings({ goal: g.id })}
                style={({ pressed }) => [styles.goal, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.radio, active && styles.radioOn]}>
                  {active && <View style={styles.radioDot} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text weight={active ? 'semibold' : 'medium'} style={styles.goalLabel}>
                    {g.label}
                  </Text>
                  <Text weight="medium" style={styles.goalHint}>
                    {g.hint}
                  </Text>
                </View>
              </Pressable>
              {i < GOALS.length - 1 && <Hairline inset={34} />}
            </View>
          );
        })}
      </Section>

      <Text weight="medium" style={styles.note}>
        Only ever visible to you, and only used inside the app.
      </Text>

      <ConfirmDialog
        visible={needsPhotoAccess}
        icon="camera"
        title="Photo access needed"
        message="Allow photo access in your settings to choose a picture."
        confirmLabel="Got it"
        dismissOnly
        onCancel={() => setNeedsPhotoAccess(false)}
        onConfirm={() => setNeedsPhotoAccess(false)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photoBlock: { alignItems: 'center', marginTop: 20 },
  avatarBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(18,18,24,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoError: { fontSize: 12.5, color: colors.brand, marginTop: 8 },
  avatarWrap: { width: 100, height: 100, borderRadius: 50, marginBottom: 14 },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.slateSoft,
  },
  avatarEmpty: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.slateTint,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 33, color: colors.inkSoft },
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
  photoAction: { fontSize: 13.5, color: colors.inkSoft },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 15,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  fieldValue: { flex: 1, fontSize: 15.5 },
  fieldInput: {
    flex: 1,
    fontSize: 15.5,
    fontFamily: font.medium,
    color: colors.ink,
    padding: 0,
  },
  yearRow: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  yearButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.slateTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  yearValue: { fontSize: 22, letterSpacing: -0.4 },
  yearHint: { fontSize: 11.5, color: colors.muted, marginTop: 1 },
  goal: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioOn: { borderColor: colors.brand },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.brand,
  },
  goalLabel: { fontSize: 15 },
  goalHint: { fontSize: 12.5, color: colors.muted, marginTop: 2 },
  note: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 18,
    marginTop: 30,
    textAlign: 'center',
  },
});

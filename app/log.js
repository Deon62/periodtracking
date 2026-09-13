import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useStore, FLOWS, MOODS, SYMPTOMS } from '../src/store';
import { colors, radius, font } from '../src/theme';
import { Icon } from '../src/icons';
import { Screen, Text, Button, Row, SectionTitle } from '../src/components/ui';
import { Dropdown } from '../src/components/Dropdown';
import { today, longDate } from '../src/cycle';

const FLOW_OPTIONS = FLOWS.map((f) => ({
  id: f.id,
  label: f.label,
  hint: '•'.repeat(f.drops),
}));

export default function LogScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { logs, saveLog, model, togglePeriodDay } = useStore();

  const dayKey = typeof params.date === 'string' ? params.date : today();
  const existing = logs[dayKey];

  const [flow, setFlow] = useState(existing?.flow || null);
  const [moods, setMoods] = useState(existing?.moods || []);
  const [symptoms, setSymptoms] = useState(existing?.symptoms || []);
  const [water, setWater] = useState(existing?.water || 0);
  const [notes, setNotes] = useState(existing?.notes || '');

  // Re-seed when arriving from the calendar with a different day.
  useEffect(() => {
    setFlow(existing?.flow || null);
    setMoods(existing?.moods || []);
    setSymptoms(existing?.symptoms || []);
    setWater(existing?.water || 0);
    setNotes(existing?.notes || '');
  }, [dayKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const onSave = () => {
    saveLog(dayKey, { flow, moods, symptoms, notes, water });
    // Choosing a real flow is a strong signal that this is a period day.
    if (flow && flow !== 'spotting') {
      const isTracked = model.periods?.some((p) => {
        const end = p.end || p.start;
        return dayKey >= p.start && dayKey <= end;
      });
      if (!isTracked) togglePeriodDay(dayKey);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    close();
  };

  return (
    <Screen contentStyle={{ paddingBottom: 48 }}>
      <Row style={styles.top}>
        <View style={{ flex: 1 }}>
          <Text weight="medium" style={styles.eyebrow}>
            {dayKey === today() ? 'NEW ENTRY' : 'EDITING'}
          </Text>
          <Text weight="bold" style={styles.title}>
            {dayKey === today() ? 'Today' : longDate(dayKey)}
          </Text>
        </View>
        <Pressable onPress={close} hitSlop={12} style={styles.close}>
          <Icon name="close" size={19} color={colors.inkSoft} />
        </Pressable>
      </Row>

      <SectionTitle first>How it is going</SectionTitle>

      <Dropdown
        icon="droplet"
        label="Flow"
        placeholder="Not set"
        options={FLOW_OPTIONS}
        value={flow}
        onChange={setFlow}
      />
      <Dropdown
        icon="heart"
        label="Mood"
        placeholder="Not set"
        options={MOODS}
        value={moods}
        onChange={setMoods}
        multi
      />
      <Dropdown
        icon="sparkle"
        label="Symptoms"
        placeholder="None"
        options={SYMPTOMS}
        value={symptoms}
        onChange={setSymptoms}
        multi
      />

      <SectionTitle>Water</SectionTitle>
      <Row style={styles.waterRow}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Pressable
            key={i}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setWater(water === i + 1 ? i : i + 1);
            }}
            style={[styles.glass, i < water && styles.glassFull]}
          >
            <Icon
              name="droplet"
              size={16}
              color={i < water ? colors.white : colors.faint}
              strokeWidth={1.8}
              fill={i < water ? colors.white : 'none'}
            />
          </Pressable>
        ))}
      </Row>
      <Text weight="medium" style={styles.waterLabel}>
        {water} of 8 glasses
      </Text>

      <SectionTitle>Notes</SectionTitle>
      <TextInput
        value={notes}
        onChangeText={setNotes}
        placeholder="Anything worth remembering"
        placeholderTextColor={colors.faint}
        multiline
        style={styles.notes}
      />

      <Button label="Save entry" style={{ marginTop: 26 }} onPress={onSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { marginBottom: 4, alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 4,
  },
  title: { fontSize: 28, letterSpacing: -0.5 },
  close: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterRow: { gap: 7, flexWrap: 'wrap' },
  glass: {
    width: 36,
    height: 36,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassFull: { backgroundColor: colors.slate, borderColor: colors.slate },
  waterLabel: { fontSize: 12.5, color: colors.muted, marginTop: 10 },
  notes: {
    minHeight: 100,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: 15,
    fontSize: 14.5,
    fontFamily: font.medium,
    color: colors.ink,
    textAlignVertical: 'top',
  },
});

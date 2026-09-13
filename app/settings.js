import React from 'react';
import { View, StyleSheet, Pressable, Switch, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { colors, radius } from '../src/theme';
import { Icon } from '../src/icons';
import { Screen, Text, Row, PageHeader, Section, Hairline, ListRow } from '../src/components/ui';

export default function Settings() {
  const router = useRouter();
  const { settings, setSettings, clearAll, replayTour } = useStore();

  const confirmClear = () =>
    Alert.alert(
      'Delete all data',
      'Every period, log and setting on this device will be erased. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: clearAll },
      ]
    );

  return (
    <Screen contentStyle={{ paddingBottom: 56 }}>
      <PageHeader
        title="Settings"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      />

      <Section title="Cycle" first>
        <Stepper
          icon="clock"
          label="Cycle length"
          value={settings.cycleLength}
          min={18}
          max={45}
          onChange={(v) => setSettings({ cycleLength: v })}
        />
        <Hairline inset={42} />
        <Stepper
          icon="droplet"
          label="Period length"
          value={settings.periodLength}
          min={1}
          max={12}
          onChange={(v) => setSettings({ periodLength: v })}
        />
      </Section>

      <Section title="Reminders">
        <ListRow
          icon="bell"
          label="Period reminder"
          right={
            <Switch
              value={settings.reminders}
              onValueChange={(v) => setSettings({ reminders: v })}
              trackColor={{ true: colors.brand, false: colors.borderStrong }}
              thumbColor={colors.white}
            />
          }
        />
        {settings.reminders && (
          <>
            <Hairline inset={42} />
            <Stepper
              icon="calendar"
              label="Remind me"
              value={settings.remindDaysBefore}
              min={0}
              max={7}
              unit={settings.remindDaysBefore === 1 ? 'day before' : 'days before'}
              onChange={(v) => setSettings({ remindDaysBefore: v })}
            />
          </>
        )}
      </Section>

      <Section title="Help">
        <ListRow
          icon="sparkle"
          label="Show the walkthrough again"
          onPress={() => {
            replayTour();
            router.replace('/');
          }}
        />
      </Section>

      <Section title="Data">
        <ListRow icon="shield" label="Stays on this device" value="Private" />
        <Hairline inset={42} />
        <ListRow icon="trash" label="Delete all data" danger onPress={confirmClear} />
      </Section>

      <View style={styles.about}>
        <Image
          source={require('../assets/logo-mark.png')}
          style={styles.mark}
          resizeMode="contain"
        />
        <Text weight="medium" style={styles.version}>
          Version 1.0.0
        </Text>
      </View>
    </Screen>
  );
}

function Stepper({ icon, label, value, min, max, unit = 'days', onChange }) {
  return (
    <Row style={styles.stepper}>
      <View style={styles.puck}>
        <Icon name={icon} size={17} color={colors.inkSoft} />
      </View>
      <Text weight="medium" style={{ flex: 1, fontSize: 15.5 }}>
        {label}
      </Text>
      <Row style={styles.stepControls}>
        <Pressable
          onPress={() => onChange(Math.max(min, value - 1))}
          style={styles.stepButton}
          hitSlop={6}
        >
          <Icon name="minus" size={16} color={colors.inkSoft} strokeWidth={2.2} />
        </Pressable>
        <View style={styles.stepValue}>
          <Text weight="semibold" style={{ fontSize: 14.5 }}>
            {value}
          </Text>
          <Text weight="medium" style={styles.stepUnit}>
            {unit}
          </Text>
        </View>
        <Pressable
          onPress={() => onChange(Math.min(max, value + 1))}
          style={styles.stepButton}
          hitSlop={6}
        >
          <Icon name="plus" size={16} color={colors.inkSoft} strokeWidth={2.2} />
        </Pressable>
      </Row>
    </Row>
  );
}

const styles = StyleSheet.create({
  stepper: { paddingVertical: 13 },
  puck: {
    width: 30,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 12,
  },
  stepControls: {
    backgroundColor: colors.slateTint,
    borderRadius: radius.pill,
    padding: 3,
  },
  stepButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepValue: { alignItems: 'center', minWidth: 62 },
  stepUnit: { fontSize: 9.5, color: colors.muted, marginTop: -1 },
  about: { alignItems: 'center', marginTop: 44 },
  mark: { width: 46, height: 40, opacity: 0.3, marginBottom: 10 },
  version: { fontSize: 11.5, color: colors.faint, marginTop: 8 },
});

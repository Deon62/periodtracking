import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../src/store';
import { colors, radius, font } from '../src/theme';
import { Icon } from '../src/icons';
import { Text, Button, Row } from '../src/components/ui';
import { today, addDays, prettyDate, longDate } from '../src/cycle';

const STEPS = 4;

export default function Onboarding() {
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [lastStart, setLastStart] = useState(today());

  const next = () => {
    if (step < STEPS - 1) setStep(step + 1);
    else completeOnboarding({ name: name.trim(), cycleLength, periodLength, lastPeriodStart: lastStart });
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <Row style={styles.progress}>
        {Array.from({ length: STEPS }).map((_, i) => (
          <View key={i} style={[styles.pip, i <= step && styles.pipActive]} />
        ))}
      </Row>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <>
            <Image
              source={require('../assets/logo-mark.png')}
              style={styles.mark}
              resizeMode="contain"
            />
            <Text weight="bold" style={styles.title}>
              Welcome
            </Text>
            <Text weight="medium" style={styles.blurb}>
              A quiet period tracker. Log your cycle, see what is coming, and keep
              every bit of it on your own phone.
            </Text>
          </>
        )}

        {step === 1 && (
          <>
            <Text weight="bold" style={styles.title}>
              What should we call you?
            </Text>
            <Text weight="medium" style={styles.blurb}>
              Only used to say hello. You can skip this.
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.faint}
              style={styles.input}
              returnKeyType="done"
            />
          </>
        )}

        {step === 2 && (
          <>
            <Text weight="bold" style={styles.title}>
              Your usual cycle
            </Text>
            <Text weight="medium" style={styles.blurb}>
              A rough answer is fine. This is refined as you log.
            </Text>
            <Picker
              label="Cycle length"
              unit="days"
              value={cycleLength}
              min={18}
              max={45}
              onChange={setCycleLength}
            />
            <Picker
              label="Period length"
              unit="days"
              value={periodLength}
              min={1}
              max={12}
              onChange={setPeriodLength}
            />
          </>
        )}

        {step === 3 && (
          <>
            <Text weight="bold" style={styles.title}>
              When did your last period start?
            </Text>
            <Text weight="medium" style={styles.blurb}>
              Pick the closest day. You can correct it later on the calendar.
            </Text>
            <View style={styles.dateBox}>
              <Text weight="semibold" style={styles.dateValue}>
                {longDate(lastStart)}
              </Text>
              <Text weight="medium" style={styles.dateHint}>
                {lastStart === today() ? 'Today' : `${prettyDate(lastStart)}`}
              </Text>
            </View>
            <Row style={styles.dateControls}>
              <Pressable style={styles.dateBtn} onPress={() => setLastStart(addDays(lastStart, -1))}>
                <Icon name="chevronLeft" size={18} color={colors.inkSoft} />
                <Text weight="semibold" style={styles.dateBtnText}>
                  Earlier
                </Text>
              </Pressable>
              <Pressable
                style={styles.dateBtn}
                onPress={() => {
                  const nextDay = addDays(lastStart, 1);
                  if (nextDay <= today()) setLastStart(nextDay);
                }}
              >
                <Text weight="semibold" style={styles.dateBtnText}>
                  Later
                </Text>
                <Icon name="chevronRight" size={18} color={colors.inkSoft} />
              </Pressable>
            </Row>
          </>
        )}
      </ScrollView>

      <Button label={step === STEPS - 1 ? 'Start tracking' : 'Continue'} onPress={next} />
      {step > 0 && (
        <Pressable onPress={() => setStep(step - 1)} style={styles.back}>
          <Text weight="medium" style={styles.backText}>
            Back
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function Picker({ label, value, min, max, unit, onChange }) {
  return (
    <View style={styles.picker}>
      <Text weight="medium" style={styles.pickerLabel}>
        {label}
      </Text>
      <Row style={styles.pickerRow}>
        <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={styles.pickerBtn}>
          <Icon name="minus" size={19} color={colors.inkSoft} strokeWidth={2.2} />
        </Pressable>
        <Row style={{ flex: 1, justifyContent: 'center', alignItems: 'baseline' }}>
          <Text weight="bold" style={styles.pickerValue}>
            {value}
          </Text>
          <Text weight="medium" style={styles.pickerUnit}>
            {unit}
          </Text>
        </Row>
        <Pressable onPress={() => onChange(Math.min(max, value + 1))} style={styles.pickerBtn}>
          <Icon name="plus" size={19} color={colors.inkSoft} strokeWidth={2.2} />
        </Pressable>
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white, paddingHorizontal: 24 },
  progress: { gap: 6, marginBottom: 34 },
  pip: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  pipActive: { backgroundColor: colors.brand },
  body: { paddingBottom: 30 },
  mark: {
    width: 84,
    height: 74,
    marginBottom: 26,
  },
  title: { fontSize: 30, letterSpacing: -0.8, lineHeight: 38 },
  blurb: {
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 23,
    marginTop: 12,
  },
  input: {
    marginTop: 28,
    height: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 17,
    fontSize: 16,
    fontFamily: font.medium,
    color: colors.ink,
  },
  picker: { marginTop: 26 },
  pickerLabel: { fontSize: 13, color: colors.muted, marginBottom: 9 },
  pickerRow: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
  },
  pickerBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerValue: { fontSize: 24, letterSpacing: -0.5 },
  pickerUnit: { fontSize: 13, color: colors.muted, marginLeft: 6 },
  dateBox: {
    marginTop: 30,
    paddingVertical: 26,
    borderRadius: radius.lg,
    backgroundColor: colors.slateTint,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  dateValue: { fontSize: 19 },
  dateHint: { fontSize: 13, color: colors.muted, marginTop: 5 },
  dateControls: { gap: 12, marginTop: 14 },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.slateTint,
  },
  dateBtnText: { fontSize: 14, color: colors.ink },
  back: { alignSelf: 'center', paddingVertical: 14 },
  backText: { fontSize: 14, color: colors.muted },
});

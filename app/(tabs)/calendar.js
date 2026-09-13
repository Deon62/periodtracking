import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore, MOODS, SYMPTOMS } from '../../src/store';
import { colors, radius, absoluteFill } from '../../src/theme';
import { Icon } from '../../src/icons';
import { Screen, Text, Row, Button, Header } from '../../src/components/ui';
import { Fab } from '../../src/components/Fab';
import {
  today,
  startOfMonth,
  addMonths,
  addDays,
  daysInMonth,
  monthLabel,
  weekday,
  longDate,
  dayStatus,
  fromKey,
  periodEndingAt,
} from '../../src/cycle';

const WEEK = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function CalendarScreen() {
  const router = useRouter();
  const { model, logs, togglePeriodDay, setPeriodEnd } = useStore();
  const [month, setMonth] = useState(startOfMonth(today()));
  const [selected, setSelected] = useState(null);

  const cells = useMemo(() => {
    const total = daysInMonth(month);
    // Monday-first grid.
    const lead = (weekday(month) + 6) % 7;
    const out = new Array(lead).fill(null);
    for (let i = 0; i < total; i += 1) out.push(addDays(month, i));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [month]);

  const now = today();

  return (
    // The button and the sheet sit outside the Screen on purpose: Screen is a
    // ScrollView, and an absolutely positioned child of one anchors to the
    // scroll content, not the viewport — which parked the button under the
    // calendar instead of above the tab bar.
    <View style={styles.root}>
      <Screen>
        <Header title="Calendar" subtitle="Your cycle" />

        <View style={styles.card}>
          <Row style={styles.monthBar}>
            <Pressable onPress={() => setMonth(addMonths(month, -1))} style={styles.arrow}>
              <Icon name="chevronLeft" size={18} color={colors.inkSoft} />
            </Pressable>
            <Text weight="semibold" style={styles.monthLabel}>
              {monthLabel(month)}
            </Text>
            <Pressable onPress={() => setMonth(addMonths(month, 1))} style={styles.arrow}>
              <Icon name="chevronRight" size={18} color={colors.inkSoft} />
            </Pressable>
          </Row>

          <Row style={styles.weekRow}>
            {WEEK.map((d, i) => (
              <Text key={i} weight="semibold" style={styles.weekLabel}>
                {d}
              </Text>
            ))}
          </Row>

          <View style={styles.grid}>
            {cells.map((key, i) => {
              if (!key) return <View key={`e${i}`} style={styles.cell} />;
              const day = dayStatus(key, model);
              const status = day.type;
              // The first day is the one she actually reported, so it carries
              // the solid fill. The rest are softer, and days we are only
              // assuming (no end recorded yet) are dotted to say so.
              const periodStyle =
                status !== 'period'
                  ? null
                  : day.edge === 'start' || day.edge === 'only'
                  ? styles.dayPeriod
                  : day.recorded
                  ? styles.dayPeriodOn
                  : styles.dayPeriodAssumed;
              const isToday = key === now;
              const hasLog = !!logs[key];
              return (
                <Pressable key={key} style={styles.cell} onPress={() => setSelected(key)}>
                  <View style={styles.day}>
                    {/* The coloured shape is its own childless layer rather
                        than the background of the box holding the number.
                        Android was painting that background as a square and
                        dropping the radius; the legend swatches, which are
                        childless views with the very same styles, were round
                        throughout. Same fill, same styles, nothing on top. */}
                    <View
                      style={[
                        styles.dayFill,
                        periodStyle,
                        status === 'predicted' && styles.dayPredicted,
                        status === 'fertile' && styles.dayFertile,
                        status === 'ovulation' && styles.dayOvulation,
                        isToday && styles.dayToday,
                      ]}
                    />
                    <Text
                      weight={isToday || status === 'period' ? 'bold' : 'medium'}
                      style={[
                        styles.dayText,
                        status === 'period' && { color: colors.brandDeep },
                        status === 'period' &&
                          (day.edge === 'start' || day.edge === 'only') && {
                            color: colors.white,
                          },
                        status === 'ovulation' && { color: colors.teal },
                        status === 'predicted' && { color: colors.brandDeep },
                      ]}
                    >
                      {fromKey(key).getDate()}
                    </Text>
                  </View>
                  <View style={[styles.logDot, hasLog && { backgroundColor: colors.faint }]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.legend}>
          <Legend swatch={styles.dayPeriod} label="Period starts" />
          <Legend swatch={styles.dayPeriodOn} label="Period days" />
          <Legend swatch={styles.dayPeriodAssumed} label="Assumed" />
          <Legend swatch={styles.dayPredicted} label="Predicted" />
          <Legend swatch={styles.dayFertile} label="Fertile window" />
          <Legend swatch={styles.dayOvulation} label="Ovulation" />
        </View>
      </Screen>

      {/* Adding an entry sits with the calendar rather than Today: a day is
          what an entry belongs to. Tap a day for that day; the button is the
          shortcut to right now. */}
      <Fab label="Add an entry for today" onPress={() => router.push('/log')} />

      <DaySheet
        dayKey={selected}
        onClose={() => setSelected(null)}
        model={model}
        log={selected ? logs[selected] : null}
        periods={model.periods}
        onToggle={() => togglePeriodDay(selected)}
        onSetEnd={() => setPeriodEnd(selected)}
        onEdit={() => {
          const k = selected;
          setSelected(null);
          router.push({ pathname: '/log', params: { date: k } });
        }}
      />
    </View>
  );
}

function Legend({ swatch, label }) {
  return (
    <Row style={styles.legendItem}>
      <View style={[styles.legendSwatch, swatch]} />
      <Text weight="medium" style={styles.legendText}>
        {label}
      </Text>
    </Row>
  );
}

function DaySheet({ dayKey, onClose, model, log, periods, onToggle, onSetEnd, onEdit }) {
  if (!dayKey) return null;
  const day = dayStatus(dayKey, model);
  const status = day.type;

  const statusText =
    status === 'period'
      ? `Period · day ${day.dayOfPeriod}${
          day.recorded ? ` of ${day.length}` : ', end not set'
        }`
      : {
          predicted: 'Predicted period',
          fertile: 'Fertile window',
          ovulation: 'Estimated ovulation',
          none: 'No cycle events',
        }[status];

  // Offering "ended here" only makes sense when there is a run for it to close:
  // either this day is inside one, or one started recently enough before it.
  const openRun =
    status === 'period' ? day.start : periodEndingAt(periods || [], dayKey)?.start || null;
  const canSetEnd = !!openRun && !(status === 'period' && day.recorded && day.edge === 'end');

  const entries = [
    log?.flow && `Flow: ${log.flow}`,
    log?.moods?.length && `Mood: ${log.moods.map((m) => label(MOODS, m)).join(', ')}`,
    log?.symptoms?.length &&
      `Symptoms: ${log.symptoms.map((s) => label(SYMPTOMS, s)).join(', ')}`,
    log?.notes?.trim() && log.notes.trim(),
  ].filter(Boolean);

  return (
    <Modal transparent visible animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
          <Text weight="bold" style={{ fontSize: 19 }}>
            {longDate(dayKey)}
          </Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Icon name="close" size={20} color={colors.muted} />
          </Pressable>
        </Row>
        <Text weight="medium" style={{ fontSize: 13.5, color: colors.muted }}>
          {statusText}
        </Text>

        {entries.length > 0 && (
          <View style={styles.sheetEntries}>
            {entries.map((e, i) => (
              <Text key={i} weight="medium" style={styles.sheetEntry}>
                {e}
              </Text>
            ))}
          </View>
        )}

        {canSetEnd && (
          <Button
            label="My period ended here"
            style={{ marginTop: 20 }}
            onPress={() => {
              onSetEnd();
              onClose();
            }}
          />
        )}
        <Button
          label={status === 'period' ? 'Remove period day' : 'Mark as period day'}
          variant={status === 'period' || canSetEnd ? 'outline' : 'primary'}
          style={{ marginTop: canSetEnd ? 10 : 20 }}
          onPress={() => {
            onToggle();
            onClose();
          }}
        />
        <Button label="Edit log for this day" variant="quiet" style={{ marginTop: 10 }} onPress={onEdit} />
      </View>
    </Modal>
  );
}

function label(list, id) {
  return list.find((x) => x.id === id)?.label || id;
}

const CELL = `${100 / 7}%`;
const DAY = 38;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  card: {
    marginTop: 18,
    padding: 14,
    paddingBottom: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthBar: {
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  monthLabel: { fontSize: 17 },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekRow: { marginBottom: 6 },
  weekLabel: {
    width: CELL,
    textAlign: 'center',
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 0.6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL,
    alignItems: 'center',
    paddingVertical: 4,
  },
  day: {
    width: DAY,
    height: DAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Half of DAY, so the two can never drift apart into a squircle.
  dayFill: {
    ...absoluteFill,
    borderRadius: DAY / 2,
  },
  dayText: { fontSize: 14, color: colors.ink },
  dayPeriod: { backgroundColor: colors.brand },
  dayPeriodOn: { backgroundColor: colors.brandSoft },
  dayPeriodAssumed: {
    backgroundColor: colors.brandTint,
    borderWidth: 1.4,
    borderColor: colors.brandLight,
    borderStyle: 'dotted',
  },
  dayPredicted: {
    borderWidth: 1.4,
    borderColor: colors.brand,
    borderStyle: 'dashed',
    backgroundColor: colors.brandTint,
  },
  dayFertile: { backgroundColor: colors.tealSoft },
  dayOvulation: {
    backgroundColor: colors.tealSoft,
    borderWidth: 1.6,
    borderColor: colors.teal,
  },
  dayToday: { borderWidth: 1.6, borderColor: colors.ink },
  logDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
    backgroundColor: 'transparent',
  },
  legend: {
    marginTop: 26,
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  legendItem: { width: '50%' },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  legendText: { fontSize: 13, color: colors.inkSoft },
  backdrop: {
    ...absoluteFill,
    backgroundColor: 'rgba(22,22,26,0.28)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.white,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 34,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetEntries: {
    marginTop: 16,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    gap: 6,
  },
  sheetEntry: { fontSize: 13.5, color: colors.inkSoft, lineHeight: 19 },
});

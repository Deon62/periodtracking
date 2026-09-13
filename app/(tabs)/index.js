import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '../../src/store';
import { colors } from '../../src/theme';
import { Icon } from '../../src/icons';
import { Text, Button, Row } from '../../src/components/ui';
import { CycleRing } from '../../src/components/CycleRing';
import { Fab } from '../../src/components/Fab';
import { today, longDate, prettyDate, daysBetween } from '../../src/cycle';

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Today() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { model, settings, logs, togglePeriodDay } = useStore();

  const key = today();
  const log = logs[key];

  // The screen must fit without scrolling, so the ring gets exactly the space
  // left after every fixed block is accounted for. Guessing a fraction of the
  // screen height is what let the ring collide with the button below it.
  const RESERVED =
    10 + // top padding
    58 + // date + greeting
    38 + // phase row under the ring
    48 + // stats row
    54 + // primary button
    36 + // logged-today line
    92; // tab bar clearance
  const available = height - insets.top - insets.bottom - RESERVED;
  const ringSize = Math.round(Math.max(150, Math.min(252, available)));

  const ring = useMemo(() => {
    if (!model.hasData) {
      return {
        caption: 'Getting started',
        headline: 'Log your\nperiod',
        footnote: 'Predictions start after your first entry',
      };
    }
    if (model.onPeriod) {
      return {
        caption: 'Period',
        headline: `Day ${daysBetween(model.cycleStart, key) + 1}`,
        footnote: 'Take it easy today',
      };
    }
    if (model.lateBy > 0) {
      return {
        caption: 'Period',
        headline: `${model.lateBy} ${model.lateBy === 1 ? 'day' : 'days'} late`,
        footnote: 'Cycles shift. Log it when it arrives.',
      };
    }
    const d = model.daysUntilNext;
    return {
      caption: 'Period in',
      headline: d === 0 ? 'Today' : `${d}`,
      footnote: d === 0 ? 'Expected to start' : d === 1 ? 'day away' : 'days away',
    };
  }, [model, key]);

  const loggedCount =
    (log?.symptoms?.length || 0) + (log?.moods?.length || 0) + (log?.flow ? 1 : 0);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 92 },
      ]}
    >
      <View>
        <Text weight="medium" style={styles.date}>
          {longDate(key).toUpperCase()}
        </Text>
        <Text weight="bold" style={styles.greeting}>
          {greeting()}
          {settings.name ? `, ${settings.name}` : ''}
        </Text>
      </View>

      <View style={styles.ringBlock}>
        <CycleRing
          size={ringSize}
          day={model.hasData ? model.dayOfCycle : 0}
          total={model.hasData ? model.avgCycle : settings.cycleLength}
          {...ring}
        />

        {model.hasData && (
          <Row style={styles.phase}>
            <Icon name={model.phase.icon} size={15} color={colors.inkSoft} strokeWidth={1.8} />
            <Text weight="semibold" style={styles.phaseText}>
              {model.phase.title} phase
            </Text>
            <View style={styles.phaseDot} />
            <Text weight="medium" style={styles.phaseDay}>
              Day {model.dayOfCycle}
            </Text>
          </Row>
        )}
      </View>

      <View>
        {model.hasData && (
          <Row style={styles.stats}>
            <Stat label="Next period" value={prettyDate(model.nextStart)} />
            <View style={styles.statDivider} />
            <Stat
              label="Fertile"
              value={prettyDate(model.fertileStart)}
              accent={colors.teal}
            />
            <View style={styles.statDivider} />
            <Stat label="Cycle" value={`${model.avgCycle} days`} />
          </Row>
        )}

        <Button
          label={model.onPeriod ? 'Period ended today' : 'Period started today'}
          variant={model.onPeriod ? 'outline' : 'primary'}
          onPress={() => togglePeriodDay(key)}
        />

        <Pressable onPress={() => router.push('/log')} style={styles.logLink}>
          <Text weight="medium" style={styles.logLinkText}>
            {loggedCount > 0
              ? `${loggedCount} logged today`
              : 'Nothing logged today'}
          </Text>
        </Pressable>
      </View>

      <Fab label="Add an entry" onPress={() => router.push('/log')} />
    </View>
  );
}

function Stat({ label, value, accent }) {
  return (
    <View style={styles.stat}>
      <Text weight="medium" style={styles.statLabel}>
        {label}
      </Text>
      <Text weight="semibold" style={[styles.statValue, accent && { color: accent }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 5,
  },
  greeting: {
    fontSize: 25,
    letterSpacing: -0.4,
  },
  ringBlock: {
    alignItems: 'center',
  },
  phase: {
    marginTop: 22,
    gap: 7,
  },
  phaseText: {
    fontSize: 14,
    color: colors.ink,
  },
  phaseDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.faint,
  },
  phaseDay: {
    fontSize: 14,
    color: colors.muted,
  },
  stats: {
    marginBottom: 22,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 26,
    backgroundColor: colors.borderStrong,
  },
  logLink: {
    alignItems: 'center',
    paddingTop: 15,
  },
  logLinkText: {
    fontSize: 12.5,
    color: colors.muted,
  },
});

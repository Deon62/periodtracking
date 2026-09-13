import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore, SYMPTOMS, MOODS } from '../../src/store';
import { colors, chart } from '../../src/theme';
import { Screen, Text, Row, Header, Section, Hairline, SeeMore } from '../../src/components/ui';
import {
  Donut,
  MiniBars,
  Sparkline,
  HeatGrid,
  SplitBar,
  ChipLegend,
  Bubbles,
  Gauge,
  LegendDot,
} from '../../src/components/Charts';
import { prettyDate, daysBetween, today, addDays, weekday } from '../../src/cycle';

// Heavier days are stronger pink. Anything logged without a flow stays grey so
// the period itself is the only thing that reads as colour.
const FLOW_TINT = {
  spotting: '#FFD9E8',
  light: '#FFB3D2',
  medium: colors.brandLight,
  heavy: colors.brand,
};

const WEEK_INITIALS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function Insights() {
  const { model, logs } = useStore();

  const history = useMemo(() => {
    const periods = model.periods || [];
    const out = [];
    for (let i = 1; i < periods.length; i += 1) {
      const len = daysBetween(periods[i - 1].start, periods[i].start);
      if (len >= 15 && len <= 90) out.push({ start: periods[i - 1].start, length: len });
    }
    return out.slice(-6);
  }, [model.periods]);

  // Four weeks of squares, ending on the Saturday of the current week so the
  // columns line up under the weekday initials.
  const heatDays = useMemo(() => {
    const now = today();
    const end = addDays(now, 6 - weekday(now));
    const start = addDays(end, -27);
    return Array.from({ length: 28 }, (_, i) => {
      const key = addDays(start, i);
      const log = logs[key];
      const future = key > now;
      const logged = !!log && (log.flow || log.moods?.length || log.symptoms?.length);
      return {
        today: key === now,
        color: future
          ? colors.slateTint
          : FLOW_TINT[log?.flow] || (logged ? colors.slateSoft : colors.slateTint),
      };
    });
  }, [logs]);

  const moodMix = useMemo(() => rank(logs, 'moods', MOODS, 4), [logs]);
  const topSymptoms = useMemo(() => rank(logs, 'symptoms', SYMPTOMS, 4), [logs]);

  // A steady cycle varies by a day or two; past a fortnight the needle is
  // pinned and the word under it is what matters.
  const steadiness =
    model.lengths?.length >= 2 ? 1 - Math.min(model.variation, 12) / 12 : null;

  // The average cycle split into its phases, for the donut.
  const period = model.avgPeriod;
  const fertile = 7;
  const rest = Math.max(1, model.avgCycle - period - fertile);

  return (
    <Screen>
      <Header title="Insights" subtitle="Your patterns" />

      <View style={styles.donutBlock}>
        <Donut
          size={122}
          thickness={13}
          centreValue={model.avgCycle}
          centreLabel="DAY CYCLE"
          segments={[
            { value: period, color: colors.brand },
            { value: fertile, color: colors.teal },
            { value: rest, color: colors.slateSoft },
          ]}
        />
        <View style={styles.donutLegend}>
          <LegendDot color={colors.brand} label="Period" value={`${period}d`} />
          <LegendDot color={colors.teal} label="Fertile" value={`${fertile}d`} />
          <LegendDot color={colors.slateSoft} label="Rest" value={`${rest}d`} />
        </View>
      </View>

      <Section title="Rhythm" first>
        <Gauge
          ratio={steadiness ?? 0}
          label={steadiness === null ? 'Learning' : capitalise(model.regularity)}
          caption={
            steadiness === null
              ? 'Two periods to go'
              : `±${model.variation} ${model.variation === 1 ? 'day' : 'days'}`
          }
        />
      </Section>

      <Section title="Cycle length">
        {history.length === 0 ? (
          <Empty>Log two periods.</Empty>
        ) : history.length < 3 ? (
          <MiniBars
            height={62}
            data={history.map((h) => ({ value: h.length, label: prettyDate(h.start) }))}
          />
        ) : (
          <Sparkline
            height={82}
            data={history.map((h) => ({ value: h.length, label: prettyDate(h.start) }))}
          />
        )}
      </Section>

      <Section title="Last 4 weeks">
        <Row style={styles.weekRow}>
          {WEEK_INITIALS.map((d, i) => (
            <Text key={i} weight="semibold" style={styles.weekLabel}>
              {d}
            </Text>
          ))}
        </Row>
        <HeatGrid days={heatDays} />
      </Section>

      <Section title="Mood mix">
        {moodMix.length === 0 ? (
          <Empty>Nothing logged yet.</Empty>
        ) : (
          <>
            <SplitBar
              segments={moodMix.map((m, i) => ({
                value: m.count,
                color: chart[i % chart.length].solid,
              }))}
            />
            <ChipLegend
              items={moodMix.map((m, i) => ({
                label: m.label,
                color: chart[i % chart.length].solid,
              }))}
            />
          </>
        )}
      </Section>

      <Section title="Most logged">
        {topSymptoms.length === 0 ? (
          <Empty>Nothing logged yet.</Empty>
        ) : (
          <Bubbles items={topSymptoms} />
        )}
      </Section>

      <View style={{ marginTop: 30 }}>
        <SeeMore label="More detail">
          <Section title="At a glance" first style={{ marginTop: 4 }}>
            <Row>
              <Stat value={model.avgPeriod} unit="days" label="Avg period" />
              <View style={styles.statDivider} />
              <Stat value={model.cycleCount || 0} unit="logged" label="Periods" />
              <View style={styles.statDivider} />
              <Stat
                value={model.lengths?.length >= 2 ? model.variation : '–'}
                unit={model.lengths?.length >= 2 ? 'days' : 'n/a'}
                label="Variation"
              />
            </Row>
          </Section>

          {model.hasData && (
            <Section title="Next four periods">
              {model.upcoming.map((p, i) => (
                <View key={p.start}>
                  <Row style={styles.upcoming}>
                    <View style={styles.dot} />
                    <Text weight="medium" style={{ flex: 1, fontSize: 14.5 }}>
                      {prettyDate(p.start, true)}
                    </Text>
                    <Text weight="medium" style={styles.until}>
                      to {prettyDate(p.end)}
                    </Text>
                  </Row>
                  {i < model.upcoming.length - 1 && <Hairline inset={19} />}
                </View>
              ))}
            </Section>
          )}

          <Text weight="medium" style={styles.disclaimer}>
            Estimates from what you have logged. Not a contraceptive or a
            medical device.
          </Text>
        </SeeMore>
      </View>
    </Screen>
  );
}

const capitalise = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/** Counts one multi-select field across every log and returns the top `n`. */
function rank(logs, field, catalogue, n) {
  const counts = {};
  Object.values(logs).forEach((l) =>
    (l[field] || []).forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    })
  );
  const max = Math.max(1, ...Object.values(counts));
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([id, count]) => ({
      label: catalogue.find((c) => c.id === id)?.label || id,
      count,
      ratio: count / max,
    }));
}

function Empty({ children }) {
  return (
    <Text weight="medium" style={styles.empty}>
      {children}
    </Text>
  );
}

function Stat({ label, value, unit }) {
  return (
    <View style={styles.stat}>
      <Row style={{ alignItems: 'baseline' }}>
        <Text weight="bold" style={styles.statValue}>
          {value}
        </Text>
        <Text weight="medium" style={styles.statUnit}>
          {unit}
        </Text>
      </Row>
      <Text weight="medium" style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  donutBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 24,
  },
  donutLegend: { flex: 1, paddingTop: 4 },
  weekRow: { marginBottom: 8, gap: 6 },
  weekLabel: {
    flex: 1,
    fontSize: 9.5,
    letterSpacing: 0.6,
    color: colors.faint,
    textAlign: 'center',
  },
  stat: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 23, letterSpacing: -0.5 },
  statUnit: { fontSize: 11, color: colors.muted, marginLeft: 4 },
  statLabel: { fontSize: 11.5, color: colors.muted, marginTop: 3 },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
    backgroundColor: colors.borderStrong,
  },
  upcoming: { paddingVertical: 13 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.faint,
    marginRight: 13,
  },
  until: { fontSize: 13, color: colors.muted },
  empty: { fontSize: 13.5, color: colors.muted },
  disclaimer: {
    fontSize: 11.5,
    color: colors.muted,
    lineHeight: 17,
    marginTop: 24,
    marginBottom: 6,
    textAlign: 'center',
  },
});

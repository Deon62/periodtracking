import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useStore, SYMPTOMS } from '../../src/store';
import { colors, radius } from '../../src/theme';
import { Screen, Text, Row, Header, Section, Hairline, SeeMore } from '../../src/components/ui';
import { Donut, MiniBars, LegendDot } from '../../src/components/Charts';
import { prettyDate, daysBetween } from '../../src/cycle';

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

  const topSymptoms = useMemo(() => {
    const counts = {};
    Object.values(logs).forEach((l) =>
      (l.symptoms || []).forEach((s) => {
        counts[s] = (counts[s] || 0) + 1;
      })
    );
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, n]) => ({
        label: SYMPTOMS.find((s) => s.id === id)?.label || id,
        count: n,
        ratio: n / max,
      }));
  }, [logs]);

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

      <Text weight="medium" style={styles.regText}>
        {model.regularity === 'unknown'
          ? 'Still learning your rhythm — log two periods to see patterns.'
          : model.regularity === 'regular'
          ? `Your cycle looks regular, within ${model.variation} ${
              model.variation === 1 ? 'day' : 'days'
            } across recent cycles.`
          : `Cycle length has moved by ${model.variation} days lately, so treat predictions as a guide.`}
      </Text>

      <Section title="Cycle history" first>
        {history.length === 0 ? (
          <Text weight="medium" style={styles.empty}>
            Two logged periods will draw your first chart.
          </Text>
        ) : (
          <View style={styles.chartCard}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
              <Text weight="medium" style={styles.chartCaption}>
                Days between periods
              </Text>
              <Text weight="semibold" style={styles.chartLatest}>
                {history[history.length - 1].length} latest
              </Text>
            </Row>
            <MiniBars
              height={68}
              data={history.map((h) => ({ value: h.length, label: prettyDate(h.start) }))}
            />
          </View>
        )}
      </Section>

      <View style={{ marginTop: 26 }}>
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

          <Section title="Most logged symptoms">
            {topSymptoms.length === 0 ? (
              <Text weight="medium" style={styles.empty}>
                Nothing logged yet.
              </Text>
            ) : (
              topSymptoms.map((s) => (
                <View key={s.label} style={styles.symptomRow}>
                  <Row>
                    <Text weight="medium" style={{ flex: 1, fontSize: 14.5 }}>
                      {s.label}
                    </Text>
                    <Text weight="semibold" style={styles.symptomCount}>
                      {s.count}
                    </Text>
                  </Row>
                  <View style={styles.symptomTrack}>
                    <View style={[styles.symptomFill, { width: `${s.ratio * 100}%` }]} />
                  </View>
                </View>
              ))
            )}
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
            Predictions are estimates based on what you have logged. This app is
            not a contraceptive or a medical device.
          </Text>
        </SeeMore>
      </View>
    </Screen>
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
  regText: {
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    marginTop: 24,
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
  chartCard: {
    padding: 16,
    paddingBottom: 14,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartCaption: { fontSize: 12.5, color: colors.muted },
  chartLatest: { fontSize: 12.5, color: colors.ink },
  symptomRow: { marginBottom: 15 },
  symptomCount: { fontSize: 13, color: colors.muted },
  symptomTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.slateSoft,
    marginTop: 7,
    overflow: 'hidden',
  },
  symptomFill: { height: '100%', borderRadius: 2, backgroundColor: colors.slate },
  upcoming: { paddingVertical: 13 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.faint,
    marginRight: 13,
  },
  until: { fontSize: 13, color: colors.muted },
  empty: { fontSize: 14, color: colors.muted, lineHeight: 20 },
  disclaimer: {
    fontSize: 11.5,
    color: colors.muted,
    lineHeight: 17,
    marginTop: 24,
    marginBottom: 6,
    textAlign: 'center',
  },
});

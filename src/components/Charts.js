import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { colors, absoluteFill } from '../theme';
import { Text } from './ui';

/**
 * A small segmented donut. `segments` is [{ value, color }] — each arc is drawn
 * as a dashed circle offset by everything before it, which keeps the whole chart
 * to one SVG element per segment.
 */
export function Donut({
  size = 116,
  thickness = 13,
  segments,
  centreValue,
  centreLabel,
  gap = 2,
}) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let offset = 0;
  const arcs = segments.map((s, i) => {
    const len = (s.value / total) * c;
    const arc = {
      key: i,
      color: s.color,
      // Trim each arc slightly so neighbours read as separate bands.
      dash: [Math.max(0, len - gap), c - Math.max(0, len - gap)],
      rotate: (offset / c) * 360,
    };
    offset += len;
    return arc;
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.surface}
          strokeWidth={thickness}
          fill="none"
        />
        {arcs.map((a) => (
          <G key={a.key} rotation={a.rotate - 90} origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={a.color}
              strokeWidth={thickness}
              strokeDasharray={a.dash}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        ))}
      </Svg>

      <View style={styles.centre} pointerEvents="none">
        <Text weight="bold" style={styles.centreValue}>
          {centreValue}
        </Text>
        {!!centreLabel && (
          <Text weight="medium" style={styles.centreLabel}>
            {centreLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

/** A tight run of rounded bars — a sparkline with a bit more presence. */
export function MiniBars({ data, height = 54, highlightLast = true }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const min = Math.min(...data.map((d) => d.value), max);
  const span = Math.max(1, max - min);

  // Bars and labels are two separate rows. Nesting the label inside a
  // fixed-height column made it overflow the chart and slide under whatever
  // came next on the page.
  return (
    <View>
      <View style={[styles.bars, { height }]}>
        {data.map((d, i) => {
          const last = highlightLast && i === data.length - 1;
          // Scale within the observed range so small differences stay visible.
          const ratio = 0.32 + ((d.value - min) / span) * 0.68;
          return (
            <View key={i} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${ratio * 100}%`,
                    backgroundColor: last ? colors.brand : colors.slateSoft,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text
            key={i}
            numberOfLines={1}
            weight={highlightLast && i === data.length - 1 ? 'semibold' : 'medium'}
            style={[
              styles.barLabel,
              highlightLast && i === data.length - 1 && { color: colors.ink },
            ]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function LegendDot({ color, label, value }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text weight="medium" style={styles.legendLabel}>
        {label}
      </Text>
      <Text weight="semibold" style={styles.legendValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    ...absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centreValue: { fontSize: 25, letterSpacing: -0.7 },
  centreLabel: { fontSize: 10, color: colors.muted, marginTop: 1 },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  barCol: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { width: '100%', borderRadius: 5, minHeight: 6 },
  labels: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 9,
  },
  barLabel: {
    flex: 1,
    fontSize: 9.5,
    color: colors.muted,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 9 },
  legendLabel: { flex: 1, fontSize: 13, color: colors.inkSoft },
  legendValue: { fontSize: 13, color: colors.ink },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { colors, absoluteFill, chart } from '../theme';
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

      <View
        pointerEvents="none"
        style={[absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}
      >
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

// ---------------------------------------------------------------------------
// The small, wordless charts the Insights page is built from. Each one is
// self-contained, sized by its props, and says what it means without a caption.
// ---------------------------------------------------------------------------

/** Catmull-Rom through the points, converted to cubic beziers. */
function smoothPath(points) {
  if (points.length < 2) return '';
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    d +=
      ` C${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}` +
      ` ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}` +
      ` ${p2.x} ${p2.y}`;
  }
  return d;
}

/**
 * A soft filled line with a dot on the latest point. Used for cycle length,
 * where the shape of the trend matters far more than any single number.
 */
export function Sparkline({
  data,
  height = 76,
  color = colors.brand,
  fill = colors.brandTint,
}) {
  const [width, setWidth] = React.useState(0);
  const values = data.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  // Pad the range so a flat run sits mid-height instead of pinned to an edge.
  const pad = Math.max(1, (max - min) * 0.35);
  const hi = max + pad;
  const lo = min - pad;

  const inset = 8; // room for the end dot
  const points = data.map((d, i) => ({
    x: inset + (i / Math.max(1, data.length - 1)) * (width - inset * 2),
    y: inset + (1 - (d.value - lo) / (hi - lo)) * (height - inset * 2),
  }));

  const line = smoothPath(points);
  const end = points[points.length - 1];
  const area = line
    ? `${line} L${end.x} ${height} L${points[0].x} ${height} Z`
    : '';

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={{ height }}>
        {width > 0 && points.length > 1 && (
          <Svg width={width} height={height}>
            <Path d={area} fill={fill} />
            <Path
              d={line}
              stroke={color}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            <Circle cx={end.x} cy={end.y} r={6.5} fill={colors.white} />
            <Circle cx={end.x} cy={end.y} r={4.2} fill={color} />
          </Svg>
        )}
      </View>
      <View style={styles.labels}>
        {data.map((d, i) => (
          <Text
            key={i}
            numberOfLines={1}
            weight={i === data.length - 1 ? 'semibold' : 'medium'}
            style={[styles.barLabel, i === data.length - 1 && { color: colors.ink }]}
          >
            {d.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Recent days as a calendar-shaped grid of rounded squares, tinted by how
 * heavy each day was. A month of logging at a glance, with no numbers.
 */
export function HeatGrid({ days, columns = 7 }) {
  const rows = [];
  for (let i = 0; i < days.length; i += columns) rows.push(days.slice(i, i + columns));

  return (
    <View style={extra.heat}>
      {rows.map((row, r) => (
        <View key={r} style={extra.heatRow}>
          {row.map((d, i) => (
            <View
              key={i}
              style={[
                extra.heatCell,
                { backgroundColor: d.color },
                d.today && extra.heatToday,
              ]}
            />
          ))}
          {/* Keep the last row aligned with the ones above it. */}
          {row.length < columns &&
            Array.from({ length: columns - row.length }).map((_, i) => (
              <View key={`pad${i}`} style={extra.heatSpacer} />
            ))}
        </View>
      ))}
    </View>
  );
}

/**
 * One rounded bar split into shares. Reads as a single object rather than a
 * chart, which is right for something as soft as a mood mix.
 */
export function SplitBar({ segments, height = 14 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  return (
    <View style={[extra.splitTrack, { height, borderRadius: height / 2 }]}>
      {segments.map((s, i) => (
        <View
          key={i}
          style={{
            flex: s.value / total,
            backgroundColor: s.color,
            marginRight: i < segments.length - 1 ? 2 : 0,
            borderRadius: height / 2,
          }}
        />
      ))}
    </View>
  );
}

/** Compact inline legend — dots on one wrapping row, no values. */
export function ChipLegend({ items }) {
  return (
    <View style={extra.chips}>
      {items.map((it) => (
        <View key={it.label} style={extra.chip}>
          <View style={[extra.chipDot, { backgroundColor: it.color }]} />
          <Text weight="medium" style={extra.chipLabel}>
            {it.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Symptoms as circles sized by how often they turn up. Frequency is the whole
 * message, so the circle carries it and the label just names the thing.
 */
export function Bubbles({ items, min = 40, max = 70 }) {
  return (
    <View style={extra.bubbles}>
      {items.map((it, i) => {
        const size = Math.round(min + (max - min) * it.ratio);
        const tone = chart[i % chart.length];
        return (
          <View key={it.label} style={extra.bubbleCol}>
            <View style={extra.bubbleSlot}>
              <View
                style={[
                  extra.bubble,
                  {
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: tone.soft,
                  },
                ]}
              >
                <Text weight="bold" style={{ fontSize: 15, color: tone.solid }}>
                  {it.count}
                </Text>
              </View>
            </View>
            <Text numberOfLines={1} weight="medium" style={extra.bubbleLabel}>
              {it.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

/**
 * A half-circle gauge. One needle position says more about regularity in a
 * glance than the sentence it replaces.
 */
export function Gauge({ ratio, size = 140, label, caption }) {
  const t = Math.max(0, Math.min(1, ratio));
  const stroke = 11;
  const r = (size - stroke) / 2;
  const c = size / 2;

  // Sweep the top half only: pi to 2pi.
  const point = (f) => {
    const a = Math.PI + Math.PI * f;
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };
  const arc = (from, to) => {
    const a = point(from);
    const b = point(to);
    return `M${a.x} ${a.y} A${r} ${r} 0 ${to - from > 0.5 ? 1 : 0} 1 ${b.x} ${b.y}`;
  };
  const knob = point(t);

  return (
    <View style={{ alignItems: 'center' }}>
      {/* The SVG is square; clipping to half plus the knob keeps the dead space
          out without shaving the needle at either end of the sweep. */}
      <View style={{ height: Math.round(size / 2 + 9), overflow: 'hidden' }}>
        <Svg width={size} height={size}>
          <Path
            d={arc(0, 1)}
            stroke={colors.slateSoft}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d={arc(0, Math.max(0.015, t))}
            stroke={colors.brand}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
          />
          <Circle cx={knob.x} cy={knob.y} r={8} fill={colors.white} />
          <Circle cx={knob.x} cy={knob.y} r={5} fill={colors.brand} />
        </Svg>
      </View>
      <Text weight="bold" style={extra.gaugeLabel}>
        {label}
      </Text>
      {!!caption && (
        <Text weight="medium" style={extra.gaugeCaption}>
          {caption}
        </Text>
      )}
    </View>
  );
}

const extra = StyleSheet.create({
  heat: { gap: 6 },
  heatRow: { flexDirection: 'row', gap: 6 },
  heatCell: { flex: 1, aspectRatio: 1, borderRadius: 7 },
  heatSpacer: { flex: 1, aspectRatio: 1 },
  heatToday: { borderWidth: 1.8, borderColor: colors.ink },
  splitTrack: { flexDirection: 'row', overflow: 'hidden', width: '100%' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipDot: { width: 7, height: 7, borderRadius: 4 },
  chipLabel: { fontSize: 12.5, color: colors.inkSoft },
  bubbles: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  bubbleCol: { flex: 1, alignItems: 'center' },
  bubbleSlot: { height: 72, justifyContent: 'flex-end', alignItems: 'center' },
  bubble: { alignItems: 'center', justifyContent: 'center' },
  bubbleLabel: { fontSize: 10.5, color: colors.muted, marginTop: 7, textAlign: 'center' },
  gaugeLabel: { fontSize: 17, letterSpacing: -0.3, marginTop: 12 },
  gaugeCaption: { fontSize: 12, color: colors.muted, marginTop: 3 },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { colors, absoluteFill } from '../theme';
import { Text } from './ui';

/**
 * The progress ring on the Today screen: a full track, the elapsed portion of
 * the cycle drawn in brand pink, and a small marker where ovulation is expected.
 */
export function CycleRing({ size = 244, day, total, headline, caption, footnote }) {
  const stroke = Math.max(10, Math.round(size * 0.053));

  // Type is sized from the longest line so the block never runs under the ring
  // stroke — "12" can be huge, "3 days late" cannot.
  const lines = String(headline).split('\n');
  const longest = Math.max(...lines.map((l) => l.length));
  const scale = longest <= 3 ? 0.26 : longest <= 6 ? 0.185 : longest <= 9 ? 0.135 : 0.105;
  const headlineSize = Math.round(size * scale);
  const inset = stroke + Math.round(size * 0.06);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  // Day 1 is 0% elapsed, which would leave the ring looking empty, so keep a
  // small cap visible whenever a cycle is actually being tracked.
  const elapsed = total ? (day - 1) / total : 0;
  const progress = day > 0 ? Math.max(0.014, Math.min(1, elapsed)) : 0;

  const ovulationAt = total ? (total - 14) / total : 0;
  const ovAngle = ovulationAt * 360 - 90;
  const ovRad = (ovAngle * Math.PI) / 180;
  const ovX = size / 2 + r * Math.cos(ovRad);
  const ovY = size / 2 + r * Math.sin(ovRad);

  return (
    <View style={{ width: size, height: size, alignSelf: 'center' }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.brand} />
            <Stop offset="1" stopColor={colors.brandLight} />
          </LinearGradient>
        </Defs>

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.slateSoft}
          strokeWidth={stroke}
          fill="none"
        />

        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="url(#ring)"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - progress)}
            fill="none"
          />
        </G>

        {ovulationAt > 0 && ovulationAt < 1 && (
          <Circle cx={ovX} cy={ovY} r={4} fill={colors.teal} />
        )}
      </Svg>

      <View style={[styles.center, { paddingHorizontal: inset }]} pointerEvents="none">
        {!!caption && (
          <Text weight="medium" style={styles.caption}>
            {caption.toUpperCase()}
          </Text>
        )}
        <Text
          weight="bold"
          numberOfLines={2}
          style={[
            styles.headline,
            { fontSize: headlineSize, lineHeight: Math.round(headlineSize * 1.14) },
          ]}
        >
          {headline}
        </Text>
        {!!footnote && (
          <Text weight="medium" numberOfLines={2} style={styles.footnote}>
            {footnote}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: 10.5,
    letterSpacing: 1.6,
    color: colors.muted,
    marginBottom: 6,
  },
  headline: {
    letterSpacing: -1,
    textAlign: 'center',
  },
  footnote: {
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
    marginTop: 8,
    textAlign: 'center',
  },
});

import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { colors } from './theme';

// Hand-drawn stroke icons on a 24x24 grid. Rounded caps and joins throughout so
// they sit comfortably next to the rounded typeface.

const paths = {
  home: (p) => (
    <>
      <Path d="M3.6 10.1 12 3.4l8.4 6.7v9.1a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8z" {...p} />
      <Path d="M9.4 21v-6.4h5.2V21" {...p} />
    </>
  ),
  calendar: (p) => (
    <>
      <Rect x="3.2" y="5.2" width="17.6" height="15.6" rx="3.4" {...p} />
      <Line x1="8.2" y1="2.8" x2="8.2" y2="7.2" {...p} />
      <Line x1="15.8" y1="2.8" x2="15.8" y2="7.2" {...p} />
      <Line x1="3.2" y1="10.2" x2="20.8" y2="10.2" {...p} />
    </>
  ),
  plus: (p) => (
    <>
      <Line x1="12" y1="5.6" x2="12" y2="18.4" {...p} />
      <Line x1="5.6" y1="12" x2="18.4" y2="12" {...p} />
    </>
  ),
  minus: (p) => <Line x1="5.6" y1="12" x2="18.4" y2="12" {...p} />,
  settings: (p) => (
    <>
      <Line x1="3.4" y1="7.4" x2="20.6" y2="7.4" {...p} />
      <Line x1="3.4" y1="16.6" x2="20.6" y2="16.6" {...p} />
      <Circle cx="9" cy="7.4" r="2.5" {...p} fill={colors.white} />
      <Circle cx="15.4" cy="16.6" r="2.5" {...p} fill={colors.white} />
    </>
  ),
  target: (p) => (
    <>
      <Circle cx="12" cy="12" r="8.6" {...p} />
      <Circle cx="12" cy="12" r="4.2" {...p} />
      <Circle cx="12" cy="12" r="1.1" {...p} />
    </>
  ),
  camera: (p) => (
    <>
      <Path d="M4.4 8.4h3.1l1.4-2.2h6.2l1.4 2.2h3.1a1.6 1.6 0 0 1 1.6 1.6v7.4a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6V10a1.6 1.6 0 0 1 1.6-1.6z" {...p} />
      <Circle cx="12" cy="13.4" r="3.2" {...p} />
    </>
  ),
  logout: (p) => (
    <>
      <Path d="M14.4 4.6H6.8a1.8 1.8 0 0 0-1.8 1.8v11.2a1.8 1.8 0 0 0 1.8 1.8h7.6" {...p} />
      <Path d="M15.6 8.4 19.2 12l-3.6 3.6" {...p} />
      <Line x1="19.2" y1="12" x2="10.2" y2="12" {...p} />
    </>
  ),
  insights: (p) => (
    <>
      <Line x1="6.2" y1="20" x2="6.2" y2="13.4" {...p} />
      <Line x1="12" y1="20" x2="12" y2="4.6" {...p} />
      <Line x1="17.8" y1="20" x2="17.8" y2="9.8" {...p} />
    </>
  ),
  user: (p) => (
    <>
      <Circle cx="12" cy="8.2" r="3.9" {...p} />
      <Path d="M4.6 20.4a7.6 7.6 0 0 1 14.8 0" {...p} />
    </>
  ),
  droplet: (p) => (
    <Path d="M12 3.2c3.4 4 6.1 6.9 6.1 10.2A6.1 6.1 0 0 1 12 19.5a6.1 6.1 0 0 1-6.1-6.1c0-3.3 2.7-6.2 6.1-10.2z" {...p} />
  ),
  moon: (p) => (
    <Path d="M20 14.4A8.4 8.4 0 0 1 9.6 4 8.6 8.6 0 1 0 20 14.4z" {...p} />
  ),
  sparkle: (p) => (
    <Path d="M12 3.4l2.1 5.6a1 1 0 0 0 .6.6l5.6 2.1a.4.4 0 0 1 0 .6l-5.6 2.1a1 1 0 0 0-.6.6L12 20.6a.4.4 0 0 1-.6 0l-2.1-5.6a1 1 0 0 0-.6-.6L3.1 12.3a.4.4 0 0 1 0-.6l5.6-2.1a1 1 0 0 0 .6-.6z" {...p} />
  ),
  heart: (p) => (
    <Path d="M12 20.2s-7.8-4.6-7.8-9.7a4.3 4.3 0 0 1 7.8-2.5 4.3 4.3 0 0 1 7.8 2.5c0 5.1-7.8 9.7-7.8 9.7z" {...p} />
  ),
  leaf: (p) => (
    <>
      <Path d="M20.2 4.2c.9 8-3.6 13.2-9.6 13.2A5.2 5.2 0 0 1 5.4 12C5.4 6.6 12.4 3.4 20.2 4.2z" {...p} />
      <Path d="M4.2 20.4c1.6-3.9 4.4-7 8.2-9" {...p} />
    </>
  ),
  chevronLeft: (p) => <Path d="M14.6 5.4 8 12l6.6 6.6" {...p} />,
  chevronRight: (p) => <Path d="M9.4 5.4 16 12l-6.6 6.6" {...p} />,
  chevronDown: (p) => <Path d="M5.4 9.4 12 16l6.6-6.6" {...p} />,
  check: (p) => <Path d="M5 12.8 9.6 17.4 19 6.8" {...p} />,
  close: (p) => (
    <>
      <Line x1="6.4" y1="6.4" x2="17.6" y2="17.6" {...p} />
      <Line x1="17.6" y1="6.4" x2="6.4" y2="17.6" {...p} />
    </>
  ),
  bell: (p) => (
    <>
      <Path d="M18.2 16.6H5.8c1.1-1.2 1.7-2.3 1.7-3.6v-2.6a4.5 4.5 0 0 1 9 0V13c0 1.3.6 2.4 1.7 3.6z" {...p} />
      <Path d="M10.2 19.4a2 2 0 0 0 3.6 0" {...p} />
    </>
  ),
  shield: (p) => (
    <Path d="M12 3.2 19 6v5.7c0 4-2.9 7.4-7 8.9-4.1-1.5-7-4.9-7-8.9V6z" {...p} />
  ),
  clock: (p) => (
    <>
      <Circle cx="12" cy="12" r="8.6" {...p} />
      <Path d="M12 7.2V12l3.2 2" {...p} />
    </>
  ),
  note: (p) => (
    <>
      <Path d="M5.4 4.4h13.2v15.2H5.4z" {...p} />
      <Line x1="8.8" y1="9" x2="15.2" y2="9" {...p} />
      <Line x1="8.8" y1="12.6" x2="15.2" y2="12.6" {...p} />
      <Line x1="8.8" y1="16.2" x2="12.6" y2="16.2" {...p} />
    </>
  ),
  trash: (p) => (
    <>
      <Path d="M4.8 6.8h14.4" {...p} />
      <Path d="M9.4 6.8V4.6h5.2v2.2" {...p} />
      <Path d="M6.6 6.8 7.5 20h9l.9-13.2" {...p} />
    </>
  ),
  flame: (p) => (
    <Path d="M12 3.4c3.4 3.3 6 5.9 6 9.4a6 6 0 0 1-12 0c0-1.6.7-3 1.9-4.4.3 1.3 1 2.1 2 2.4.4-3 1-5.3 2.1-7.4z" {...p} />
  ),
  pill: (p) => (
    <>
      <Rect x="3.4" y="8.4" width="17.2" height="7.2" rx="3.6" {...p} />
      <Line x1="12" y1="8.4" x2="12" y2="15.6" {...p} />
    </>
  ),
  thermometer: (p) => (
    <Path d="M14 13.4V5.4a2 2 0 1 0-4 0v8a4 4 0 1 0 4 0z" {...p} />
  ),
};

export function Icon({
  name,
  size = 24,
  color = colors.ink,
  strokeWidth = 1.7,
  fill = 'none',
}) {
  const draw = paths[name];
  if (!draw) return null;
  const props = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    fill,
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {draw(props)}
    </Svg>
  );
}

export const iconNames = Object.keys(paths);

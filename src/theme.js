// Design tokens.
//
// The page is white and near-neutral. Pink is reserved for calls to action —
// buttons, the floating add button, and the one live figure the screen is about.
// Anything that is merely a state or a background uses the slate ramp below.

export const colors = {
  // Brand — CTAs and the single live accent per screen
  brand: '#FF2A85',
  brandLight: '#FF6FAE',
  brandDeep: '#D4136A',
  brandSoft: '#FFE8F2',
  brandTint: '#FFF5F9',

  // Secondary accent, used only for the fertile window
  teal: '#00A699',
  tealSoft: '#E9F6F5',

  // Neutral ramp — selected states, chart fills, quiet backgrounds
  slate: '#3A3A44',
  slateSoft: '#EDEDF1',
  slateTint: '#F6F6F8',

  // Canvas
  white: '#FFFFFF',
  surface: '#FBFBFC',
  border: '#EFEFF2',
  borderStrong: '#E2E2E8',

  // Type
  ink: '#16161A',
  inkSoft: '#5C5C66',
  muted: '#9A9AA5',
  faint: '#C6C6CF',
};

export const font = {
  regular: 'Quicksand_400Regular',
  medium: 'Quicksand_500Medium',
  semibold: 'Quicksand_600SemiBold',
  bold: 'Quicksand_700Bold',
};

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

export const spacing = (n) => n * 8;

// React Native 0.86 removed StyleSheet.absoluteFillObject (only absoluteFill
// survives), and spreading the missing name failed silently. Use this instead.
export const absoluteFill = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
};

// The only shadow in the app. Content sits flat on white; just the floating tab
// bar lifts off the page.
export const shadow = {
  shadowColor: '#3A1024',
  shadowOpacity: 0.08,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 8 },
  elevation: 4,
};

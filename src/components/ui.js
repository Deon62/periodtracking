import React from 'react';
import {
  Text as RNText,
  View,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { colors, font, radius } from '../theme';
import { Icon } from '../icons';

/** Every piece of text in the app goes through here so the typeface is never lost. */
export function Text({ style, weight = 'medium', children, ...rest }) {
  return (
    <RNText
      {...rest}
      style={[{ fontFamily: font[weight], color: colors.ink }, style]}
    >
      {children}
    </RNText>
  );
}

export function Screen({ children, scroll = true, style, contentStyle }) {
  const insets = useSafeAreaInsets();
  // Scrolling pages get extra slack so the last row clears the floating tab
  // bar; a fixed page only needs the bar's own height.
  const padding = {
    paddingTop: insets.top + 12,
    paddingBottom: insets.bottom + (scroll ? 104 : 88),
  };

  if (!scroll) {
    return <View style={[styles.screen, padding, style]}>{children}</View>;
  }
  return (
    <ScrollView
      style={[styles.screen, style]}
      contentContainerStyle={[padding, contentStyle]}
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

export function Header({ title, subtitle, right, style }) {
  return (
    <View style={[styles.header, style]}>
      <View style={{ flex: 1 }}>
        {!!subtitle && (
          <Text weight="medium" style={styles.headerSub}>
            {subtitle.toUpperCase()}
          </Text>
        )}
        <Text weight="bold" style={styles.headerTitle}>
          {title}
        </Text>
      </View>
      {right}
    </View>
  );
}

/**
 * A titled block of content sitting directly on the page. No border, no fill —
 * just a quiet label and a hairline where one is genuinely useful.
 */
export function Section({ title, children, style, first }) {
  return (
    <View style={[first ? styles.sectionFirst : styles.section, style]}>
      {!!title && (
        <Text weight="semibold" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </Text>
      )}
      {children}
    </View>
  );
}

/** The label half of a Section, for screens that lay out their own blocks. */
export function SectionTitle({ children, style, first }) {
  return (
    <Text
      weight="semibold"
      style={[styles.sectionTitle, first ? styles.titleFirst : styles.titleSpaced, style]}
    >
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}

/**
 * A quiet disclosure. Keeps a screen down to what matters and tucks the rest
 * behind one tap.
 */
export function SeeMore({ label = 'See more', lessLabel = 'Show less', children }) {
  const [open, setOpen] = React.useState(false);

  return (
    <View>
      {open && <View style={{ marginBottom: 4 }}>{children}</View>}
      <Pressable
        onPress={() => {
          Haptics.selectionAsync().catch(() => {});
          setOpen((o) => !o);
        }}
        style={({ pressed }) => [styles.seeMore, pressed && { opacity: 0.6 }]}
      >
        <Text weight="semibold" style={styles.seeMoreText}>
          {open ? lessLabel : label}
        </Text>
        <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
          <Icon name="chevronDown" size={15} color={colors.inkSoft} strokeWidth={2} />
        </View>
      </Pressable>
    </View>
  );
}

/** Header for a pushed sub-page: a back control above the title. */
export function PageHeader({ title, subtitle, onBack, right }) {
  return (
    <View style={styles.pageHeader}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <Pressable
          onPress={onBack}
          hitSlop={12}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.6 }]}
        >
          <Icon name="arrowLeft" size={19} color={colors.ink} strokeWidth={2} />
        </Pressable>
        {right}
      </Row>
      {!!subtitle && (
        <Text weight="medium" style={styles.headerSub}>
          {subtitle.toUpperCase()}
        </Text>
      )}
      <Text weight="bold" style={styles.headerTitle}>
        {title}
      </Text>
    </View>
  );
}

export function Hairline({ style, inset = 0 }) {
  return <View style={[styles.hairline, { marginLeft: inset }, style]} />;
}

export function Button({ label, onPress, variant = 'primary', style, disabled }) {
  const isPrimary = variant === 'primary';
  const isQuiet = variant === 'quiet';
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        isPrimary && styles.buttonPrimary,
        variant === 'outline' && styles.buttonOutline,
        isQuiet && styles.buttonQuiet,
        disabled && { opacity: 0.4 },
        pressed && { transform: [{ scale: 0.985 }], opacity: 0.9 },
        style,
      ]}
    >
      <Text
        weight="semibold"
        style={[
          styles.buttonText,
          isPrimary && { color: colors.white },
          isQuiet && { color: colors.brand },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Row({ children, style }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

/** A plain settings-style row: icon, label, value. Sits on the page background. */
export function ListRow({ icon, label, value, onPress, danger, right, sub }) {
  const body = (
    <>
      {!!icon && (
        <View style={styles.puck}>
          <Icon name={icon} size={17} color={danger ? colors.brand : colors.inkSoft} />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text weight="medium" style={[styles.listLabel, danger && { color: colors.brand }]}>
          {label}
        </Text>
        {!!sub && (
          <Text weight="medium" style={styles.listSub}>
            {sub}
          </Text>
        )}
      </View>
      {right ??
        (value ? (
          <Text weight="semibold" style={styles.listValue}>
            {value}
          </Text>
        ) : null)}
    </>
  );

  if (!onPress) return <View style={styles.listRow}>{body}</View>;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.listRow, pressed && { opacity: 0.55 }]}
    >
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 22,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 11,
    letterSpacing: 1.4,
    color: colors.muted,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    letterSpacing: -0.5,
  },
  section: { marginTop: 34 },
  sectionFirst: { marginTop: 18 },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 1.3,
    color: colors.muted,
    marginBottom: 14,
  },
  titleFirst: { marginTop: 20 },
  titleSpaced: { marginTop: 32 },
  seeMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: radius.md,
    backgroundColor: colors.slateTint,
  },
  seeMoreText: { fontSize: 13.5, color: colors.inkSoft },
  pageHeader: { marginBottom: 6 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.slateTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hairline: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
  },
  button: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.brand,
  },
  buttonOutline: {
    borderWidth: 1.4,
    borderColor: colors.borderStrong,
  },
  buttonQuiet: {
    backgroundColor: colors.brandSoft,
  },
  buttonText: {
    fontSize: 15.5,
    letterSpacing: 0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  puck: {
    width: 30,
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginRight: 12,
  },
  listLabel: {
    fontSize: 15.5,
  },
  listSub: {
    fontSize: 12.5,
    color: colors.muted,
    marginTop: 2,
  },
  listValue: {
    fontSize: 14.5,
    color: colors.muted,
  },
});

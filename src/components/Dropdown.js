import React, { useState, useRef, useEffect } from 'react';
import { View, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { colors, radius } from '../theme';
import { Icon } from '../icons';
import { Text } from './ui';

/**
 * A collapsed select that opens in place. Keeps the log screen to a short list
 * of rows instead of a wall of chips.
 *
 * `multi` turns it into a checklist that stays open while you pick.
 */
export function Dropdown({
  icon,
  label,
  placeholder = 'None',
  options,
  value,
  onChange,
  multi = false,
}) {
  const [open, setOpen] = useState(false);
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(spin, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [open, spin]);

  const selected = multi ? value || [] : value;
  const isChosen = (id) => (multi ? selected.includes(id) : selected === id);

  const summary = multi
    ? selected.length
      ? selected
          .map((id) => options.find((o) => o.id === id)?.label)
          .filter(Boolean)
          .join(', ')
      : placeholder
    : options.find((o) => o.id === selected)?.label || placeholder;

  const toggleOpen = () => setOpen((o) => !o);

  const pick = (id) => {
    Haptics.selectionAsync().catch(() => {});
    if (multi) {
      onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
    } else {
      onChange(selected === id ? null : id);
      setOpen(false);
    }
  };

  const empty = multi ? !selected.length : !selected;

  return (
    <View style={[styles.wrap, open && styles.wrapOpen]}>
      <Pressable onPress={toggleOpen} style={styles.head}>
        {!!icon && (
          <Icon name={icon} size={17} color={colors.inkSoft} strokeWidth={1.8} />
        )}
        <Text weight="medium" style={styles.label}>
          {label}
        </Text>
        <Text
          weight={empty ? 'medium' : 'semibold'}
          numberOfLines={1}
          style={[styles.summary, empty && { color: colors.faint }]}
        >
          {summary}
        </Text>
        <Animated.View
          style={{
            transform: [
              {
                rotate: spin.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
            ],
          }}
        >
          <Icon name="chevronDown" size={17} color={colors.muted} strokeWidth={2} />
        </Animated.View>
      </Pressable>

      {open && (
        <Animated.View style={[styles.list, { opacity: spin }]}>
          {options.map((o) => {
            const chosen = isChosen(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => pick(o.id)}
                style={({ pressed }) => [styles.option, pressed && { opacity: 0.6 }]}
              >
                <View style={[styles.box, chosen && styles.boxOn]}>
                  {chosen && <Icon name="check" size={12} color={colors.white} strokeWidth={3} />}
                </View>
                <Text
                  weight={chosen ? 'semibold' : 'medium'}
                  style={[styles.optionText, chosen && { color: colors.ink }]}
                >
                  {o.label}
                </Text>
                {!!o.hint && (
                  <Text weight="medium" style={styles.hint}>
                    {o.hint}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    marginBottom: 10,
    overflow: 'hidden',
  },
  wrapOpen: {
    borderColor: colors.borderStrong,
    backgroundColor: colors.slateTint,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 15,
    height: 54,
  },
  label: {
    fontSize: 15,
  },
  summary: {
    flex: 1,
    textAlign: 'right',
    fontSize: 13.5,
    color: colors.ink,
  },
  list: {
    paddingHorizontal: 15,
    paddingBottom: 12,
    paddingTop: 2,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  box: {
    width: 19,
    height: 19,
    borderRadius: 7,
    borderWidth: 1.4,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  boxOn: {
    backgroundColor: colors.slate,
    borderColor: colors.slate,
  },
  optionText: {
    flex: 1,
    fontSize: 14.5,
    color: colors.inkSoft,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
  },
});

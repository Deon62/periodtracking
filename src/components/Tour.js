import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useStore } from '../store';
import { colors, radius, shadow } from '../theme';
import { Icon } from '../icons';
import { Text, Button, Row } from './ui';

/**
 * A five-card walkthrough, shown once on the first run and never again.
 *
 * It deliberately does not try to spotlight real elements on the screen
 * underneath: coach marks have to know where things are, and this layout moves
 * with screen height. Cards say where to go instead, which survives any
 * reshuffle of the pages themselves.
 *
 * Two of the five exist purely because they are the questions a new user
 * actually asks — where do I mark the day my period started, and what if it
 * started before today.
 */
const STEPS = [
  {
    icon: 'home',
    title: 'Today',
    body: 'Where you are in your cycle, and what is coming next.',
  },
  {
    icon: 'droplet',
    title: 'Mark day one',
    body: 'The day it arrives, tap Period started today. Tap it again on the day it ends.',
  },
  {
    icon: 'calendar',
    title: 'Started before today?',
    body: 'Open Calendar and tap that day, then Mark as period day. Any day, past or future.',
  },
  {
    icon: 'plus',
    title: 'Log how you feel',
    body: 'The plus button on Calendar adds flow, mood, symptoms and a note.',
  },
  {
    icon: 'insights',
    title: 'Then the patterns',
    body: 'After two periods, Insights starts drawing your rhythm. Nothing leaves your phone.',
  },
];

export function Tour() {
  const { account, tourSeen, completeTour } = useStore();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);

  if (!account || tourSeen) return null;

  const last = step === STEPS.length - 1;
  const current = STEPS[step];

  const advance = () => {
    Haptics.selectionAsync().catch(() => {});
    if (last) completeTour();
    else setStep(step + 1);
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={completeTour}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { marginBottom: insets.bottom + 20 }]}>
          <View style={styles.puck}>
            <Icon name={current.icon} size={23} color={colors.brand} strokeWidth={1.9} />
          </View>

          <Text weight="bold" style={styles.title}>
            {current.title}
          </Text>
          <Text weight="medium" style={styles.body}>
            {current.body}
          </Text>

          <Row style={styles.pips}>
            {STEPS.map((_, i) => (
              <View key={i} style={[styles.pip, i === step && styles.pipActive]} />
            ))}
          </Row>

          <Button label={last ? 'Start tracking' : 'Next'} onPress={advance} />

          {!last && (
            <Pressable onPress={completeTour} style={styles.skip} hitSlop={8}>
              <Text weight="medium" style={styles.skipText}>
                Skip
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(18,18,24,0.55)',
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: 26,
    paddingTop: 28,
    ...shadow,
  },
  puck: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: { fontSize: 23, letterSpacing: -0.5 },
  body: {
    fontSize: 14.5,
    color: colors.inkSoft,
    lineHeight: 22,
    marginTop: 9,
  },
  pips: { gap: 6, marginTop: 24, marginBottom: 22 },
  pip: {
    width: 18,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  pipActive: { backgroundColor: colors.brand },
  skip: { alignSelf: 'center', paddingTop: 14 },
  skipText: { fontSize: 14, color: colors.muted },
});

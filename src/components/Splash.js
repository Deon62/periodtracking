import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

export const SPLASH_BACKGROUND = '#121218';

/**
 * The launch screen: the mark and the welcome, centred on near-black.
 *
 * It renders in place of the app while fonts and saved data load, then
 * unmounts — it is never drawn over a screen, so it cannot appear to pop in on
 * top of Today. The native splash uses the same background colour, so the
 * handover from one to the other is invisible.
 *
 * This is the one screen that does NOT use the shared Text: it can be on
 * screen before Quicksand has finished loading, so it stays on the system face.
 */
export function Splash() {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {/* One centred block, rather than a centred image with the words hung
          underneath it — that is what keeps the text centred on the screen. */}
      <View style={styles.block}>
        <Image
          source={require('../../assets/logo-mark.png')}
          style={styles.mark}
          resizeMode="contain"
        />
        <Text style={styles.welcome}>WELCOME TO</Text>
        <Text style={styles.wordmark}>nimoh</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { alignItems: 'center' },
  mark: {
    width: 96,
    height: 84,
    marginBottom: 30,
  },
  welcome: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 3.4,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  wordmark: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -0.8,
    color: colors.white,
    marginTop: 12,
    textAlign: 'center',
  },
});

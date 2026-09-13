import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { colors } from '../theme';

/**
 * The launch screen: the mark, centred, on white. Nothing else.
 *
 * It renders in place of the app while fonts and saved data load, then
 * unmounts — it is never drawn over a screen, so it cannot appear to pop in
 * on top of Today.
 */
export function Splash() {
  return (
    <View style={styles.root}>
      <Image
        source={require('../../assets/logo-mark.png')}
        style={styles.mark}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mark: {
    width: 150,
    height: 132,
  },
});

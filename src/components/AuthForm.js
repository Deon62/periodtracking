import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Google from '../../assets/google.svg';
import { useStore } from '../store';
import { friendlyAuthError } from '../supabase';
import { colors, radius, font } from '../theme';
import { Text, Button } from './ui';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Sign in and sign up are the same screen with one extra field, so they share
 * one component rather than drifting apart in two files.
 *
 * Nothing about her cycle is asked for here. She gets into the app on an email
 * and a password; cycle length and period length default and live in Settings,
 * her name and birth year in Personal details, and the first period start is a
 * single tap on Today or the calendar.
 */
export function AuthForm({ mode }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp, signIn, signInWithGoogle } = useStore();

  const isSignUp = mode === 'signUp';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(null); // 'form' | 'google'

  const submit = async () => {
    if (busy) return;
    if (isSignUp && !name.trim()) return setError('Tell us what to call you.');
    if (!EMAIL.test(email.trim())) return setError('That email does not look right.');
    if (password.length < 6) return setError('Use at least 6 characters.');

    setError('');
    setNotice('');
    setBusy('form');
    const { data, error: authError } = isSignUp
      ? await signUp({ name, email, password })
      : await signIn({ email, password });
    setBusy(null);

    if (authError) return setError(friendlyAuthError(authError));
    // With email confirmation switched on there is no session yet, and nothing
    // visible would happen otherwise.
    if (isSignUp && data?.user && !data.session) {
      setNotice('Almost there — check your inbox to confirm your email.');
    }
  };

  const google = async () => {
    if (busy) return;
    setError('');
    setNotice('');
    setBusy('google');
    const { error: authError, cancelled } = (await signInWithGoogle()) || {};
    setBusy(null);
    if (authError && !cancelled) setError(friendlyAuthError(authError));
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.body,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text weight="bold" style={styles.title}>
          {isSignUp ? 'Lovely to meet you' : 'Welcome back'}
        </Text>
        <Text weight="medium" style={styles.blurb}>
          {isSignUp
            ? 'A few little details and nimoh is yours.'
            : 'Pick up right where you left off.'}
        </Text>

        {isSignUp && (
          <Field
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            autoCapitalize="words"
            autoComplete="name"
          />
        )}
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
          secureTextEntry
          autoCapitalize="none"
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
          onSubmitEditing={submit}
          returnKeyType="go"
        />

        {/* The slot is always here so the form does not jump when it fills. */}
        <Text weight="medium" style={[styles.error, !!notice && styles.notice]}>
          {error || notice}
        </Text>

        <Button
          label={isSignUp ? 'Get started' : 'Sign in'}
          onPress={submit}
          disabled={!!busy}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text weight="medium" style={styles.dividerText}>
            or
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          onPress={google}
          disabled={!!busy}
          style={({ pressed }) => [
            styles.google,
            (pressed || !!busy) && { opacity: 0.7 },
          ]}
        >
          {busy === 'google' ? (
            <ActivityIndicator color={colors.inkSoft} />
          ) : (
            <>
              <Google width={20} height={20} />
              <Text weight="semibold" style={styles.googleText}>
                Continue with Google
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace(isSignUp ? '/sign-in' : '/sign-up')}
          style={styles.switch}
          hitSlop={8}
        >
          <Text weight="medium" style={styles.switchText}>
            {isSignUp ? 'Already with us? ' : 'New here? '}
            <Text weight="semibold" style={styles.switchLink}>
              {isSignUp ? 'Sign in' : 'Join us'}
            </Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, ...rest }) {
  return (
    <View style={styles.field}>
      <Text weight="medium" style={styles.fieldLabel}>
        {label}
      </Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.faint}
        style={styles.input}
        returnKeyType={rest.returnKeyType || 'next'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.white },
  body: { paddingHorizontal: 26, flexGrow: 1, justifyContent: 'center' },
  title: { fontSize: 28, letterSpacing: -0.7, textAlign: 'center' },
  blurb: {
    fontSize: 14.5,
    color: colors.inkSoft,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 30,
    textAlign: 'center',
  },
  google: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 11,
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1.4,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  googleText: { fontSize: 15.5, color: colors.ink },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 14, marginVertical: 24 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  dividerText: { fontSize: 12.5, color: colors.muted },
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 12, color: colors.muted, marginBottom: 7 },
  input: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 17,
    fontSize: 16,
    fontFamily: font.medium,
    color: colors.ink,
  },
  error: {
    fontSize: 12.5,
    color: colors.brand,
    minHeight: 18,
    marginBottom: 8,
    textAlign: 'center',
  },
  notice: { color: colors.teal },
  switch: { alignSelf: 'center', paddingVertical: 18 },
  switchText: { fontSize: 14, color: colors.muted },
  switchLink: { color: colors.brand },
});

// The session store has to be installed before the client is created, so this
// import stays at the very top.
import 'expo-sqlite/localStorage/install';
import { AppState } from 'react-native';
import { createClient } from '@supabase/supabase-js';

// Straight in the file rather than behind an .env, because there is nothing to
// hide: the publishable key is meant to ship inside the app, and anyone with a
// copy of the binary can read it either way. What actually protects the data is
// the row level security in supabase/schema.sql, where every row is fenced to
// its own auth.uid().
//
// The database password and the postgresql:// connection string are a different
// matter entirely — those are full access, and neither belongs anywhere near
// this app.
const SUPABASE_URL = 'https://bkcsjaideenhyxvifbyw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_XvcR4NFMLCcjBIJy3_q6gA_okhsujML';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    // There is no URL to read a session back from on a phone.
    detectSessionInUrl: false,
  },
});

// Refreshing tokens in the background drains the battery for no benefit, so the
// refresh loop follows the app in and out of the foreground.
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

/**
 * Supabase error messages are written for developers. These are the handful a
 * user can actually hit, in words that make sense on a phone.
 */
export function friendlyAuthError(error) {
  if (!error) return '';
  const message = (error.message || '').toLowerCase();
  if (message.includes('invalid login credentials')) return 'That email and password do not match.';
  if (message.includes('already registered')) return 'That email already has an account.';
  if (message.includes('email not confirmed')) return 'Check your inbox to confirm your email first.';
  if (message.includes('password')) return 'Passwords need at least 6 characters.';
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Too many tries. Give it a minute.';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'Cannot reach the server. Check your connection.';
  }
  return error.message || 'Something went wrong. Try again.';
}

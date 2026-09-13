import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from './supabase';

// Lets the OAuth tab hand control straight back to the app on Android.
WebBrowser.maybeCompleteAuthSession();

// ---------------------------------------------------------------------------
// Row <-> app shapes. The database speaks snake_case dates; the app speaks
// 'YYYY-MM-DD' keys. Everything crosses that line here and nowhere else.
// ---------------------------------------------------------------------------

const periodFromRow = (r) => ({ id: r.id, start: r.start_date, end: r.end_date });
const logFromRow = (r) => ({
  flow: r.flow || null,
  moods: r.moods || [],
  symptoms: r.symptoms || [],
  notes: r.notes || '',
  water: r.water || 0,
});

export const settingsFromProfile = (p) => ({
  name: p.name || '',
  avatarUri: p.avatar_url || null,
  birthYear: p.birth_year ?? null,
  goal: p.goal || 'track',
  cycleLength: p.cycle_length ?? 28,
  periodLength: p.period_length ?? 5,
  reminders: p.reminders ?? true,
  remindDaysBefore: p.remind_days_before ?? 2,
});

const PROFILE_COLUMNS = {
  name: 'name',
  avatarUri: 'avatar_url',
  birthYear: 'birth_year',
  goal: 'goal',
  cycleLength: 'cycle_length',
  periodLength: 'period_length',
  reminders: 'reminders',
  remindDaysBefore: 'remind_days_before',
};

/** Turns a settings patch into the column names the profiles table uses. */
export function profilePatch(patch) {
  const out = {};
  Object.entries(patch).forEach(([key, value]) => {
    const column = PROFILE_COLUMNS[key];
    if (column) out[column] = value;
  });
  return out;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signUp({ name, email, password }) {
  return supabase.auth.signUp({
    email: email.trim(),
    password,
    // Picked up by the handle_new_user trigger, so the profile has a name from
    // the first moment rather than after a second round trip.
    options: { data: { name: name.trim() } },
  });
}

export async function signIn({ email, password }) {
  return supabase.auth.signInWithPassword({ email: email.trim(), password });
}

/**
 * Google, through the system browser.
 *
 * `skipBrowserRedirect` keeps Supabase from navigating anywhere itself: we want
 * the URL so it can be opened in an auth session that returns to the app's own
 * scheme, which is what makes the redirect land back here instead of in Chrome.
 */
export async function signInWithGoogle() {
  const redirectTo = Linking.createURL('auth-callback');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) return { error };
  if (!data?.url) return { error: new Error('Could not start Google sign in.') };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { cancelled: true };

  // The callback can come back three ways, so read both halves of the URL
  // rather than assuming one: tokens in the fragment (the implicit flow, which
  // is what supabase-js uses by default), a code in the query (pkce), or an
  // error in the query when consent was refused.
  const [base, fragment = ''] = result.url.split('#');
  const query = new URLSearchParams(base.split('?')[1] || '');
  const hash = new URLSearchParams(fragment);
  const describe = (p) => p.get('error_description') || p.get('error');

  const failure = describe(query) || describe(hash);
  if (failure) return { error: new Error(failure) };

  const code = query.get('code');
  if (code) return supabase.auth.exchangeCodeForSession(code);

  const access_token = hash.get('access_token');
  const refresh_token = hash.get('refresh_token');
  if (!access_token || !refresh_token) {
    return { error: new Error('Google sign in did not return a session.') };
  }

  return supabase.auth.setSession({ access_token, refresh_token });
}

export const signOut = () => supabase.auth.signOut();

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** Everything the app needs for one user, in three parallel round trips. */
export async function fetchAll(userId) {
  const [profile, periods, logs] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
    supabase.from('periods').select('*').eq('user_id', userId).order('start_date'),
    supabase.from('logs').select('*').eq('user_id', userId),
  ]);

  const error = profile.error || periods.error || logs.error;
  if (error) return { error };

  const logMap = {};
  (logs.data || []).forEach((row) => {
    logMap[row.log_date] = logFromRow(row);
  });

  return {
    profile: profile.data || null,
    periods: (periods.data || []).map(periodFromRow),
    logs: logMap,
  };
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

// Every write below is `async` on purpose. A Postgrest query builder is a
// thenable, not a Promise: it has `then` but no `catch`, so returning one
// directly means any caller that writes `.catch(...)` — which is every
// fire-and-forget write in the store — dies on "undefined is not a function".
// Marking these async wraps the builder in a real Promise at the boundary.

export async function saveProfile(userId, patch) {
  const columns = profilePatch(patch);
  if (!Object.keys(columns).length) return { error: null };
  return supabase.from('profiles').update(columns).eq('id', userId);
}

export async function saveTourSeen(userId, seen) {
  return supabase.from('profiles').update({ tour_seen: seen }).eq('id', userId);
}

export async function upsertLog(userId, date, log) {
  return supabase.from('logs').upsert(
    {
      user_id: userId,
      log_date: date,
      flow: log.flow || null,
      moods: log.moods || [],
      symptoms: log.symptoms || [],
      notes: log.notes || '',
      water: log.water || 0,
    },
    { onConflict: 'user_id,log_date' }
  );
}

export async function deleteLog(userId, date) {
  return supabase.from('logs').delete().eq('user_id', userId).eq('log_date', date);
}

/**
 * Periods are edited as a whole array by the toggle logic, so the cheapest
 * honest sync is to diff the array before against the array after. Rows that
 * disappeared are deleted, rows without an id are new, and the rest are only
 * touched when a date actually moved.
 */
export async function syncPeriods(userId, before, after) {
  const keptIds = new Set(after.map((p) => p.id).filter(Boolean));
  const removed = before.filter((p) => p.id && !keptIds.has(p.id));
  const added = after.filter((p) => !p.id);
  const changed = after.filter((p) => {
    if (!p.id) return false;
    const was = before.find((b) => b.id === p.id);
    return was && (was.start !== p.start || was.end !== p.end);
  });

  if (removed.length) {
    await supabase
      .from('periods')
      .delete()
      .in('id', removed.map((p) => p.id));
  }

  await Promise.all(
    changed.map((p) =>
      supabase
        .from('periods')
        .update({ start_date: p.start, end_date: p.end })
        .eq('id', p.id)
    )
  );

  if (!added.length) return { inserted: [] };

  const { data, error } = await supabase
    .from('periods')
    .insert(
      added.map((p) => ({ user_id: userId, start_date: p.start, end_date: p.end }))
    )
    .select();

  if (error) return { error, inserted: [] };
  return { inserted: (data || []).map(periodFromRow) };
}

/** Wipes the logged data. The profile row stays, so settings survive. */
export async function clearUserData(userId) {
  const [periods, logs] = await Promise.all([
    supabase.from('periods').delete().eq('user_id', userId),
    supabase.from('logs').delete().eq('user_id', userId),
  ]);
  return { error: periods.error || logs.error };
}

// ---------------------------------------------------------------------------
// Avatars
// ---------------------------------------------------------------------------

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * base64 -> bytes, by hand.
 *
 * React Native has no dependable `atob`, and `fetch(fileUri).arrayBuffer()` is
 * not supported for local files on every platform. The picker already hands us
 * base64, so decoding it here keeps the upload path free of both problems and
 * of an extra dependency.
 */
function bytesFromBase64(base64) {
  // Keep the '=' padding: it is what says how many bytes the last group holds.
  // Strip it first and the output length can only be guessed, which is how this
  // quietly truncated every image whose size was not a multiple of three.
  let clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  while (clean.length % 4 !== 0) clean += '='; // tolerate unpadded input

  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const bytes = new Uint8Array((clean.length / 4) * 3 - padding);
  const sextet = (c) => {
    const i = B64.indexOf(c);
    return i < 0 ? 0 : i; // '=' contributes nothing
  };

  let byte = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const chunk =
      (sextet(clean[i]) << 18) |
      (sextet(clean[i + 1]) << 12) |
      (sextet(clean[i + 2]) << 6) |
      sextet(clean[i + 3]);

    if (byte < bytes.length) bytes[byte++] = (chunk >> 16) & 0xff;
    if (byte < bytes.length) bytes[byte++] = (chunk >> 8) & 0xff;
    if (byte < bytes.length) bytes[byte++] = chunk & 0xff;
  }
  return bytes;
}

const extensionFor = (mimeType) =>
  ({ 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic' }[mimeType] || 'jpg');

/** Removes every object in the user's folder except `keep`. */
async function pruneAvatars(userId, keep) {
  const { data } = await supabase.storage.from('avatars').list(userId);
  const stale = (data || [])
    .map((f) => `${userId}/${f.name}`)
    .filter((path) => path !== keep);
  if (stale.length) await supabase.storage.from('avatars').remove(stale);
}

/**
 * Uploads the picked image and returns its public URL.
 *
 * The filename carries a timestamp rather than being a fixed `avatar.jpg`:
 * overwriting one path would leave every cached copy of the old image showing
 * on other devices. A fresh name busts that, and the previous files are swept
 * up afterwards so the folder never grows.
 */
export async function uploadAvatar(userId, asset) {
  if (!asset?.base64) return { error: new Error('That image could not be read.') };

  const mimeType = asset.mimeType || 'image/jpeg';
  const path = `${userId}/${Date.now()}.${extensionFor(mimeType)}`;

  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, bytesFromBase64(asset.base64), { contentType: mimeType, upsert: true });
  if (error) return { error };

  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  await pruneAvatars(userId, path).catch(() => {});

  return { url: data.publicUrl };
}

/** Clears the photo: every object in the folder, then the column. */
export async function removeAvatar(userId) {
  await pruneAvatars(userId, null).catch(() => {});
  return supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
}

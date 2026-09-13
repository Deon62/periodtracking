import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { analyse, today, addDays, daysBetween } from './cycle';

const KEY = 'bloom.state.v1';

export const FLOWS = [
  { id: 'spotting', label: 'Spotting', drops: 1 },
  { id: 'light', label: 'Light', drops: 1 },
  { id: 'medium', label: 'Medium', drops: 2 },
  { id: 'heavy', label: 'Heavy', drops: 3 },
];

export const MOODS = [
  { id: 'calm', label: 'Calm' },
  { id: 'happy', label: 'Happy' },
  { id: 'energetic', label: 'Energetic' },
  { id: 'sensitive', label: 'Sensitive' },
  { id: 'anxious', label: 'Anxious' },
  { id: 'irritable', label: 'Irritable' },
  { id: 'low', label: 'Low' },
  { id: 'foggy', label: 'Foggy' },
];

export const SYMPTOMS = [
  { id: 'cramps', label: 'Cramps' },
  { id: 'headache', label: 'Headache' },
  { id: 'bloating', label: 'Bloating' },
  { id: 'tender', label: 'Tender breasts' },
  { id: 'backache', label: 'Back ache' },
  { id: 'acne', label: 'Acne' },
  { id: 'nausea', label: 'Nausea' },
  { id: 'cravings', label: 'Cravings' },
  { id: 'fatigue', label: 'Fatigue' },
  { id: 'insomnia', label: 'Poor sleep' },
];

const DEFAULT_STATE = {
  // Null until somebody signs in. There is no server yet, so this is a local
  // session record: { name, email, provider }. Swap the three actions below for
  // real API calls and nothing else on any screen has to change.
  account: null,
  // The walkthrough runs once per device, not once per sign-in — signing out
  // and back in should not replay it.
  tourSeen: false,
  settings: {
    name: '',
    avatarUri: null,
    birthYear: null,
    goal: 'track',
    cycleLength: 28,
    periodLength: 5,
    reminders: true,
    remindDaysBefore: 2,
  },
  periods: [], // [{ start, end|null }]
  logs: {},    // { 'YYYY-MM-DD': { flow, moods[], symptoms[], notes, water } }
};

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [state, setState] = useState(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(KEY);
        if (raw) {
          const saved = JSON.parse(raw);
          setState({
            ...DEFAULT_STATE,
            ...saved,
            settings: { ...DEFAULT_STATE.settings, ...(saved.settings || {}) },
          });
        }
      } catch (e) {
        // A corrupt blob should not brick the app; fall back to defaults.
        console.warn('Could not read saved data', e);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Persist on every change once the first read has finished.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(KEY, JSON.stringify(state)).catch((e) =>
      console.warn('Could not save', e)
    );
  }, [state, ready]);

  const update = useCallback((fn) => setState((s) => fn(s)), []);

  const setSettings = useCallback(
    (patch) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
    [update]
  );

  /**
   * Creates the session. Cycle length, period length and the last period start
   * are deliberately not asked for here — they default, and Settings, Personal
   * details and the calendar let her correct them whenever she gets to it.
   *
   * The password is checked for shape and then dropped: keeping one on the
   * device would be security theatre, and a real backend will own it.
   */
  const signUp = useCallback(
    ({ name, email }) =>
      update((s) => ({
        ...s,
        account: { name: name.trim(), email: email.trim(), provider: 'password' },
        settings: { ...s.settings, name: name.trim() || s.settings.name },
      })),
    [update]
  );

  const signIn = useCallback(
    ({ email }) =>
      update((s) => ({
        ...s,
        account: { name: s.settings.name, email: email.trim(), provider: 'password' },
      })),
    [update]
  );

  const signInWithGoogle = useCallback(
    () =>
      update((s) => ({
        ...s,
        account: { name: s.settings.name, email: '', provider: 'google' },
      })),
    [update]
  );

  /**
   * Marks `key` as a period start, or removes the period it belongs to when it
   * is already tracked. Consecutive days extend the existing period instead of
   * creating a second one.
   */
  const togglePeriodDay = useCallback(
    (key) =>
      update((s) => {
        const periods = [...s.periods];

        const inside = periods.findIndex((p) => {
          const end = p.end || p.start;
          return key >= p.start && key <= end;
        });

        if (inside >= 0) {
          const p = periods[inside];
          if (p.start === key && (!p.end || p.end === key)) {
            periods.splice(inside, 1); // single-day period, remove it
          } else if (key === p.start) {
            periods[inside] = { ...p, start: addDays(p.start, 1) };
          } else {
            periods[inside] = { ...p, end: addDays(key, -1) };
          }
          return { ...s, periods };
        }

        // Extend an adjacent period rather than starting a new one.
        const before = periods.findIndex(
          (p) => daysBetween(p.end || p.start, key) === 1
        );
        if (before >= 0) {
          periods[before] = { ...periods[before], end: key };
          return { ...s, periods };
        }
        const after = periods.findIndex((p) => daysBetween(key, p.start) === 1);
        if (after >= 0) {
          periods[after] = { ...periods[after], start: key };
          return { ...s, periods };
        }

        periods.push({ start: key, end: key });
        return { ...s, periods };
      }),
    [update]
  );

  const saveLog = useCallback(
    (key, patch) =>
      update((s) => {
        const existing = s.logs[key] || { moods: [], symptoms: [] };
        const merged = { ...existing, ...patch };
        const empty =
          !merged.flow &&
          !(merged.moods || []).length &&
          !(merged.symptoms || []).length &&
          !(merged.notes || '').trim() &&
          !merged.water;

        const logs = { ...s.logs };
        if (empty) delete logs[key];
        else logs[key] = merged;
        return { ...s, logs };
      }),
    [update]
  );

  const completeTour = useCallback(() => update((s) => ({ ...s, tourSeen: true })), [update]);
  const replayTour = useCallback(() => update((s) => ({ ...s, tourSeen: false })), [update]);

  /** Wipes the logged data but leaves her signed in. */
  const clearAll = useCallback(
    () => setState((s) => ({ ...DEFAULT_STATE, account: s.account, tourSeen: s.tourSeen })),
    []
  );

  /**
   * Signing out drops the session but keeps what has been logged, so coming
   * back does not mean starting the cycle history from scratch.
   */
  const logout = useCallback(() => update((s) => ({ ...s, account: null })), [update]);

  const model = useMemo(
    () => analyse(state.periods, state.settings, today()),
    [state.periods, state.settings]
  );

  const value = useMemo(
    () => ({
      ready,
      ...state,
      model,
      setSettings,
      signUp,
      signIn,
      signInWithGoogle,
      completeTour,
      replayTour,
      togglePeriodDay,
      saveLog,
      clearAll,
      logout,
    }),
    [
      ready,
      state,
      model,
      setSettings,
      signUp,
      signIn,
      signInWithGoogle,
      completeTour,
      replayTour,
      togglePeriodDay,
      saveLog,
      clearAll,
      logout,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import * as api from './api';
import { analyse, today, addDays, daysBetween } from './cycle';

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

export const DEFAULT_SETTINGS = {
  name: '',
  avatarUri: null,
  birthYear: null,
  goal: 'track',
  cycleLength: 28,
  periodLength: 5,
  reminders: true,
  remindDaysBefore: 2,
};

const EMPTY = {
  settings: DEFAULT_SETTINGS,
  periods: [], // [{ id, start, end|null }]
  logs: {},    // { 'YYYY-MM-DD': { flow, moods[], symptoms[], notes, water } }
  tourSeen: false,
};

// Supabase is the source of truth. This is only a warm start: the last known
// data for a user, so the app draws something the instant it opens instead of a
// blank screen while the network answers. Keyed per user so two accounts on one
// phone never see each other's cycle.
const cacheKey = (userId) => `nimoh.cache.${userId}`;

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [session, setSession] = useState(null);
  const [state, setState] = useState(EMPTY);
  // False until the session has been restored, so the router never guesses.
  const [ready, setReady] = useState(false);
  // True while the first fetch for a user is still in flight.
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const userId = session?.user?.id || null;
  // Writes fire off the back of user actions; this keeps them addressed to the
  // right account even if one lands just as the session changes.
  const userRef = useRef(null);
  userRef.current = userId;

  /**
   * Mutations need the current data to compute the next, and they also fire a
   * network write — which must not live inside a setState updater, because
   * React is free to run those more than once. So state is mirrored here and
   * every change goes through commit(): read from the ref, compute, write once.
   */
  const stateRef = useRef(EMPTY);
  const commit = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);

  /**
   * Every write goes through here.
   *
   * supabase-js resolves with `{ error }` instead of rejecting, so the
   * `.catch(() => {})` these calls used to carry never fired once — a write
   * refused by row level security looked exactly like one that worked, and the
   * data quietly stayed on the phone. Now a failure says so, on screen and in
   * the Metro log.
   */
  const write = useCallback(async (promise, what) => {
    try {
      const result = await promise;
      if (result?.error) {
        console.warn(`[nimoh] ${what} failed:`, result.error.message || result.error);
        setSyncError(`Could not save ${what}.`);
        return result;
      }
      setSyncError('');
      return result;
    } catch (e) {
      console.warn(`[nimoh] ${what} threw:`, e?.message || e);
      setSyncError(`Could not save ${what}.`);
      return { error: e };
    }
  }, []);

  // --- session -------------------------------------------------------------

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session ?? null))
      .catch(() => setSession(null))
      .finally(() => setReady(true));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // --- load ----------------------------------------------------------------

  const load = useCallback(async (id) => {
    setSyncing(true);
    setSyncError('');

    // Cache first, so there is something on screen immediately.
    try {
      const raw = await AsyncStorage.getItem(cacheKey(id));
      if (raw) commit({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // A corrupt cache is not worth a crash; the fetch below replaces it.
    }

    const result = await api.fetchAll(id);
    if (result.error) {
      console.warn('[nimoh] load failed:', result.error.message || result.error);
      setSyncError('Could not reach the server. Showing your last saved data.');
      setSyncing(false);
      return;
    }

    // An account made before the sign-up trigger existed has no profile row,
    // and without one every settings write lands nowhere.
    if (!result.profile) api.ensureProfile(id).catch(() => {});

    commit({
      settings: result.profile
        ? api.settingsFromProfile(result.profile)
        : DEFAULT_SETTINGS,
      periods: result.periods,
      logs: result.logs,
      tourSeen: result.profile?.tour_seen ?? false,
    });
    setSyncing(false);
  }, [commit]);

  useEffect(() => {
    if (!userId) {
      commit(EMPTY);
      return;
    }
    load(userId);
  }, [userId, load, commit]);

  // Mirror every change back into the cache.
  useEffect(() => {
    if (!userId || syncing) return;
    AsyncStorage.setItem(cacheKey(userId), JSON.stringify(state)).catch(() => {});
  }, [state, userId, syncing]);

  // --- auth ----------------------------------------------------------------

  const signUp = useCallback((credentials) => api.signUp(credentials), []);
  const signIn = useCallback((credentials) => api.signIn(credentials), []);
  const signInWithGoogle = useCallback(() => api.signInWithGoogle(), []);

  const logout = useCallback(async () => {
    await api.signOut();
    setSession(null);
    commit(EMPTY);
  }, [commit]);

  // --- settings ------------------------------------------------------------

  const setSettings = useCallback(
    (patch) => {
      const s = stateRef.current;
      commit({ ...s, settings: { ...s.settings, ...patch } });
      const id = userRef.current;
      if (id) write(api.saveProfile(id, patch), 'your settings');
    },
    [commit, write]
  );

  /**
   * Uploads the picked image, then points the profile at its public URL.
   *
   * The local file URI is shown straight away so the new photo appears on the
   * tap, and is replaced by the hosted URL once the upload lands — without
   * that, the avatar would sit blank for the length of the round trip.
   */
  const setAvatar = useCallback(
    async (asset) => {
      const id = userRef.current;
      if (!id) return { error: new Error('Not signed in.') };

      const local = { ...stateRef.current };
      commit({ ...local, settings: { ...local.settings, avatarUri: asset.uri } });

      const { url, error } = await api.uploadAvatar(id, asset);
      if (error) {
        // Put the old photo back rather than leaving a URI that only resolves
        // on this phone and will not survive a reinstall.
        const now = stateRef.current;
        commit({
          ...now,
          settings: { ...now.settings, avatarUri: local.settings.avatarUri },
        });
        return { error };
      }

      const now = stateRef.current;
      commit({ ...now, settings: { ...now.settings, avatarUri: url } });
      write(api.saveProfile(id, { avatarUri: url }), 'your photo');
      return { url };
    },
    [commit]
  );

  const removeAvatar = useCallback(async () => {
    const s = stateRef.current;
    commit({ ...s, settings: { ...s.settings, avatarUri: null } });
    const id = userRef.current;
    if (id) await write(api.removeAvatar(id), 'your photo');
  }, [commit, write]);

  const setTourSeen = useCallback(
    (seen) => {
      commit({ ...stateRef.current, tourSeen: seen });
      const id = userRef.current;
      if (id) write(api.saveTourSeen(id, seen), 'your progress');
    },
    [commit, write]
  );

  const completeTour = useCallback(() => setTourSeen(true), [setTourSeen]);
  const replayTour = useCallback(() => setTourSeen(false), [setTourSeen]);

  // --- periods -------------------------------------------------------------

  /**
   * Marks `key` as a period day, or removes the period it belongs to when it is
   * already tracked. Consecutive days extend the existing period instead of
   * creating a second one.
   *
   * The array is recomputed locally first so the calendar responds on the tap,
   * then the before/after pair is handed to the sync, which works out the
   * inserts, updates and deletes and writes the new ids back.
   */
  const togglePeriodDay = useCallback(
    (key) => {
      const s = stateRef.current;
      const before = s.periods;
      const periods = [...before];

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
      } else {
        // Extend an adjacent period rather than starting a new one.
        const endsBefore = periods.findIndex(
          (p) => daysBetween(p.end || p.start, key) === 1
        );
        const startsAfter = periods.findIndex((p) => daysBetween(key, p.start) === 1);

        if (endsBefore >= 0) {
          periods[endsBefore] = { ...periods[endsBefore], end: key };
        } else if (startsAfter >= 0) {
          periods[startsAfter] = { ...periods[startsAfter], start: key };
        } else {
          periods.push({ start: key, end: key });
        }
      }

      commit({ ...s, periods });

      const id = userRef.current;
      if (!id) return;
      write(api.syncPeriods(id, before, periods), 'that period')
        .then(({ inserted } = {}) => {
          if (!inserted?.length) return;
          // Fold the new ids in, so the next edit updates the row rather than
          // inserting a second one for the same start date.
          const byStart = new Map(inserted.map((p) => [p.start, p]));
          const current = stateRef.current;
          commit({
            ...current,
            periods: current.periods.map((p) => (p.id ? p : byStart.get(p.start) || p)),
          });
        });
    },
    [commit, write]
  );

  // --- logs ----------------------------------------------------------------

  const saveLog = useCallback(
    (key, patch) => {
      const s = stateRef.current;
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

      commit({ ...s, logs });

      const id = userRef.current;
      if (!id) return;
      write(
        empty ? api.deleteLog(id, key) : api.upsertLog(id, key, merged),
        'your entry'
      );
    },
    [commit, write]
  );

  const clearAll = useCallback(async () => {
    const s = stateRef.current;
    commit({ ...EMPTY, settings: s.settings, tourSeen: s.tourSeen });
    const id = userRef.current;
    if (id) await write(api.clearUserData(id), 'that change');
  }, [commit, write]);

  // --- derived -------------------------------------------------------------

  const model = useMemo(
    () => analyse(state.periods, state.settings, today()),
    [state.periods, state.settings]
  );

  const account = useMemo(() => {
    if (!session?.user) return null;
    return {
      id: session.user.id,
      email: session.user.email || '',
      provider: session.user.app_metadata?.provider || 'email',
    };
  }, [session]);

  const value = useMemo(
    () => ({
      ready,
      syncing,
      syncError,
      dismissSyncError: () => setSyncError(''),
      account,
      ...state,
      model,
      setSettings,
      setAvatar,
      removeAvatar,
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
      syncing,
      syncError,
      account,
      state,
      model,
      setSettings,
      setAvatar,
      removeAvatar,
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

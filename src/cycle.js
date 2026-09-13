// Date helpers + cycle maths. Dates are handled as 'YYYY-MM-DD' keys so nothing
// ever drifts across timezones.

export const MS_DAY = 86400000;

export function toKey(date) {
  const d = new Date(date);
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function today() {
  return toKey(new Date());
}

export function addDays(key, n) {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function daysBetween(a, b) {
  return Math.round((fromKey(b) - fromKey(a)) / MS_DAY);
}

export function startOfMonth(key) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth(), 1));
}

export function addMonths(key, n) {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

export function daysInMonth(key) {
  const d = fromKey(key);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function monthLabel(key) {
  const d = fromKey(key);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function prettyDate(key, withYear = false) {
  const d = fromKey(key);
  const base = `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}`;
  return withYear ? `${base}, ${d.getFullYear()}` : base;
}

export function longDate(key) {
  const d = fromKey(key);
  return `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function weekday(key) {
  return fromKey(key).getDay();
}

// ---------------------------------------------------------------------------

export const PHASES = {
  menstrual: {
    key: 'menstrual',
    title: 'Menstrual',
    icon: 'droplet',
    blurb: 'Rest is productive. Keep things gentle and warm.',
  },
  follicular: {
    key: 'follicular',
    title: 'Follicular',
    icon: 'leaf',
    blurb: 'Energy is climbing. A good stretch for starting things.',
  },
  ovulation: {
    key: 'ovulation',
    title: 'Ovulation',
    icon: 'sparkle',
    blurb: 'Peak energy and confidence. Say the bold thing.',
  },
  luteal: {
    key: 'luteal',
    title: 'Luteal',
    icon: 'moon',
    blurb: 'Winding down. Protect your sleep and your calendar.',
  },
};

/**
 * Sorted, de-duplicated period starts, newest last.
 */
function sortedPeriods(periods) {
  return [...periods].sort((a, b) => (a.start < b.start ? -1 : 1));
}

/**
 * Observed gaps between consecutive period starts.
 */
export function cycleLengths(periods) {
  const sorted = sortedPeriods(periods);
  const out = [];
  for (let i = 1; i < sorted.length; i += 1) {
    const gap = daysBetween(sorted[i - 1].start, sorted[i].start);
    // Ignore nonsense gaps so one mistyped entry cannot wreck every prediction.
    if (gap >= 15 && gap <= 90) out.push(gap);
  }
  return out;
}

export function periodLengths(periods) {
  return periods
    .filter((p) => p.end)
    .map((p) => daysBetween(p.start, p.end) + 1)
    .filter((n) => n >= 1 && n <= 14);
}

function average(nums, fallback) {
  if (!nums.length) return fallback;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/**
 * The whole model in one place: everything the UI needs, derived once.
 */
export function analyse(periods, settings, ref = today()) {
  const sorted = sortedPeriods(periods);
  const lengths = cycleLengths(periods);
  const pLengths = periodLengths(periods);

  const avgCycle = average(lengths.slice(-6), settings.cycleLength);
  const avgPeriod = average(pLengths.slice(-6), settings.periodLength);

  // Spread of the last six cycles tells us how much to trust a prediction.
  let variation = 0;
  if (lengths.length >= 2) {
    const recent = lengths.slice(-6);
    variation = Math.max(...recent) - Math.min(...recent);
  }
  const regularity =
    lengths.length < 2 ? 'unknown' : variation <= 4 ? 'regular' : variation <= 8 ? 'mostly regular' : 'irregular';

  const last = sorted[sorted.length - 1] || null;

  if (!last) {
    return {
      hasData: false,
      avgCycle,
      avgPeriod,
      variation,
      regularity,
      cycleCount: sorted.length,
      lengths,
      periods: sorted,
    };
  }

  // Which cycle are we in? Start from the last logged period.
  let cycleStart = last.start;
  let dayOfCycle = daysBetween(cycleStart, ref) + 1;

  // A period can run a little late before we assume anything is wrong. Past
  // that, the user simply stopped logging, so roll forward whole cycles rather
  // than reporting a prediction that is already in the past.
  const GRACE = 10;
  while (dayOfCycle > avgCycle + GRACE) {
    cycleStart = addDays(cycleStart, avgCycle);
    dayOfCycle = daysBetween(cycleStart, ref) + 1;
  }

  const nextStart = addDays(cycleStart, avgCycle);
  const daysUntilNext = Math.max(0, daysBetween(ref, nextStart));
  // Days past the expected start with nothing logged.
  const lateBy = Math.max(0, daysBetween(nextStart, ref));
  const ovulation = addDays(nextStart, -14);
  const fertileStart = addDays(ovulation, -5);
  const fertileEnd = addDays(ovulation, 1);

  const onPeriod = isPeriodDay(sorted, ref, avgPeriod);

  let phase;
  if (onPeriod || (dayOfCycle >= 1 && dayOfCycle <= avgPeriod)) phase = PHASES.menstrual;
  else if (ref >= fertileStart && ref <= fertileEnd) phase = PHASES.ovulation;
  else if (ref < fertileStart) phase = PHASES.follicular;
  else phase = PHASES.luteal;

  const upcoming = [];
  for (let i = 0; i < 4; i += 1) {
    const s = addDays(nextStart, avgCycle * i);
    upcoming.push({ start: s, end: addDays(s, avgPeriod - 1) });
  }

  return {
    hasData: true,
    periods: sorted,
    lengths,
    avgCycle,
    avgPeriod,
    variation,
    regularity,
    cycleCount: sorted.length,
    cycleStart,
    dayOfCycle: Math.max(1, dayOfCycle),
    nextStart,
    daysUntilNext,
    lateBy,
    ovulation,
    fertileStart,
    fertileEnd,
    phase,
    onPeriod,
    upcoming,
  };
}

/**
 * True when `key` falls inside a logged period. Open-ended periods are assumed
 * to run for the user's average length.
 */
export function isPeriodDay(periods, key, avgPeriod) {
  return periods.some((p) => {
    const end = p.end || addDays(p.start, avgPeriod - 1);
    return key >= p.start && key <= end;
  });
}

/**
 * Classification for a single calendar cell.
 */
export function dayStatus(key, model) {
  if (!model.hasData) return { type: 'none' };

  if (isPeriodDay(model.periods, key, model.avgPeriod)) {
    return { type: 'period' };
  }

  for (const p of model.upcoming) {
    if (key >= p.start && key <= p.end) return { type: 'predicted' };
  }

  if (key === model.ovulation) return { type: 'ovulation' };
  if (key >= model.fertileStart && key <= model.fertileEnd) return { type: 'fertile' };

  return { type: 'none' };
}

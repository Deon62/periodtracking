import { today, addDays, daysBetween, prettyDate } from './cycle';
import { SYMPTOMS } from './store';

/**
 * The feed, built from what has actually been tracked.
 *
 * There is no notifications table and nothing is pushed yet — these are derived
 * on read from the same model the rest of the app draws from. That keeps them
 * honest (nothing here can claim something the data does not say) and means the
 * screen is already right on the day real reminders start being sent: swap this
 * function for a query and the page does not change.
 *
 * Each item is dated, so "today" and "3d ago" are real rather than decorative.
 */

export const KINDS = {
  period: { icon: 'droplet', tone: 'brand' },
  fertile: { icon: 'leaf', tone: 'teal' },
  reminder: { icon: 'bell', tone: 'slate' },
  insight: { icon: 'sparkle', tone: 'brand' },
  streak: { icon: 'flame', tone: 'slate' },
};

export function buildNotifications(model, logs = {}) {
  const now = today();
  const items = [];
  const add = (item) => items.push(item);

  if (!model?.hasData) {
    return items; // Nothing tracked yet: the empty state says it better.
  }

  // --- where she is in the cycle right now ---------------------------------
  if (model.onPeriod) {
    add({
      id: 'period-now',
      kind: 'period',
      date: model.cycleStart,
      title: `Day ${daysBetween(model.cycleStart, now) + 1} of your period`,
      body: 'Warmth, water, and nothing you do not feel like.',
    });
  } else if (model.lateBy > 0) {
    add({
      id: 'period-late',
      kind: 'period',
      date: model.nextStart,
      title: `Your period is ${model.lateBy} ${model.lateBy === 1 ? 'day' : 'days'} late`,
      body: 'Cycles shift for all sorts of reasons. Log it when it arrives.',
    });
  } else if (model.daysUntilNext <= 3) {
    add({
      id: 'period-soon',
      kind: 'period',
      date: now,
      title:
        model.daysUntilNext === 0
          ? 'Your period is expected today'
          : `Your period is due in ${model.daysUntilNext} ${
              model.daysUntilNext === 1 ? 'day' : 'days'
            }`,
      body: `Predicted from your last ${model.cycleCount} ${
        model.cycleCount === 1 ? 'cycle' : 'cycles'
      }.`,
    });
  }

  // --- fertile window -------------------------------------------------------
  if (now >= model.fertileStart && now <= model.fertileEnd) {
    add({
      id: 'fertile-open',
      kind: 'fertile',
      date: model.fertileStart,
      title: 'You are in your fertile window',
      body: `It runs to ${prettyDate(model.fertileEnd)}, with ovulation around ${prettyDate(
        model.ovulation
      )}.`,
    });
  } else if (now < model.fertileStart && daysBetween(now, model.fertileStart) <= 2) {
    add({
      id: 'fertile-soon',
      kind: 'fertile',
      date: now,
      title: `Fertile window opens ${
        daysBetween(now, model.fertileStart) === 1 ? 'tomorrow' : 'in 2 days'
      }`,
      body: `Estimated ovulation on ${prettyDate(model.ovulation)}.`,
    });
  }

  // --- logging habit --------------------------------------------------------
  const logged = Object.keys(logs).sort();
  if (logged.length) {
    const last = logged[logged.length - 1];
    const quiet = daysBetween(last, now);
    if (quiet >= 2) {
      add({
        id: 'log-gap',
        kind: 'reminder',
        date: last,
        title: `Nothing logged for ${quiet} days`,
        body: 'A flow and a mood is all it takes.',
      });
    }

    // Consecutive days ending today or yesterday.
    let streak = 0;
    for (let i = 0; i < 60; i += 1) {
      if (!logs[addDays(now, -i)]) {
        if (i === 0) continue; // today may simply not be logged yet
        break;
      }
      streak += 1;
    }
    if (streak >= 3) {
      add({
        id: 'streak',
        kind: 'streak',
        date: now,
        title: `${streak} days logged in a row`,
        body: 'The more there is, the sharper the predictions get.',
      });
    }
  }

  // --- patterns worth mentioning -------------------------------------------
  const counts = {};
  Object.values(logs).forEach((l) =>
    (l.symptoms || []).forEach((id) => {
      counts[id] = (counts[id] || 0) + 1;
    })
  );
  const [topId, topCount] = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || [];
  if (topCount >= 3) {
    add({
      id: 'symptom-pattern',
      kind: 'insight',
      date: now,
      title: `${SYMPTOMS.find((s) => s.id === topId)?.label || topId} came up ${topCount} times`,
      body: 'Your most logged symptom so far. Insights has the full picture.',
    });
  }

  if (model.cycleCount >= 2) {
    add({
      id: 'regularity',
      kind: 'insight',
      date: model.cycleStart,
      title:
        model.regularity === 'regular'
          ? 'Your cycle is looking steady'
          : `Your cycle has moved by ${model.variation} days`,
      body:
        model.regularity === 'regular'
          ? `Within ${model.variation} ${model.variation === 1 ? 'day' : 'days'} across recent cycles.`
          : 'Treat the predictions as a guide for now.',
    });
  }

  // Newest first.
  return items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

/** Anything dated today is what she has not seen yet. */
export const isNew = (item) => item.date === today();

export const unreadCount = (items) => items.filter(isNew).length;

/** Relative label, at the resolution a feed actually needs. */
export function timeAgo(date) {
  const days = daysBetween(date, today());
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  if (days < 28) return `${Math.round(days / 7)}w`;
  return prettyDate(date);
}

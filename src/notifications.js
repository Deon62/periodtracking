/**
 * Mock notifications, so the screen can be designed before anything actually
 * sends one.
 *
 * The shape is deliberately close to what a real feed would need — an id, a
 * kind, a timestamp and a read flag — so swapping this array for a `notifications`
 * table is a change of source, not a change of screen. `minutesAgo` stands in
 * for a real timestamp and is resolved at read time, which keeps the relative
 * labels ("2h", "Yesterday") honest no matter when the app is opened.
 *
 * The five kinds are the five things this app has any business interrupting
 * someone for: her period is coming, her period is here, her fertile window
 * opened, she has not logged in a while, or the app noticed a pattern.
 */

export const KINDS = {
  period: { icon: 'droplet', tone: 'brand' },
  fertile: { icon: 'leaf', tone: 'teal' },
  reminder: { icon: 'bell', tone: 'slate' },
  insight: { icon: 'sparkle', tone: 'brand' },
  streak: { icon: 'flame', tone: 'slate' },
};

const MOCK = [
  {
    id: '1',
    kind: 'period',
    title: 'Your period is due tomorrow',
    body: 'Based on your last four cycles. Pack accordingly.',
    minutesAgo: 35,
    read: false,
  },
  {
    id: '2',
    kind: 'insight',
    title: 'Cramps turned up 4 times this cycle',
    body: 'Always in the two days before your period starts.',
    minutesAgo: 5 * 60,
    read: false,
  },
  {
    id: '3',
    kind: 'reminder',
    title: 'Nothing logged yesterday',
    body: 'A flow and a mood is all it takes.',
    minutesAgo: 26 * 60,
    read: true,
  },
  {
    id: '4',
    kind: 'fertile',
    title: 'Your fertile window opens today',
    body: 'It runs for six days, with ovulation around day 14.',
    minutesAgo: 3 * 24 * 60,
    read: true,
  },
  {
    id: '5',
    kind: 'streak',
    title: 'Nine days logged in a row',
    body: 'Two more cycles and your predictions get sharper.',
    minutesAgo: 5 * 24 * 60,
    read: true,
  },
  {
    id: '6',
    kind: 'period',
    title: 'Day 1 — take it gently',
    body: 'Warmth, water, and nothing you do not feel like.',
    minutesAgo: 9 * 24 * 60,
    read: true,
  },
];

/** Relative time, at the resolution a feed actually needs. */
export function timeAgo(minutes) {
  if (minutes < 1) return 'Now';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  return `${Math.round(days / 7)}w`;
}

export const getNotifications = () => MOCK;

export const unreadCount = () => MOCK.filter((n) => !n.read).length;

# nimoh

A minimal period tracker for Android and iOS, built with Expo. Clean white
canvas, `#FF2A85` as the only brand colour, Quicksand throughout, and a set of
hand-drawn stroke icons. No emoji anywhere.

## Backend

Supabase: auth, Postgres and row level security. `supabase/schema.sql` is the
whole schema — run it once in the SQL editor. Three tables (`profiles`,
`periods`, `logs`), each keyed by `auth.uid()` with RLS on, so a row is only
ever readable by the user it belongs to.

Profile photos go to the `avatars` storage bucket, one folder per user id, with
the storage policies keyed off that folder so nobody can write outside her own.

`src/supabase.js` creates the client (session in `expo-sqlite` storage, token
refresh tied to app foreground); `src/api.js` is every query in one place;
`src/store.js` holds the working copy, writes through optimistically and keeps a
per-user AsyncStorage cache so the app opens with data rather than a blank
screen while the network answers.

The project URL and publishable key sit at the top of `src/supabase.js`. No
`.env`: those two values are designed to ship inside the app, and the RLS
policies are what keep the data private. The database password and the
`postgresql://` string are not, and are not in this repo.

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android or iOS.

## Screens

| Screen   | What it does |
| -------- | ------------ |
| Today    | Fits one screen with no scrolling: cycle ring, current phase, three key figures, one-tap period start/stop, and a link into today's log — or, before anything is tracked, into the calendar |
| Calendar | Month grid with period, predicted period, fertile window and ovulation; tap any day for a detail sheet to mark a period day or edit its log. The floating add button lives here |
| Log      | Reached from the floating add button or a calendar day; flow, mood and symptoms are collapsed dropdowns, plus water and free-text notes |
| Insights | Chart-led and near wordless: phase donut, regularity gauge, cycle-length sparkline, a four-week flow heat grid, a mood split bar and symptom bubbles; stats and upcoming periods sit behind "More detail" |
| You      | A hub that never scrolls: profile photo, name, links to Personal details and Settings, and log out |

Two further pages sit outside the tabs: **Personal details** (photo, name, birth
year, what you are tracking for) and **Settings** (cycle lengths, reminders,
privacy, delete all data).

**Sign in** and **Sign up** share one component (`src/components/AuthForm.js`)
and ask for nothing but a name, an email and a password — plus *Continue with
Google*. None of the cycle setup happens there: cycle and period length default
to 28 and 5 and are edited in Settings, name and birth year in Personal details,
and the first period start is one tap on Today or on any calendar day.

On launch the native splash hands over to `src/components/Splash.js` — the mark
and *Welcome to nimoh* centred on `#121218`, the same colour as the native
splash so the handover is invisible. It renders *in place of* the app while
fonts and saved data load, and is held for 1.6s so it can actually be read.

## Design

Pink is reserved for calls to action — the primary buttons, the active tab, the
period itself on the calendar and the ring. Selected states, chart fills and
quiet backgrounds use a neutral slate ramp, and the floating add button is dark
rather than pink so it reads as a control, not a highlight.

Navigation is four tabs; adding an entry is a floating button on Calendar
rather than a fifth tab — an entry belongs to a day, so it sits with the days.

A five-card walkthrough (`src/components/Tour.js`) runs once on first launch and
answers the questions a new user actually has, starting with where to mark the
day a period began. It is replayable from Settings › Help.

Content sits flat on white: quiet section labels, hairline rules, and generous
space instead of cards and borders. The only elevated surface in the app is the
floating tab bar.

Icons are drawn by hand in `src/icons.js` as `react-native-svg` paths on a 24x24
grid, so nothing depends on an icon font and there is no emoji anywhere.

The app icon, adaptive icon and in-app mark are generated from `assets/logo.png`
— the monogram, cropped away from the wordmark, which stays legible at small
sizes. `assets/google.svg` is imported directly as a component via
`react-native-svg-transformer`, configured in `metro.config.js`.

## How predictions work

`src/cycle.js` holds all the maths and has no UI dependencies.

- Cycle length is the mean gap between the last six period starts, falling back
  to the user's setting until there are two periods to compare. Gaps outside
  15–90 days are discarded so one mistyped date cannot distort everything.
- Period length is the mean of logged period lengths, capped at 14 days.
- Ovulation is estimated 14 days before the next predicted start; the fertile
  window runs from five days before ovulation to one day after.
- Regularity comes from the spread of recent cycles: 4 days or less is
  *regular*, 8 or less *mostly regular*, otherwise *irregular*.
- A period may run up to 10 days late before the model assumes tracking simply
  stopped and rolls forward whole cycles. Within that window the app says how
  many days late it is rather than showing a countdown that has already passed.

Predictions are estimates. The app is not a contraceptive or a medical device.

## Layout

```
app/
  _layout.js          font loading, store provider, splash hold, auth gate
  sign-in.js          Sign in
  sign-up.js          Sign up
  (tabs)/
    _layout.js        tab navigator with the custom bar
    index.js          Today
    calendar.js       Calendar
    log.js            Log
    insights.js       Insights
    profile.js        You
src/
  theme.js            colours, type, radii, shadows
  icons.js            SVG icon set drawn on a 24x24 grid
  cycle.js            date helpers and the prediction model
  store.js            state, persistence, symptom and mood catalogues
  components/
    ui.js             Text, Screen, Section, Button, list rows, SeeMore
    CycleRing.js      the progress ring on Today
    Charts.js         donut, bars, sparkline, heat grid, split bar, bubbles, gauge
    Dropdown.js       the collapsed selects on the log screen
    TabBar.js         the floating bottom bar
    Fab.js            the floating add button
    AuthForm.js       sign in / sign up, shared
    Tour.js           the first-run walkthrough
    Splash.js         the launch screen
```

```
app/
  settings.js         cycle, reminders, privacy
  personal.js         photo, name, birth year, goal
  log.js              the entry form
```

Dates are handled as `YYYY-MM-DD` strings everywhere so nothing drifts across
timezones.

## Notes on this Expo version

Two APIs behave differently on SDK 57 / React Native 0.86, and both fail
silently rather than erroring:

- `StyleSheet.absoluteFillObject` **no longer exists** (only `StyleSheet.absoluteFill`
  survives). Spreading the missing name is a legal no-op, so every overlay in the
  app rendered in normal flow instead of on top. Use `absoluteFill` from
  `src/theme.js`.
- `LayoutAnimation` is a no-op on the New Architecture, and
  `setLayoutAnimationEnabledExperimental` warns. Expand/collapse uses `Animated`
  instead.

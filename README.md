# Amani Nimoh

A minimal period tracker for Android and iOS, built with Expo. Clean white
canvas, `#FF2A85` as the only brand colour, Quicksand throughout, and a set of
hand-drawn stroke icons. No emoji anywhere.

Everything is stored on the device with AsyncStorage. There is no account, no
network call, and nothing leaves the phone.

## Running it

```bash
npm install
npx expo start
```

Scan the QR code with **Expo Go** on Android or iOS.

## Screens

| Screen   | What it does |
| -------- | ------------ |
| Today    | Fits one screen with no scrolling: cycle ring, current phase, three key figures, one-tap period start/stop, and a link into today's log |
| Calendar | Month grid with period, predicted period, fertile window and ovulation; tap any day for a detail sheet to mark a period day or edit its log |
| Log      | Reached from the floating add button or a calendar day; flow, mood and symptoms are collapsed dropdowns, plus water and free-text notes |
| Insights | A donut of the average cycle, a regularity read, and a six-cycle bar chart; stats, symptom ranking and upcoming periods sit behind "More detail" |
| You      | A hub that never scrolls: profile photo, name, three figures, links to Personal details and Settings, and log out |

Two further pages sit outside the tabs: **Personal details** (photo, name, birth
year, what you are tracking for) and **Settings** (cycle lengths, reminders,
privacy, delete all data).

A four-step onboarding runs once and seeds the first period. On launch the
native splash hands over to `src/components/Splash.js` — the mark centred on
white — which renders *in place of* the app while fonts and saved data load, and
unmounts once ready.

## Design

Pink is reserved for calls to action — the primary buttons, the active tab, the
period itself on the calendar and the ring. Selected states, chart fills and
quiet backgrounds use a neutral slate ramp, and the floating add button is dark
rather than pink so it reads as a control, not a highlight.

Navigation is four tabs; adding an entry is a floating button on Today rather
than a fifth tab.

Content sits flat on white: quiet section labels, hairline rules, and generous
space instead of cards and borders. The only elevated surface in the app is the
floating tab bar.

Icons are drawn by hand in `src/icons.js` as `react-native-svg` paths on a 24x24
grid, so nothing depends on an icon font and there is no emoji anywhere.

The app icon, adaptive icon and in-app mark are generated from `assets/logo.png`
— the AN monogram, cropped away from the wordmark, which stays legible at small
sizes.

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
  _layout.js          font loading, store provider, onboarding gate
  onboarding.js       first-run setup
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
    Charts.js         donut and mini bar chart
    Dropdown.js       the collapsed selects on the log screen
    TabBar.js         the floating bottom bar
    Fab.js            the floating add button
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

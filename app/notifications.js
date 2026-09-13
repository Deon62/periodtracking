import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useStore } from '../src/store';
import { colors } from '../src/theme';
import { Icon } from '../src/icons';
import { Screen, Text, Row, PageHeader, Hairline } from '../src/components/ui';
import { buildNotifications, timeAgo, isNew, KINDS } from '../src/notifications';

const TONES = {
  brand: { bg: colors.brandSoft, fg: colors.brand },
  teal: { bg: colors.tealSoft, fg: colors.teal },
  slate: { bg: colors.slateTint, fg: colors.inkSoft },
};

export default function Notifications() {
  const router = useRouter();
  const { model, logs } = useStore();

  const items = useMemo(() => buildNotifications(model, logs), [model, logs]);

  // Two groups, not a timestamp on every row: what is new is the only division
  // that earns its heading here.
  const { fresh, earlier } = useMemo(
    () => ({ fresh: items.filter(isNew), earlier: items.filter((n) => !isNew(n)) }),
    [items]
  );

  return (
    <Screen contentStyle={{ paddingBottom: 48 }}>
      <PageHeader
        title="Notifications"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      />

      {items.length === 0 ? (
        <Empty />
      ) : (
        <>
          {fresh.length > 0 && (
            <Group title="New">
              {fresh.map((n, i) => (
                <NotificationRow key={n.id} item={n} last={i === fresh.length - 1} />
              ))}
            </Group>
          )}

          {earlier.length > 0 && (
            <Group title="Earlier">
              {earlier.map((n, i) => (
                <NotificationRow key={n.id} item={n} last={i === earlier.length - 1} />
              ))}
            </Group>
          )}
        </>
      )}

      <Text weight="medium" style={styles.note}>
        Drawn from what you have tracked. Reminders switch on in Settings.
      </Text>
    </Screen>
  );
}

function Group({ title, children }) {
  return (
    <View style={styles.group}>
      <Text weight="semibold" style={styles.groupTitle}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function NotificationRow({ item, last }) {
  const kind = KINDS[item.kind] || KINDS.reminder;
  const tone = TONES[kind.tone] || TONES.slate;
  const fresh = isNew(item);

  return (
    <View>
      <View style={styles.row}>
        <View style={[styles.puck, { backgroundColor: tone.bg }]}>
          <Icon name={kind.icon} size={18} color={tone.fg} strokeWidth={1.8} />
        </View>

        <View style={{ flex: 1 }}>
          <Row style={{ alignItems: 'flex-start' }}>
            <Text
              weight={fresh ? 'bold' : 'semibold'}
              style={[styles.title, fresh && { color: colors.ink }]}
            >
              {item.title}
            </Text>
            <Text weight="medium" style={styles.time}>
              {timeAgo(item.date)}
            </Text>
          </Row>
          <Text weight="medium" style={styles.body}>
            {item.body}
          </Text>
        </View>

        {/* The unread mark is a dot, not a colour wash across the row — the
            list stays readable and the new ones still stand out. */}
        {fresh && <View style={styles.unread} />}
      </View>
      {!last && <Hairline inset={54} />}
    </View>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyPuck}>
        <Icon name="bell" size={24} color={colors.faint} strokeWidth={1.7} />
      </View>
      <Text weight="bold" style={styles.emptyTitle}>
        Nothing yet
      </Text>
      <Text weight="medium" style={styles.emptyBody}>
        Log a period and the reminders and patterns we spot will turn up here.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { marginTop: 26 },
  groupTitle: {
    fontSize: 11,
    letterSpacing: 1.3,
    color: colors.muted,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 15,
  },
  puck: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  title: { flex: 1, fontSize: 14.5, lineHeight: 20, color: colors.inkSoft },
  time: { fontSize: 11.5, color: colors.faint, marginLeft: 10, marginTop: 2 },
  body: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 19,
    marginTop: 3,
  },
  unread: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand,
    marginLeft: 10,
    marginTop: 7,
  },
  empty: { alignItems: 'center', marginTop: 70 },
  emptyPuck: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.slateTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyTitle: { fontSize: 19, letterSpacing: -0.3 },
  emptyBody: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 30,
  },
  note: {
    fontSize: 11.5,
    color: colors.faint,
    textAlign: 'center',
    marginTop: 34,
  },
});

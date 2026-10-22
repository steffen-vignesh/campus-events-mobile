import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import {
  getMyNotifications, markNotificationRead, markAllNotificationsRead, type DbNotification,
} from "@/lib/db";

export default function NotificationsScreen() {
  const [items, setItems] = useState<DbNotification[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setItems(await getMyNotifications());
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const open = async (n: DbNotification) => {
    if (!n.read) {
      setItems((prev) => (prev ?? []).map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id);
    }
    if (n.event_id) router.push(`/(tabs)/events/${n.event_id}` as never);
  };

  const markAll = async () => {
    setItems((prev) => (prev ?? []).map((x) => ({ ...x, read: true })));
    await markAllNotificationsRead();
  };

  const unread = (items ?? []).filter((n) => !n.read).length;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAll}>
            <Text style={styles.markAll}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {items === null ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4F46E5" />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="notifications-outline" size={44} color="#D1D5DB" />
              <Text style={styles.emptyTxt}>No notifications yet</Text>
              <Text style={styles.emptySub}>Updates about your events will show up here.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, !item.read && styles.cardUnread]} onPress={() => open(item)} activeOpacity={0.7}>
              <View style={[styles.dot, !item.read && styles.dotOn]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, item.read && { color: "#6B7280" }]}>{item.title}</Text>
                <Text style={styles.cardMsg}>{item.message}</Text>
                <Text style={styles.cardTime}>
                  {format(parseISO(item.created_at), "d MMM, h:mm a")}{item.event_id ? "  ·  View event" : ""}
                </Text>
              </View>
              {item.event_id && <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 20, fontWeight: "800", color: "#111827" },
  markAll: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  emptyWrap: { flexGrow: 1, justifyContent: "center" },
  empty: { alignItems: "center", paddingHorizontal: 40 },
  emptyTxt: { fontSize: 16, fontWeight: "700", color: "#6B7280", marginTop: 12 },
  emptySub: { fontSize: 13, color: "#9CA3AF", marginTop: 4, textAlign: "center" },
  card: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F0F0F5" },
  cardUnread: { backgroundColor: "#EEF2FF", borderColor: "#E0E7FF" },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 6, backgroundColor: "transparent" },
  dotOn: { backgroundColor: "#4F46E5" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  cardMsg: { fontSize: 13, color: "#4B5563", marginTop: 3, lineHeight: 18 },
  cardTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
});

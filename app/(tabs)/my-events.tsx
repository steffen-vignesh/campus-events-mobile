import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type Event, isEventPast, getCategoryColor, Category } from "@/lib/mock-data";
import { getAdaptedEvents, getMyRegistrations, getMyBookmarks, addBookmark, removeBookmark } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";
import { EventImage } from "@/components/EventImage";
import { NotificationBell } from "@/components/NotificationBell";

type Tab = "registered" | "bookmarks" | "history";

export default function MyEventsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("registered");
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [attendedEventIds, setAttendedEventIds] = useState<string[]>([]);
  const [waitingEventIds, setWaitingEventIds] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([getAdaptedEvents(), getMyRegistrations(), getMyBookmarks()])
      .then(([events, allRegs, bms]) => {
        setAllEvents(events);
        const regs = allRegs.filter((r) => r.status === "confirmed");
        setWaitingEventIds(allRegs.filter((r) => {
          const evt = events.find((e) => e.id === r.event_id);
          return r.status === "waitlist" && evt && !isEventPast(evt);
        }).map((r) => r.event_id));
        const upcoming = regs.filter((r) => {
          const evt = events.find((e) => e.id === r.event_id);
          return evt && !isEventPast(evt);
        }).map((r) => r.event_id);
        const attended = regs.filter((r) => {
          const evt = events.find((e) => e.id === r.event_id);
          return evt && isEventPast(evt);
        }).map((r) => r.event_id);
        setRegisteredEventIds(upcoming);
        setAttendedEventIds(attended);
        setBookmarks(bms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleBookmark = async (id: string) => {
    const isBookmarked = bookmarks.includes(id);
    setBookmarks((prev) => isBookmarked ? prev.filter((b) => b !== id) : [...prev, id]);
    try {
      if (isBookmarked) await removeBookmark(id);
      else await addBookmark(id);
    } catch {
      setBookmarks((prev) => isBookmarked ? [...prev, id] : prev.filter((b) => b !== id));
    }
  };

  const registeredEvents = allEvents.filter((e) => registeredEventIds.includes(e.id));
  const waitingEvents = allEvents.filter((e) => waitingEventIds.includes(e.id));
  const bookmarkedEvents = allEvents.filter((e) => bookmarks.includes(e.id));
  const attendedEvents = allEvents.filter((e) => attendedEventIds.includes(e.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const current = tab === "registered" ? registeredEvents : tab === "bookmarks" ? bookmarkedEvents : attendedEvents;

  const emptyMsg = {
    registered: { icon: "calendar-outline", title: "No upcoming events", sub: "Register for events to see them here." },
    bookmarks: { icon: "bookmark-outline", title: "Nothing saved", sub: "Bookmark events to find them quickly." },
    history: { icon: "time-outline", title: "No history yet", sub: "Events you've attended will appear here." },
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push("/scan")}>
            <Ionicons name="qr-code-outline" size={18} color="#4F46E5" />
            <Text style={styles.scanBtnTxt}>Scan to Check In</Text>
          </TouchableOpacity>
          <NotificationBell />
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : (
        <>
          {/* Stats */}
          <View style={styles.stats}>
            {[
              { label: "Upcoming", value: registeredEvents.length, icon: "calendar", color: "#4F46E5", bg: "#EEF2FF" },
              { label: "Saved", value: bookmarks.length, icon: "bookmark", color: "#D97706", bg: "#FFFBEB" },
              { label: "Attended", value: attendedEvents.length, icon: "checkmark-circle", color: "#059669", bg: "#ECFDF5" },
            ].map((s) => (
              <View key={s.label} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.bg }]}>
                  <Ionicons name={s.icon as any} size={20} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            {([
              { key: "registered", label: "Upcoming" },
              { key: "bookmarks", label: "Saved" },
              { key: "history", label: "Past" },
            ] as { key: Tab; label: string }[]).map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
                onPress={() => setTab(t.key)}
              >
                <Text style={[styles.tabTxt, tab === t.key && styles.tabTxtActive]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Event list */}
          <FlatList
            data={current}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={tab === "registered" && waitingEvents.length > 0 ? (
              <View style={styles.waitBox}>
                <Text style={styles.waitBoxTitle}>On the waiting list ({waitingEvents.length})</Text>
                {waitingEvents.map((e) => (
                  <TouchableOpacity key={e.id} onPress={() => router.push(`/(tabs)/events/${e.id}`)} accessibilityLabel={`Waiting: ${e.title}`}>
                    <Text style={styles.waitBoxItem} numberOfLines={1}>{e.title}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            renderItem={({ item }) => (
              <MiniEventCard
                event={item}
                isBookmarked={bookmarks.includes(item.id)}
                onBookmark={() => toggleBookmark(item.id)}
                onPress={() => router.push(`/(tabs)/events/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name={emptyMsg[tab].icon as any} size={52} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>{emptyMsg[tab].title}</Text>
                <Text style={styles.emptySub}>{emptyMsg[tab].sub}</Text>
                <TouchableOpacity style={styles.browseBtn} onPress={() => router.push("/(tabs)/events")}>
                  <Text style={styles.browseBtnTxt}>Browse Events</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </>
      )}
    </SafeAreaView>
  );
}

function MiniEventCard({ event, isBookmarked, onBookmark, onPress }: any) {
  const cat = getCategoryColor(event.category);
  const past = isEventPast(event);
  return (
    <TouchableOpacity style={[styles.miniCard, past && { opacity: 0.72 }]} onPress={onPress} activeOpacity={0.85}>
      <EventImage uri={event.bannerImage} style={styles.miniImg} />
      <View style={styles.miniBody}>
        <View style={styles.miniTop}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.catTxt, { color: cat.text }]}>{event.category}</Text>
          </View>
          <TouchableOpacity onPress={onBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={isBookmarked ? "bookmark" : "bookmark-outline"} size={18} color={isBookmarked ? "#4F46E5" : "#9CA3AF"} />
          </TouchableOpacity>
        </View>
        <Text style={styles.miniTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.miniMeta}>
          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
          <Text style={styles.miniMetaTxt}>{format(new Date(event.date), "MMM d, yyyy")} · {event.time}</Text>
        </View>
        <View style={styles.miniMeta}>
          <Ionicons name="location-outline" size={12} color="#9CA3AF" />
          <Text style={styles.miniMetaTxt} numberOfLines={1}>{event.venue}</Text>
        </View>
        <Text style={styles.feeTxt}>
          {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827" },
  waitBox: { backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 16, padding: 14, marginBottom: 12, gap: 6 },
  waitBoxTitle: { fontSize: 13.5, fontWeight: "800", color: "#92400E" },
  waitBoxItem: { fontSize: 13.5, color: "#B45309", fontWeight: "600", paddingVertical: 3 },
  scanBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#EEF2FF", borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 },
  scanBtnTxt: { fontSize: 12, fontWeight: "700", color: "#4F46E5" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  stats: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 12, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  tabBar: { flexDirection: "row", marginHorizontal: 20, backgroundColor: "#E5E7EB", borderRadius: 14, padding: 3, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, borderRadius: 11, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#4F46E5" },
  tabTxt: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  tabTxtActive: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  miniCard: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  miniImg: { width: 100, height: 110, resizeMode: "cover" },
  miniBody: { flex: 1, padding: 12 },
  miniTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  catBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  catTxt: { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  miniTitle: { fontSize: 14, fontWeight: "700", color: "#111827", lineHeight: 20, marginBottom: 6 },
  miniMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 3 },
  miniMetaTxt: { fontSize: 11, color: "#9CA3AF", flex: 1 },
  feeTxt: { fontSize: 13, fontWeight: "700", color: "#4F46E5", marginTop: 4 },
  empty: { alignItems: "center", paddingVertical: 56, paddingHorizontal: 32 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: "#374151", marginTop: 14 },
  emptySub: { fontSize: 13, color: "#9CA3AF", textAlign: "center", marginTop: 6, lineHeight: 20 },
  browseBtn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 20 },
  browseBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
});

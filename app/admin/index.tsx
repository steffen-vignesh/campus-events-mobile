import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  SafeAreaView, Image,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { MOCK_EVENTS, MOCK_REGISTRANTS, isEventPast } from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";

export default function AdminDashboard() {
  const { user, logout } = useAuth();

  const totalViews = MOCK_EVENTS.reduce((s, e) => s + e.views, 0);
  const totalRegs = MOCK_EVENTS.reduce((s, e) => s + e.registrations, 0);
  const upcomingCount = MOCK_EVENTS.filter((e) => !isEventPast(e)).length;
  const avgFill = Math.round(
    (MOCK_EVENTS.reduce((s, e) => s + e.registrations / e.capacity, 0) / MOCK_EVENTS.length) * 100
  );

  const recentRegistrants = [...MOCK_REGISTRANTS]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

  const upcomingEvents = MOCK_EVENTS.filter((e) => !isEventPast(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning, {user?.name.split(" ")[0]} 👋</Text>
            <Text style={styles.sub}>Here's what's happening across your events.</Text>
          </View>
          <TouchableOpacity style={styles.newBtn} onPress={() => router.push("/admin/events/new")}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Total Views", value: totalViews.toLocaleString(), icon: "eye", color: "#2563EB", bg: "#EFF6FF" },
            { label: "Registrations", value: totalRegs.toLocaleString(), icon: "people", color: "#059669", bg: "#ECFDF5" },
            { label: "Upcoming", value: String(upcomingCount), icon: "calendar", color: "#4F46E5", bg: "#EEF2FF" },
            { label: "Avg Fill", value: `${avgFill}%`, icon: "trending-up", color: "#D97706", bg: "#FFFBEB" },
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

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickRow}>
            {[
              { label: "All Events", icon: "list", onPress: () => router.push("/admin/events") },
              { label: "New Event", icon: "add-circle", onPress: () => router.push("/admin/events/new") },
              { label: "Sign Out", icon: "log-out", onPress: () => { logout(); router.replace("/login"); } },
            ].map((a) => (
              <TouchableOpacity key={a.label} style={styles.quickBtn} onPress={a.onPress}>
                <View style={styles.quickIcon}>
                  <Ionicons name={a.icon as any} size={22} color="#4F46E5" />
                </View>
                <Text style={styles.quickLabel}>{a.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Upcoming Events */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
            <TouchableOpacity onPress={() => router.push("/admin/events")}>
              <Text style={styles.seeAll}>See all</Text>
            </TouchableOpacity>
          </View>
          {upcomingEvents.map((event) => {
            const fillPct = Math.round((event.registrations / event.capacity) * 100);
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventRow}
                onPress={() => router.push(`/admin/events/${event.id}`)}
              >
                <Image source={{ uri: event.bannerImage }} style={styles.eventThumb} />
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle} numberOfLines={1}>{event.title}</Text>
                  <Text style={styles.eventDate}>
                    {format(new Date(event.date), "MMM d, yyyy")} · {event.time}
                  </Text>
                  <View style={styles.fillRow}>
                    <View style={styles.fillBg}>
                      <View
                        style={[styles.fillBar, {
                          width: `${Math.min(fillPct, 100)}%` as any,
                          backgroundColor: fillPct >= 90 ? "#EF4444" : fillPct >= 70 ? "#F59E0B" : "#4F46E5",
                        }]}
                      />
                    </View>
                    <Text style={styles.fillTxt}>{event.registrations}/{event.capacity}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Registrations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Registrations</Text>
          {recentRegistrants.map((r) => {
            const event = MOCK_EVENTS.find((e) => e.id === r.eventId);
            return (
              <View key={r.id} style={styles.regRow}>
                <View style={styles.regAvatar}>
                  <Text style={styles.regAvatarTxt}>
                    {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.regInfo}>
                  <Text style={styles.regName}>{r.name}</Text>
                  <Text style={styles.regEvent} numberOfLines={1}>{event?.title}</Text>
                  <Text style={styles.regMeta}>{r.year} · {r.department}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 12, color: "#9CA3AF", marginTop: 3 },
  newBtn: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: { width: "47%", backgroundColor: "#fff", borderRadius: 16, padding: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 12 },
  seeAll: { fontSize: 13, color: "#4F46E5", fontWeight: "600" },
  quickRow: { flexDirection: "row", gap: 10 },
  quickBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, alignItems: "center", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  quickLabel: { fontSize: 11, fontWeight: "700", color: "#374151" },
  eventRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  eventThumb: { width: 52, height: 52, borderRadius: 12, resizeMode: "cover", marginRight: 12 },
  eventInfo: { flex: 1 },
  eventTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  eventDate: { fontSize: 12, color: "#9CA3AF", marginTop: 3, marginBottom: 6 },
  fillRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  fillBg: { flex: 1, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  fillBar: { height: 4, borderRadius: 2 },
  fillTxt: { fontSize: 10, color: "#9CA3AF" },
  regRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 8, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  regAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  regAvatarTxt: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  regInfo: { flex: 1 },
  regName: { fontSize: 13, fontWeight: "700", color: "#111827" },
  regEvent: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  regMeta: { fontSize: 11, color: "#9CA3AF" },
});

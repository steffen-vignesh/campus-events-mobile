import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { type Event, isEventPast } from "@/lib/mock-data";
import { getAdaptedEvents } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";
import { EventImage } from "@/components/EventImage";
import { NotificationBell } from "@/components/NotificationBell";

const go = (path: string) => router.push(path as any);

// Organizer home: one big button to create, the next event with its quick actions, then the list.
export default function OrganizerHome() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      getAdaptedEvents().then(setEvents).catch(console.error).finally(() => setLoading(false));
    }, [])
  );

  const upcoming = events.filter((e) => !isEventPast(e)).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events.filter((e) => isEventPast(e)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const next = upcoming[0];
  const totalRegs = events.reduce((s, e) => s + e.registrations, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.hi}>Hi {user?.name.split(" ")[0]} 👋</Text>
            <Text style={styles.sub}>Organizer · Spirits</Text>
          </View>
          <NotificationBell />
          <TouchableOpacity style={styles.signOut} onPress={() => { logout(); router.replace("/login"); }} accessibilityLabel="Sign out">
            <Ionicons name="log-out-outline" size={22} color="#6B7280" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.create} onPress={() => go("/admin/events/new")} activeOpacity={0.85} accessibilityLabel="Create event">
          <View style={styles.createIcon}><Ionicons name="add" size={30} color="#4F46E5" /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createTitle}>Create a new event</Text>
            <Text style={styles.createSub}>Add title, date and photo. Takes a minute.</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>

        {loading ? (
          <View style={{ paddingVertical: 50 }}><ActivityIndicator size="large" color="#4F46E5" /></View>
        ) : (
          <>
            {next && (
              <View style={styles.nextCard}>
                <Text style={styles.sectionLabel}>Your next event</Text>
                <TouchableOpacity onPress={() => go(`/admin/events/${next.id}`)} activeOpacity={0.85}>
                  <EventImage uri={next.bannerImage} style={styles.nextBanner} fit="contain" />
                  <Text style={styles.nextTitle}>{next.title}</Text>
                  <Text style={styles.nextMeta}>{format(parseISO(next.date), "EEE, d MMM")} · {next.time} · {next.registrations} registered</Text>
                </TouchableOpacity>
                <View style={styles.quickRow}>
                  {([
                    ["qr-code", "Check-in", "checkin"],
                    ["people", "Guests", "registrants"],
                    ["megaphone", "Notify", "announce"],
                    ["star", "Survey", "survey"],
                  ] as const).map(([icon, label, path]) => (
                    <TouchableOpacity key={path} style={styles.quick} onPress={() => go(`/admin/events/${next.id}/${path}`)} accessibilityLabel={label}>
                      <View style={styles.quickIcon}><Ionicons name={icon} size={22} color="#4F46E5" /></View>
                      <Text style={styles.quickTxt}>{label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <Text style={styles.sectionLabel}>Tools</Text>
            <View style={styles.tools}>
              {([
                ["people", "#059669", "#ECFDF5", "Students", "Search, notify, reset password", "/admin/students"],
                ["briefcase", "#2563EB", "#EFF6FF", "Jobs", "Post jobs, see applicants", "/admin/jobs"],
                ["megaphone", "#D97706", "#FFFBEB", "Announcements", "Notify many students", "/admin/announcements"],
                ["bar-chart", "#7C3AED", "#F5F3FF", "Reports", "How events are doing", "/admin/reports"],
                ["checkmark-done", "#0891B2", "#ECFEFF", "Attendance", "Who showed up", "/admin/attendance"],
                ["person-circle", "#6B7280", "#F3F4F6", "My profile", "Name, password, sign out", "/admin/profile"],
                ...(user?.role === "super_admin" ? [["shield-checkmark", "#4F46E5", "#EEF2FF", "Organizers", "Add or see organizers", "/admin/organizers"]] : []),
              ] as [keyof typeof Ionicons.glyphMap, string, string, string, string, string][]).map(([icon, color, bg, label, hint, path]) => (
                <TouchableOpacity key={label} style={styles.tool} onPress={() => go(path)} activeOpacity={0.8} accessibilityLabel={label}>
                  <View style={[styles.toolIcon, { backgroundColor: bg }]}><Ionicons name={icon} size={24} color={color} /></View>
                  <Text style={styles.toolTitle}>{label}</Text>
                  <Text style={styles.toolHint}>{hint}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statV}>{upcoming.length}</Text><Text style={styles.statL}>Upcoming</Text></View>
              <View style={styles.stat}><Text style={styles.statV}>{totalRegs}</Text><Text style={styles.statL}>Registrations</Text></View>
              <View style={styles.stat}><Text style={styles.statV}>{past.length}</Text><Text style={styles.statL}>Past</Text></View>
            </View>

            <Text style={styles.sectionLabel}>All your events</Text>
            {events.length === 0 && <Text style={styles.empty}>No events yet. Tap “Create a new event” to start.</Text>}
            {[...upcoming, ...past].map((e) => (
              <TouchableOpacity key={e.id} style={styles.row} onPress={() => go(`/admin/events/${e.id}`)} activeOpacity={0.8}>
                <EventImage uri={e.bannerImage} style={styles.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle} numberOfLines={2}>{e.title}</Text>
                  <Text style={styles.rowMeta}>{format(parseISO(e.date), "d MMM yyyy")} · {e.registrations} registered{isEventPast(e) ? " · Done" : ""}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 14, paddingBottom: 16 },
  hi: { fontSize: 22, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 12.5, color: "#6B7280", marginTop: 2 },
  signOut: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  create: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#4F46E5", borderRadius: 22, padding: 18, marginBottom: 20 },
  createIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  createTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  createSub: { color: "#C7D2FE", fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 14, fontWeight: "800", color: "#111827", marginBottom: 10 },
  nextCard: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: "#EEF0F6" },
  nextBanner: { width: "100%", height: 130, borderRadius: 14, marginBottom: 10, overflow: "hidden" },
  nextTitle: { fontSize: 16.5, fontWeight: "800", color: "#111827", lineHeight: 22 },
  nextMeta: { fontSize: 13, color: "#6B7280", marginTop: 3, marginBottom: 14 },
  quickRow: { flexDirection: "row", gap: 8 },
  quick: { flex: 1, alignItems: "center", gap: 6, paddingVertical: 10, borderRadius: 16, backgroundColor: "#F5F6FF" },
  quickIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  quickTxt: { fontSize: 12, fontWeight: "700", color: "#374151" },
  tools: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  tool: { width: "48%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#EEF0F6", minHeight: 118 },
  toolIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  toolTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  toolHint: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 16 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#EEF0F6" },
  statV: { fontSize: 22, fontWeight: "800", color: "#4F46E5" },
  statL: { fontSize: 11.5, color: "#6B7280", marginTop: 2 },
  empty: { fontSize: 13.5, color: "#6B7280", paddingVertical: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 18, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#EEF0F6" },
  thumb: { width: 56, height: 56, borderRadius: 12 },
  rowTitle: { fontSize: 14.5, fontWeight: "700", color: "#111827" },
  rowMeta: { fontSize: 12, color: "#6B7280", marginTop: 3 },
});

import { useState, useEffect } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Share, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type Event } from "@/lib/mock-data";
import { type DbRegistration, getAdaptedEvent, getEventRegistrations, toggleAttendance } from "@/lib/db";

export default function RegistrantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrants, setRegistrants] = useState<DbRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!id) return;
    Promise.all([getAdaptedEvent(id), getEventRegistrations(id)])
      .then(([evt, regs]) => {
        setEvent(evt);
        setRegistrants(regs);
        setAttendance(Object.fromEntries(regs.map((r) => [r.id, r.attended])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleToggleAttendance = async (regId: string) => {
    const next = !attendance[regId];
    setAttendance((prev) => ({ ...prev, [regId]: next }));
    try {
      await toggleAttendance(regId, next);
    } catch {
      setAttendance((prev) => ({ ...prev, [regId]: !next }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><Text style={styles.notFoundTxt}>Event not found.</Text></View>
      </SafeAreaView>
    );
  }

  const filtered = registrants.filter(
    (r) =>
      r.student_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_email.toLowerCase().includes(search.toLowerCase()) ||
      (r.student_department ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const attendedCount = Object.values(attendance).filter(Boolean).length;

  const handleExport = () => {
    const lines = ["Name,Email,Year,Department,Attended"];
    registrants.forEach((r) => {
      lines.push(`${r.student_name},${r.student_email},${r.student_year ?? ""},${r.student_department ?? ""},${attendance[r.id] ? "Yes" : "No"}`);
    });
    Share.share({ message: lines.join("\n"), title: `${event.title} Registrants` });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Registrants</Text>
          <Text style={styles.sub} numberOfLines={1}>{event.title}</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
          <Ionicons name="share-outline" size={20} color="#4F46E5" />
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: "Total", value: registrants.length, color: "#4F46E5", bg: "#EEF2FF" },
          { label: "Attended", value: attendedCount, color: "#059669", bg: "#ECFDF5" },
          { label: "No-show", value: registrants.length - attendedCount, color: "#9CA3AF", bg: "#F3F4F6" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search registrants..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Registrant list */}
      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: r }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTxt}>{r.student_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.student_name}</Text>
                <Text style={styles.email}>{r.student_email}</Text>
                <Text style={styles.meta}>{r.student_year ?? ""}{r.student_year && r.student_department ? " · " : ""}{r.student_department ?? ""}</Text>
                <Text style={styles.date}>{format(new Date(r.registered_at), "MMM d, HH:mm")}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.attBtn, attendance[r.id] ? styles.attBtnActive : styles.attBtnInactive]}
              onPress={() => handleToggleAttendance(r.id)}
            >
              <Ionicons
                name={attendance[r.id] ? "checkmark-circle" : "ellipse-outline"}
                size={20}
                color={attendance[r.id] ? "#059669" : "#9CA3AF"}
              />
              <Text style={[styles.attTxt, { color: attendance[r.id] ? "#059669" : "#9CA3AF" }]}>
                {attendance[r.id] ? "Present" : "Mark"}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          registrants.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTxt}>No registrations yet</Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.emptyTxt}>No results found</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 48 },
  notFoundTxt: { fontSize: 16, color: "#6B7280" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 12, color: "#9CA3AF" },
  exportBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 14 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 20, marginBottom: 10, paddingRight: 12 },
  searchIcon: { paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: "#111827" },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 10, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  rowLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  name: { fontSize: 13, fontWeight: "700", color: "#111827" },
  email: { fontSize: 11, color: "#9CA3AF", marginTop: 1 },
  meta: { fontSize: 11, color: "#9CA3AF" },
  date: { fontSize: 10, color: "#D1D5DB", marginTop: 2 },
  attBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12 },
  attBtnActive: { backgroundColor: "#ECFDF5" },
  attBtnInactive: { backgroundColor: "#F3F4F6" },
  attTxt: { fontSize: 12, fontWeight: "600" },
  emptyTxt: { fontSize: 15, color: "#9CA3AF", marginTop: 12 },
});

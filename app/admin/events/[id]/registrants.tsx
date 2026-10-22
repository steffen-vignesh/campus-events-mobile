import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, Share, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type Event } from "@/lib/mock-data";
import { type DbRegistration, getAdaptedEvent, getEventRegistrations, toggleAttendance, moveToRegistered } from "@/lib/db";

export default function RegistrantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrants, setRegistrants] = useState<DbRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [view, setView] = useState<"registered" | "waiting" | "cancelled">("registered");
  const [moving, setMoving] = useState<string | null>(null);

  const load = () =>
    Promise.all([getAdaptedEvent(id!), getEventRegistrations(id!)])
      .then(([evt, regs]) => {
        setEvent(evt);
        setRegistrants(regs);
        setAttendance(Object.fromEntries(regs.map((r) => [r.id, r.attended])));
      })
      .catch(console.error)
      .finally(() => setLoading(false));

  useEffect(() => {
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Three groups: people with a seat, people waiting (in join order), and people who cancelled (newest first).
  const confirmedList = registrants.filter((r) => r.status === "confirmed");
  const waitingList = registrants.filter((r) => r.status === "waitlist")
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());
  const cancelledList = registrants.filter((r) => r.status === "cancelled")
    .sort((a, b) => new Date(b.cancelled_at ?? 0).getTime() - new Date(a.cancelled_at ?? 0).getTime());
  const matches = (r: DbRegistration) =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.student_email.toLowerCase().includes(search.toLowerCase()) ||
    (r.student_department ?? "").toLowerCase().includes(search.toLowerCase());
  const shown = (view === "registered" ? confirmedList : view === "waiting" ? waitingList : cancelledList).filter(matches);
  const attendedCount = confirmedList.filter((r) => attendance[r.id]).length;
  const isFull = event.registrations >= event.capacity;

  const moveUp = (r: DbRegistration) => {
    const run = async () => {
      setMoving(r.id);
      try {
        await moveToRegistered(r.id);
        await load();
      } catch (e: any) {
        Alert.alert("Could not move", e.message ?? "Please try again.");
      } finally {
        setMoving(null);
      }
    };
    Alert.alert(
      "Move to registered?",
      isFull
        ? `The event is full (${event.registrations}/${event.capacity}). Move ${r.student_name} up anyway?`
        : `${r.student_name} gets a seat and a notification.`,
      [{ text: "Not now", style: "cancel" }, { text: "Move up", onPress: run }]
    );
  };
  const handleExport = () => {
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const lines = [["Name", "Email", "Year", "Department", "Attended", "Status", "Cancel reason"].map(q).join(",")];
    [...confirmedList, ...waitingList, ...cancelledList].forEach((r) => {
      lines.push([
        r.student_name, r.student_email, r.student_year ?? "", r.student_department ?? "", attendance[r.id] ? "Yes" : "No",
        r.status === "confirmed" ? "Registered" : r.status === "waitlist" ? "Waiting" : "Cancelled", r.cancel_reason ?? "",
      ].map((v) => q(String(v))).join(","));
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
          { label: "Registered", value: confirmedList.length, color: "#4F46E5", bg: "#EEF2FF", go: "registered" as const },
          { label: "Attended", value: attendedCount, color: "#059669", bg: "#ECFDF5", go: "registered" as const },
          { label: "Waiting", value: waitingList.length, color: "#B45309", bg: "#FFFBEB", go: "waiting" as const },
          { label: "Cancelled", value: cancelledList.length, color: "#DC2626", bg: "#FEF2F2", go: "cancelled" as const },
        ].map((s) => (
          <TouchableOpacity key={s.label} style={[styles.statCard, { backgroundColor: s.bg }]} onPress={() => setView(s.go)} accessibilityLabel={s.label}>
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Which list to show */}
      <View style={styles.segment}>
        {([["registered", `Registered (${confirmedList.length})`], ["waiting", `Waiting (${waitingList.length})`], ["cancelled", `Cancelled (${cancelledList.length})`]] as const).map(([k, label]) => (
          <TouchableOpacity key={k} style={[styles.segBtn, view === k && styles.segBtnOn]} onPress={() => setView(k)}>
            <Text style={[styles.segTxt, view === k && styles.segTxtOn]}>{label}</Text>
          </TouchableOpacity>
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
        data={shown}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: r }) => view === "waiting" ? (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={[styles.avatar, { backgroundColor: "#FFFBEB" }]}>
                <Text style={[styles.avatarTxt, { color: "#B45309" }]}>#{waitingList.indexOf(r) + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.student_name}</Text>
                <Text style={styles.email}>{r.student_email}</Text>
                <Text style={styles.date}>Joined {format(new Date(r.registered_at), "MMM d, HH:mm")}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.moveBtn} onPress={() => moveUp(r)} disabled={moving === r.id} accessibilityLabel={`Move ${r.student_name} to registered`}>
              {moving === r.id ? <ActivityIndicator color="#fff" /> : <Text style={styles.moveTxt}>Move up</Text>}
            </TouchableOpacity>
          </View>
        ) : view === "cancelled" ? (
          <View style={[styles.row, { alignItems: "flex-start" }]}>
            <View style={styles.rowLeft}>
              <View style={[styles.avatar, { backgroundColor: "#FEF2F2" }]}>
                <Ionicons name="close" size={18} color="#DC2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{r.student_name}</Text>
                <Text style={styles.email}>{r.student_email}</Text>
                <Text style={styles.reason}>{r.cancel_reason ? `“${r.cancel_reason}”` : "No reason given"}</Text>
                <Text style={styles.date}>
                  {r.cancelled_at ? format(new Date(r.cancelled_at), "MMM d, HH:mm") : ""} · {r.cancelled_from === "waitlist" ? "Was waiting" : "Was registered"}
                </Text>
              </View>
            </View>
          </View>
        ) : (
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
          shown.length === 0 && (view === "registered" ? confirmedList : view === "waiting" ? waitingList : cancelledList).length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTxt}>{view === "registered" ? "No registrations yet" : view === "waiting" ? "Nobody is waiting" : "No cancellations"}</Text>
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
  segment: { flexDirection: "row", marginHorizontal: 20, marginBottom: 10, backgroundColor: "#EEF2FF", borderRadius: 14, padding: 3 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: "center" },
  segBtnOn: { backgroundColor: "#4F46E5" },
  segTxt: { fontSize: 11.5, fontWeight: "700", color: "#6B7280" },
  segTxtOn: { color: "#fff" },
  moveBtn: { backgroundColor: "#4F46E5", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, minWidth: 78, alignItems: "center" },
  moveTxt: { color: "#fff", fontWeight: "800", fontSize: 12.5 },
  reason: { fontSize: 12.5, color: "#374151", marginTop: 3, lineHeight: 18 },
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

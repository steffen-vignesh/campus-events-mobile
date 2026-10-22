import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { type Event, isEventPast } from "@/lib/mock-data";
import { getAdaptedEvents, getEventSeatRegistrations } from "@/lib/db";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, Chips, Empty } from "@/components/StaffUI";

type Row = { event: Event; regs: number; attended: number };
type Filter = "all" | "upcoming" | "past";

export default function AttendanceScreen() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    getAdaptedEvents().then(async (events) => {
      const built = await Promise.all(events.map(async (event) => {
        const regs = await getEventSeatRegistrations(event.id).catch(() => []);
        return { event, regs: regs.length, attended: regs.filter((r) => r.attended).length };
      }));
      setRows(built.sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime()));
    }).catch(() => setRows([]));
  }, []);

  const shown = (rows ?? []).filter((r) => filter === "all" || (filter === "past" ? isEventPast(r.event) : !isEventPast(r.event)));

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Attendance" subtitle="Who showed up, event by event" />
      <View style={styles.pad}>
        <Chips<Filter> options={[{ key: "all", label: "All" }, { key: "upcoming", label: "Upcoming" }, { key: "past", label: "Past" }]} value={filter} onChange={setFilter} />
      </View>
      {rows === null ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r.event.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Empty icon="checkmark-done-outline" title="No events here" />}
          renderItem={({ item: r }) => {
            const pct = r.regs ? Math.round((r.attended / r.regs) * 100) : 0;
            return (
              <TouchableOpacity onPress={() => router.push(`/admin/events/${r.event.id}/registrants` as any)} activeOpacity={0.85}>
                <Card>
                  <Text style={styles.title} numberOfLines={2}>{r.event.title}</Text>
                  <Text style={styles.meta}>{format(parseISO(r.event.date), "d MMM yyyy")}</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.bar}><View style={[styles.fill, { width: `${pct}%` }]} /></View>
                      <Text style={styles.nums}>{r.attended} of {r.regs} checked in</Text>
                    </View>
                    <Text style={styles.pct}>{pct}%</Text>
                    <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  pad: { paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  title: { fontSize: 15, fontWeight: "800", color: "#111827", lineHeight: 20 },
  meta: { fontSize: 12.5, color: "#6B7280", marginTop: 3, marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  bar: { height: 7, borderRadius: 4, backgroundColor: "#E5E7EB" },
  fill: { height: 7, borderRadius: 4, backgroundColor: "#059669" },
  nums: { fontSize: 12, color: "#6B7280", marginTop: 6 },
  pct: { fontSize: 18, fontWeight: "800", color: "#059669" },
});

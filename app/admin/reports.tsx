import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { format, parseISO } from "date-fns";
import { type Event, isEventPast } from "@/lib/mock-data";
import { getAdaptedEvents, getEventSeatRegistrations, getEventSurveys } from "@/lib/db";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, Empty } from "@/components/StaffUI";

type Row = { event: Event; regs: number; attended: number; rating: number | null; responses: number };

export default function ReportsScreen() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    getAdaptedEvents().then(async (events) => {
      const built = await Promise.all(events.map(async (event) => {
        const regs = await getEventSeatRegistrations(event.id).catch(() => []);
        const surveys = await getEventSurveys(event.id).catch(() => []);
        return {
          event,
          regs: regs.length,
          attended: regs.filter((r) => r.attended).length,
          responses: surveys.length,
          rating: surveys.length ? +(surveys.reduce((a, s) => a + s.rating, 0) / surveys.length).toFixed(1) : null,
        };
      }));
      setRows(built.sort((a, b) => new Date(b.event.date).getTime() - new Date(a.event.date).getTime()));
    }).catch(() => setRows([]));
  }, []);

  if (rows === null) return <SafeAreaView style={styles.safe}><StaffHeader title="Reports" /><View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View></SafeAreaView>;

  const totalRegs = rows.reduce((a, r) => a + r.regs, 0);
  const totalAttended = rows.reduce((a, r) => a + r.attended, 0);
  const rated = rows.filter((r) => r.rating !== null);
  const avg = rated.length ? (rated.reduce((a, r) => a + (r.rating as number), 0) / rated.length).toFixed(1) : "–";
  const rate = totalRegs ? Math.round((totalAttended / totalRegs) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Reports" subtitle="How your events are doing" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.stats}>
          {[[String(rows.length), "Events"], [String(totalRegs), "Registrations"], [`${rate}%`, "Attendance rate"], [avg === "–" ? "–" : `${avg} ★`, "Average rating"]].map(([v, l]) => (
            <View key={l} style={styles.stat}><Text style={styles.statV}>{v}</Text><Text style={styles.statL}>{l}</Text></View>
          ))}
        </View>
        <Text style={styles.section}>All events</Text>
        {rows.length === 0 ? <Empty icon="bar-chart-outline" title="No events yet" /> : rows.map((r) => {
          const fill = r.event.capacity ? Math.min(100, Math.round((r.regs / r.event.capacity) * 100)) : 0;
          return (
            <TouchableOpacity key={r.event.id} onPress={() => router.push(`/admin/events/${r.event.id}` as any)} activeOpacity={0.85}>
              <Card>
                <View style={styles.head}>
                  <Text style={styles.title} numberOfLines={2}>{r.event.title}</Text>
                  <View style={[styles.badge, isEventPast(r.event) ? styles.badgeDone : styles.badgeUp]}>
                    <Text style={[styles.badgeTxt, { color: isEventPast(r.event) ? "#6B7280" : "#3730A3" }]}>{isEventPast(r.event) ? "Done" : "Upcoming"}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>{format(parseISO(r.event.date), "d MMM yyyy")} · {r.event.venue}</Text>
                <View style={styles.bar}><View style={[styles.barFill, { width: `${fill}%`, backgroundColor: fill >= 90 ? "#EF4444" : fill >= 70 ? "#F59E0B" : "#4F46E5" }]} /></View>
                <View style={styles.nums}>
                  <Text style={styles.num}><Text style={styles.numB}>{r.regs}</Text>/{r.event.capacity} seats</Text>
                  <Text style={styles.num}><Text style={styles.numB}>{r.attended}</Text> attended</Text>
                  <Text style={styles.num}><Text style={styles.numB}>{r.rating ?? "–"}</Text>{r.rating ? " ★" : ""} ({r.responses})</Text>
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 18 },
  stat: { width: "47.5%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#EEF0F6" },
  statV: { fontSize: 26, fontWeight: "800", color: "#4F46E5" },
  statL: { fontSize: 12.5, color: "#6B7280", marginTop: 2 },
  section: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 10 },
  head: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  title: { flex: 1, fontSize: 15, fontWeight: "800", color: "#111827", lineHeight: 20 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  badgeUp: { backgroundColor: "#EEF2FF" },
  badgeDone: { backgroundColor: "#F3F4F6" },
  badgeTxt: { fontSize: 11, fontWeight: "800" },
  meta: { fontSize: 12.5, color: "#6B7280", marginTop: 4, marginBottom: 10 },
  bar: { height: 6, borderRadius: 3, backgroundColor: "#E5E7EB", marginBottom: 10 },
  barFill: { height: 6, borderRadius: 3 },
  nums: { flexDirection: "row", justifyContent: "space-between" },
  num: { fontSize: 12.5, color: "#6B7280" },
  numB: { fontWeight: "800", color: "#111827" },
});

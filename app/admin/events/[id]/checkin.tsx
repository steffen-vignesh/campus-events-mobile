import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type Event } from "@/lib/mock-data";
import { getAdaptedEvent, getEventSeatRegistrations } from "@/lib/db";
import { WEB_URL } from "@/lib/config";
import { StaffHeader } from "@/components/StaffHeader";
import { QrCode } from "@/components/QrCode";

// Full-screen QR for the door: students scan it with the Spirits app.
export default function CheckInScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [registered, setRegistered] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const url = `${WEB_URL}/attend/${id}`;

  useEffect(() => {
    if (!id) return;
    getAdaptedEvent(id).then(setEvent).catch(() => {});
    const load = () =>
      getEventSeatRegistrations(id)
        .then((r) => { setRegistered(r.length); setCheckedIn(r.filter((x) => x.attended).length); })
        .catch(() => {});
    load();
    const t = setInterval(load, 8000); // live counter while people arrive
    return () => clearInterval(t);
  }, [id]);

  const pct = registered ? Math.round((checkedIn / registered) * 100) : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Check-in QR" subtitle={event?.title} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.qrCard}>
          <QrCode value={url} size={270} />
          <Text style={styles.qrHint}>Students: open Spirits → My Events → Scan to Check In → point here</Text>
        </View>

        <View style={styles.counter}>
          <Text style={styles.counterNum}>{checkedIn}<Text style={styles.counterOf}> / {registered}</Text></Text>
          <Text style={styles.counterLbl}>checked in</Text>
          <View style={styles.bar}><View style={[styles.barFill, { width: `${pct}%` }]} /></View>
        </View>

        <TouchableOpacity style={styles.btn} onPress={() => Share.share({ message: `Check in for ${event?.title ?? "the event"}: ${url}` })}>
          <Ionicons name="share-outline" size={20} color="#4F46E5" />
          <Text style={styles.btnTxt}>Send check-in link</Text>
        </TouchableOpacity>
        <Text style={styles.note}>No phone? Mark people by hand in Registrations.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, alignItems: "stretch" },
  qrCard: { backgroundColor: "#fff", borderRadius: 24, padding: 22, alignItems: "center", gap: 16, borderWidth: 1, borderColor: "#EEF0F6" },
  qrHint: { fontSize: 13.5, color: "#4B5563", textAlign: "center", lineHeight: 20 },
  counter: { marginTop: 16, backgroundColor: "#4F46E5", borderRadius: 20, padding: 18, alignItems: "center" },
  counterNum: { fontSize: 40, fontWeight: "800", color: "#fff" },
  counterOf: { fontSize: 22, fontWeight: "600", color: "#C7D2FE" },
  counterLbl: { fontSize: 13, color: "#C7D2FE", marginBottom: 12 },
  bar: { alignSelf: "stretch", height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.25)" },
  barFill: { height: 8, borderRadius: 4, backgroundColor: "#fff" },
  btn: { marginTop: 16, flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2FF", borderRadius: 16, paddingVertical: 15 },
  btnTxt: { fontSize: 15, fontWeight: "700", color: "#4F46E5" },
  note: { fontSize: 12.5, color: "#9CA3AF", textAlign: "center", marginTop: 12 },
});

import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { type Event } from "@/lib/mock-data";
import { getAdaptedEvent, getEventRegistrations, getEventSurveys } from "@/lib/db";
import { WEB_URL } from "@/lib/config";
import { StaffHeader } from "@/components/StaffHeader";
import { EventImage } from "@/components/EventImage";

type Tile = { key: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; title: string; hint: string; onPress: () => void };

// One screen per event with a big button for everything an organizer does.
export default function EventHub() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [registered, setRegistered] = useState(0);
  const [checkedIn, setCheckedIn] = useState(0);
  const [responses, setResponses] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
      getEventRegistrations(id).then((r) => { setRegistered(r.length); setCheckedIn(r.filter((x) => x.attended).length); }).catch(() => {});
      getEventSurveys(id).then((s) => setResponses(s.length)).catch(() => {});
    }, [id])
  );

  if (event === undefined) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View></SafeAreaView>;
  }
  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <StaffHeader title="Event not found" />
      </SafeAreaView>
    );
  }

  const go = (path: string) => () => router.push(`/admin/events/${id}/${path}` as any);
  const tiles: Tile[] = [
    { key: "qr", icon: "qr-code", color: "#4F46E5", bg: "#EEF2FF", title: "Check-in QR", hint: `${checkedIn} of ${registered} checked in`, onPress: go("checkin") },
    { key: "reg", icon: "people", color: "#059669", bg: "#ECFDF5", title: "Registrations", hint: `${registered} registered`, onPress: go("registrants") },
    { key: "ann", icon: "megaphone", color: "#D97706", bg: "#FFFBEB", title: "Notify students", hint: "Send an update", onPress: go("announce") },
    { key: "sur", icon: "star", color: "#DB2777", bg: "#FDF2F8", title: "Survey", hint: `${responses} responses`, onPress: go("survey") },
    {
      key: "share", icon: "share-social", color: "#2563EB", bg: "#EFF6FF", title: "Share event", hint: "Send the link",
      onPress: () => Share.share({ message: `${event.title} – ${format(parseISO(event.date), "EEE d MMM")} · ${event.time}\n${WEB_URL}/student/events/${id}` }),
    },
    { key: "edit", icon: "create", color: "#6B7280", bg: "#F3F4F6", title: "Edit details", hint: "Title, date, venue", onPress: go("edit") },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Manage event" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.eventCard}>
          <EventImage uri={event.bannerImage} style={styles.banner} fit="contain" />
          <View style={{ padding: 14 }}>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventMeta}>{format(parseISO(event.date), "EEE, d MMM yyyy")} · {event.time}</Text>
            <Text style={styles.eventMeta} numberOfLines={1}>{event.venue}</Text>
          </View>
        </View>

        <View style={styles.grid}>
          {tiles.map((t) => (
            <TouchableOpacity key={t.key} style={styles.tile} onPress={t.onPress} activeOpacity={0.8} accessibilityLabel={t.title}>
              <View style={[styles.tileIcon, { backgroundColor: t.bg }]}>
                <Ionicons name={t.icon} size={28} color={t.color} />
              </View>
              <Text style={styles.tileTitle}>{t.title}</Text>
              <Text style={styles.tileHint}>{t.hint}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.steps}>
          <Text style={styles.stepsTitle}>Event day in 3 steps</Text>
          {[
            ["1", "Before", "Send a reminder with Notify students."],
            ["2", "At the door", "Open Check-in QR and let students scan it."],
            ["3", "After", "Ask for feedback with a Survey."],
          ].map(([n, h, t]) => (
            <View key={n} style={styles.stepRow}>
              <View style={styles.stepNum}><Text style={styles.stepNumTxt}>{n}</Text></View>
              <Text style={styles.stepTxt}><Text style={{ fontWeight: "800", color: "#111827" }}>{h}: </Text>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  eventCard: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 16, borderWidth: 1, borderColor: "#EEF0F6" },
  banner: { width: "100%", height: 150 },
  eventTitle: { fontSize: 17, fontWeight: "800", color: "#111827", lineHeight: 23 },
  eventMeta: { fontSize: 13, color: "#6B7280", marginTop: 3 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: { width: "48%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 20, padding: 16, minHeight: 132, borderWidth: 1, borderColor: "#EEF0F6" },
  tileIcon: { width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  tileTitle: { fontSize: 15.5, fontWeight: "800", color: "#111827" },
  tileHint: { fontSize: 12.5, color: "#6B7280", marginTop: 3 },
  steps: { marginTop: 20, backgroundColor: "#EEF2FF", borderRadius: 20, padding: 16, gap: 10 },
  stepsTitle: { fontSize: 14, fontWeight: "800", color: "#3730A3", marginBottom: 2 },
  stepRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  stepNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  stepNumTxt: { color: "#fff", fontWeight: "800", fontSize: 12 },
  stepTxt: { flex: 1, fontSize: 13.5, color: "#4B5563", lineHeight: 20 },
});

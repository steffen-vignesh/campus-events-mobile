import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/contexts/auth-context";
import { getAdaptedEvent, markMyAttendance } from "@/lib/db";
import { type Event } from "@/lib/mock-data";

type Status = "loading" | "ready" | "marking" | "ok" | "already" | "not_registered" | "error";

export default function AttendScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    if (!eventId) return;
    getAdaptedEvent(eventId)
      .then((e) => {
        setEvent(e);
        setStatus(e ? "ready" : "error");
      })
      .catch(() => setStatus("error"));
  }, [eventId]);

  const handleConfirm = async () => {
    setStatus("marking");
    try {
      const result = await markMyAttendance(eventId!);
      if (result === "ok") setStatus("ok");
      else if (result === "already_marked") setStatus("already");
      else setStatus("not_registered");
    } catch {
      setStatus("error");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.logoBadge}>
          <Ionicons name="school" size={20} color="#fff" />
        </View>
        <Text style={styles.logoTxt}>Spirits</Text>
      </View>

      <View style={styles.card}>
        {status === "loading" && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.muted}>Loading event…</Text>
          </View>
        )}

        {status === "ready" && event && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: "#EEF2FF" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#4F46E5" />
            </View>
            <Text style={styles.title}>Check in to</Text>
            <Text style={styles.eventTitle}>{event.title}</Text>
            <View style={styles.metaGroup}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                <Text style={styles.metaTxt}>{format(parseISO(event.date), "EEEE, MMMM d, yyyy")} · {event.time}</Text>
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="location-outline" size={14} color="#6B7280" />
                <Text style={styles.metaTxt}>{event.venue}</Text>
              </View>
            </View>
            <Text style={styles.loggedInAs}>Logged in as <Text style={styles.loggedInName}>{user?.name}</Text></Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleConfirm}>
              <Text style={styles.primaryBtnTxt}>Mark me Present ✓</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "marking" && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.muted}>Checking you in…</Text>
          </View>
        )}

        {status === "ok" && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
            </View>
            <Text style={styles.title}>You&apos;re checked in!</Text>
            <Text style={styles.muted}>Attendance marked for</Text>
            <Text style={styles.eventTitle}>{event?.title}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/my-events")}>
              <Text style={styles.primaryBtnTxt}>My Events</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "already" && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="checkmark-circle" size={40} color="#3B82F6" />
            </View>
            <Text style={styles.title}>Already checked in</Text>
            <Text style={styles.muted}>Your attendance was already recorded for</Text>
            <Text style={styles.eventTitle}>{event?.title}</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace("/(tabs)/my-events")}>
              <Text style={styles.primaryBtnTxt}>My Events</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "not_registered" && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: "#FFF7ED" }]}>
              <Ionicons name="close-circle" size={40} color="#F97316" />
            </View>
            <Text style={styles.title}>Not registered</Text>
            <Text style={styles.muted}>You are not registered for</Text>
            <Text style={styles.eventTitle}>{event?.title}</Text>
            <Text style={styles.subtle}>Please register for the event first.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace(`/(tabs)/events/${eventId}`)}>
              <Text style={styles.primaryBtnTxt}>View Event</Text>
            </TouchableOpacity>
          </View>
        )}

        {status === "error" && (
          <View style={styles.center}>
            <View style={[styles.iconWrap, { backgroundColor: "#FEF2F2" }]}>
              <Ionicons name="close-circle" size={40} color="#EF4444" />
            </View>
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.muted}>Could not mark your attendance. Please try again.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setStatus("ready")}>
              <Text style={styles.primaryBtnTxt}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF", alignItems: "center", justifyContent: "center", padding: 24 },
  header: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  logoBadge: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  logoTxt: { fontSize: 18, fontWeight: "800", color: "#111827" },
  card: { width: "100%", maxWidth: 360, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#F0F0F5", padding: 28 },
  center: { alignItems: "center", gap: 10 },
  iconWrap: { width: 76, height: 76, borderRadius: 38, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  title: { fontSize: 20, fontWeight: "800", color: "#111827", textAlign: "center" },
  eventTitle: { fontSize: 15, fontWeight: "700", color: "#4F46E5", textAlign: "center" },
  metaGroup: { gap: 4, marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaTxt: { fontSize: 12, color: "#6B7280" },
  loggedInAs: { fontSize: 13, color: "#9CA3AF", marginTop: 6 },
  loggedInName: { color: "#374151", fontWeight: "600" },
  muted: { fontSize: 13, color: "#6B7280", textAlign: "center" },
  subtle: { fontSize: 12, color: "#9CA3AF", textAlign: "center" },
  primaryBtn: { backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 32, marginTop: 14, width: "100%", alignItems: "center" },
  primaryBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

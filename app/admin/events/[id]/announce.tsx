import { useEffect, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { type Event, isEventOver } from "@/lib/mock-data";
import { getAdaptedEvent, sendEventNotification } from "@/lib/db";
import { StaffHeader } from "@/components/StaffHeader";

const TEMPLATES = [
  { label: "Reminder", title: "Reminder", body: "Just a reminder: the event is coming up. We look forward to seeing you!" },
  { label: "Starting soon", title: "Starting soon", body: "We are starting in about an hour. Please arrive a few minutes early." },
  { label: "Venue changed", title: "Venue changed", body: "The venue has changed. New venue: " },
  { label: "Time changed", title: "Time changed", body: "The start time has changed. New time: " },
  { label: "Thank you", title: "Thank you for coming!", body: "Thanks for joining us. Please share your feedback in the app." },
];

export default function AnnounceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"registered" | "waiting" | "noshows" | "all">("registered");
  const [sending, setSending] = useState(false);

  useEffect(() => { if (id) getAdaptedEvent(id).then(setEvent).catch(() => {}); }, [id]);

  const send = async () => {
    if (!title.trim() || !body.trim()) { Alert.alert("Add a title and a message first."); return; }
    setSending(true);
    try {
      const n = await sendEventNotification(id!, title.trim(), body.trim(), audience);
      if (n === 0) {
        Alert.alert("No one to notify", audience === "registered" ? "No students have registered yet. Choose All students." : audience === "waiting" ? "Nobody is on the waiting list." : audience === "noshows" ? "Everyone who registered was marked present." : "There are no students yet.");
      } else {
        Alert.alert("Sent", `${n} student${n === 1 ? "" : "s"} will see this in the app and on their phone.`, [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (err: any) {
      Alert.alert("Could not send", err.message ?? "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Notify students" subtitle={event?.title} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>1. Who gets it?</Text>
          <View style={styles.row}>
            {(([["registered", "Registered"], ["waiting", "Waiting list"], ...(event && isEventOver(event) ? [["noshows", "No-shows"]] : []), ["all", "All students"]] as [("registered" | "waiting" | "noshows" | "all"), string][])).map(([k, l]) => (
              <TouchableOpacity key={k} onPress={() => setAudience(k)} style={[styles.choice, audience === k && styles.choiceOn]}>
                <Text style={[styles.choiceTxt, audience === k && styles.choiceTxtOn]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>2. Pick a quick message (or write your own)</Text>
          <View style={styles.chips}>
            {TEMPLATES.map((t) => (
              <TouchableOpacity key={t.label} style={styles.chip} onPress={() => { setTitle(t.title); setBody(t.body); }}>
                <Text style={styles.chipTxt}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#9CA3AF" maxLength={100} />
          <TextInput style={[styles.input, { height: 110, textAlignVertical: "top" }]} value={body} onChangeText={setBody} placeholder="Message" placeholderTextColor="#9CA3AF" multiline maxLength={500} />

          <TouchableOpacity style={[styles.send, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
            {sending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendTxt}>Send now</Text>}
          </TouchableOpacity>
          <Text style={styles.note}>Students see it in the bell inside Spirits and get a phone notification.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: "800", color: "#111827", marginTop: 8, marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, marginBottom: 12 },
  choice: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", backgroundColor: "#fff", alignItems: "center" },
  choiceOn: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  choiceTxt: { fontSize: 13.5, fontWeight: "700", color: "#4B5563" },
  choiceTxtOn: { color: "#4338CA" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: "#EEF2FF" },
  chipTxt: { fontSize: 13, fontWeight: "700", color: "#4338CA" },
  input: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", marginBottom: 12 },
  send: { backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 16, alignItems: "center", marginTop: 4 },
  sendTxt: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { fontSize: 12.5, color: "#9CA3AF", textAlign: "center", marginTop: 12 },
});

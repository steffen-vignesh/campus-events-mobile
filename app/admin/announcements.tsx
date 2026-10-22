import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { type Event } from "@/lib/mock-data";
import { getAdaptedEvents } from "@/lib/db";
import { type StaffProfile, getAllStudents, getEventSeatUserIds, sendToUsers } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, PrimaryButton, LabeledInput, Chips, SearchBar } from "@/components/StaffUI";

type Target = "all" | "program" | "event" | "pick";

const TEMPLATES = [
  { label: "Reminder", title: "Reminder", body: "A friendly reminder about our upcoming events. Open Spirits to see what's on." },
  { label: "New event", title: "New event added", body: "A new event was just added. Open Spirits to see the details and register." },
  { label: "Important", title: "Important update", body: "Please read this important update from the organizers." },
];

// Notify students in bulk: everyone, one study program, the registered students of one event, or hand-picked students.
export default function AnnouncementsScreen() {
  const [students, setStudents] = useState<StaffProfile[] | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [target, setTarget] = useState<Target>("all");
  const [program, setProgram] = useState("");
  const [eventId, setEventId] = useState("");
  const [eventUserIds, setEventUserIds] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    getAllStudents().then(setStudents).catch(() => setStudents([]));
    getAdaptedEvents().then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    if (target === "event" && eventId) getEventSeatUserIds(eventId).then(setEventUserIds).catch(() => setEventUserIds([]));
  }, [target, eventId]);

  const programs = useMemo(
    () => [...new Set((students ?? []).map((s) => s.study_program ?? s.department ?? "").filter(Boolean))].sort(),
    [students]
  );

  const recipients: string[] = useMemo(() => {
    const all = students ?? [];
    if (target === "all") return all.map((s) => s.id);
    if (target === "program") return all.filter((s) => (s.study_program ?? s.department) === program).map((s) => s.id);
    if (target === "event") return eventUserIds;
    return [...picked];
  }, [students, target, program, eventUserIds, picked]);

  const filteredStudents = (students ?? []).filter((s) => {
    const t = q.trim().toLowerCase();
    return !t || s.name.toLowerCase().includes(t) || s.email.toLowerCase().includes(t);
  });

  const toggle = (id: string) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const send = async () => {
    if (!title.trim() || !message.trim()) { Alert.alert("Add a title and a message first."); return; }
    if (recipients.length === 0) { Alert.alert("No one to notify", "Choose who should get this first."); return; }
    setSending(true);
    try {
      const n = await sendToUsers(recipients, title.trim(), message.trim(), target === "event" ? eventId : undefined);
      Alert.alert("Sent", `${n} student${n === 1 ? "" : "s"} will see this in the app and on their phone.`);
      setTitle(""); setMessage("");
    } catch (e: any) {
      Alert.alert("Could not send", e.message ?? "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Announcements" subtitle="Notify many students at once" />
      {students === null ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.step}>1. Who gets it?</Text>
            <Chips<Target>
              options={[{ key: "all", label: "All students" }, { key: "program", label: "A study program" }, { key: "event", label: "An event" }, { key: "pick", label: "Pick students" }]}
              value={target}
              onChange={(k) => { setTarget(k); setPicked(new Set()); }}
            />

            {target === "program" && (
              programs.length === 0 ? <Text style={styles.hint}>No study programs on file yet.</Text> :
              <Chips options={programs.map((p) => ({ key: p, label: p }))} value={program} onChange={setProgram} />
            )}
            {target === "event" && (
              <Chips options={events.map((e) => ({ key: e.id, label: e.title.length > 34 ? e.title.slice(0, 33) + "…" : e.title }))} value={eventId} onChange={setEventId} />
            )}
            {target === "pick" && (
              <Card>
                <SearchBar value={q} onChangeText={setQ} placeholder="Search students" />
                <View style={styles.pickHead}>
                  <Text style={styles.hint}>{picked.size} selected</Text>
                  <TouchableOpacity onPress={() => setPicked(new Set(filteredStudents.map((s) => s.id)))}><Text style={styles.link}>Select all shown</Text></TouchableOpacity>
                  {picked.size > 0 && <TouchableOpacity onPress={() => setPicked(new Set())}><Text style={styles.link}>Clear</Text></TouchableOpacity>}
                </View>
                {filteredStudents.slice(0, 60).map((s) => (
                  <TouchableOpacity key={s.id} style={styles.pickRow} onPress={() => toggle(s.id)} accessibilityLabel={`Pick ${s.name}`}>
                    <Ionicons name={picked.has(s.id) ? "checkbox" : "square-outline"} size={22} color={picked.has(s.id) ? "#4F46E5" : "#9CA3AF"} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.pickName} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.hint} numberOfLines={1}>{s.email}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
                {filteredStudents.length > 60 && <Text style={styles.hint}>Showing 60 of {filteredStudents.length}. Search to narrow down.</Text>}
              </Card>
            )}
            <View style={styles.count}><Ionicons name="people" size={18} color="#4F46E5" /><Text style={styles.countTxt}>{recipients.length} student{recipients.length === 1 ? "" : "s"} will get this</Text></View>

            <Text style={styles.step}>2. Your message</Text>
            <Chips options={TEMPLATES.map((t) => ({ key: t.label, label: t.label }))} value={"" as string} onChange={(k) => { const t = TEMPLATES.find((x) => x.label === k)!; setTitle(t.title); setMessage(t.body); }} />
            <LabeledInput label="Title" value={title} onChangeText={setTitle} placeholder="Title" maxLength={100} />
            <LabeledInput label="Message" value={message} onChangeText={setMessage} placeholder="Write your message" multiline maxLength={500} />
            <PrimaryButton label="Send now" icon="send" onPress={send} busy={sending} />
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  step: { fontSize: 14, fontWeight: "800", color: "#111827", marginTop: 6, marginBottom: 10 },
  hint: { fontSize: 12.5, color: "#6B7280" },
  link: { fontSize: 12.5, fontWeight: "800", color: "#4F46E5" },
  pickHead: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6 },
  pickRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  pickName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  count: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 14, padding: 12, marginBottom: 14 },
  countTxt: { fontSize: 14, fontWeight: "800", color: "#3730A3" },
});

import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Share, Linking, Modal, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { type StaffProfile, type StudentHistoryRow, getStudentProfile, getStudentHistory, resetStudentPassword, sendToUsers } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, PrimaryButton, LabeledInput, Initials } from "@/components/StaffUI";

export default function StudentReport() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<StaffProfile | null | undefined>(undefined);
  const [history, setHistory] = useState<StudentHistoryRow[]>([]);
  const [resetting, setResetting] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!id) return;
    getStudentProfile(id).then(setStudent).catch(() => setStudent(null));
    getStudentHistory(id).then(setHistory).catch(console.error);
  }, [id]);

  if (student === undefined) return <SafeAreaView style={styles.safe}><View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View></SafeAreaView>;
  if (!student) return <SafeAreaView style={styles.safe}><StaffHeader title="Student not found" /></SafeAreaView>;

  const attended = history.filter((h) => h.attended).length;
  const info: [keyof typeof Ionicons.glyphMap, string | null | undefined][] = [
    ["school-outline", student.study_program ?? student.department],
    ["ribbon-outline", student.student_status ?? student.year],
    ["earth-outline", student.home_country],
    ["language-outline", student.german_level],
  ];

  const doReset = () =>
    Alert.alert("Set a temporary password?", `${student.name}'s old password will stop working. You'll see the new one once, to send to them.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Set password",
        onPress: async () => {
          setResetting(true);
          try {
            const pw = await resetStudentPassword(student.id);
            Alert.alert("Temporary password", `${pw}\n\nShown only once. Send it to ${student.name.split(" ")[0]} and ask them to change it in their profile.`, [
              { text: "Done", style: "cancel" },
              { text: "Share…", onPress: () => Share.share({ message: `Your Spirits temporary password: ${pw}` }) },
            ]);
          } catch (e: any) {
            Alert.alert("Could not reset", e.message ?? "Please try again.");
          } finally {
            setResetting(false);
          }
        },
      },
    ]);

  const send = async () => {
    if (!title.trim() || !message.trim()) { Alert.alert("Add a title and a message first."); return; }
    setSending(true);
    try {
      await sendToUsers([student.id], title.trim(), message.trim());
      setNotifyOpen(false); setTitle(""); setMessage("");
      Alert.alert("Sent", `${student.name.split(" ")[0]} will see it in the app.`);
    } catch (e: any) {
      Alert.alert("Could not send", e.message ?? "Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Student" subtitle={student.name} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.top}>
            <Initials name={student.name} size={64} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{student.name}</Text>
              <TouchableOpacity onPress={() => Linking.openURL(`mailto:${student.email}`)}><Text style={styles.link}>{student.email}</Text></TouchableOpacity>
              {student.phone ? <TouchableOpacity onPress={() => Linking.openURL(`tel:${student.phone}`)}><Text style={styles.link}>{student.phone}</Text></TouchableOpacity> : null}
            </View>
          </View>
          {info.filter(([, v]) => !!v).map(([icon, v]) => (
            <View key={String(icon)} style={styles.infoRow}><Ionicons name={icon} size={17} color="#6B7280" /><Text style={styles.infoTxt}>{v}</Text></View>
          ))}
        </Card>

        <View style={styles.stats}>
          {[[String(history.length), "Events registered"], [String(attended), "Events attended"], [String(history.length - attended), "Not attended"]].map(([v, l]) => (
            <View key={l} style={styles.stat}><Text style={styles.statV}>{v}</Text><Text style={styles.statL}>{l}</Text></View>
          ))}
        </View>

        <View style={{ gap: 10, marginBottom: 14 }}>
          <PrimaryButton label="Send a notification" icon="notifications-outline" onPress={() => setNotifyOpen(true)} />
          <PrimaryButton label="Forgot password? Set a temporary one" icon="key-outline" tone="light" onPress={doReset} busy={resetting} />
        </View>

        <Text style={styles.section}>Event history</Text>
        {history.length === 0 ? <Text style={styles.empty}>No events yet.</Text> : history.map((h) => (
          <TouchableOpacity key={h.id} style={styles.hrow} onPress={() => router.push(`/admin/events/${h.event_id}` as any)} activeOpacity={0.8}>
            <View style={{ flex: 1 }}>
              <Text style={styles.hTitle} numberOfLines={2}>{h.event_title}</Text>
              <Text style={styles.hMeta}>{h.event_date ? format(parseISO(h.event_date), "d MMM yyyy") : ""} · {h.event_time}</Text>
            </View>
            <View style={[styles.badge, h.attended ? styles.badgeOk : styles.badgeNo]}>
              <Text style={[styles.badgeTxt, { color: h.attended ? "#065F46" : "#6B7280" }]}>{h.attended ? "Attended" : "Registered"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={notifyOpen} transparent animationType="slide" onRequestClose={() => setNotifyOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Notify {student.name.split(" ")[0]}</Text>
            <LabeledInput label="Title" value={title} onChangeText={setTitle} placeholder="e.g. We missed you" maxLength={100} />
            <LabeledInput label="Message" value={message} onChangeText={setMessage} placeholder="Write your message" multiline maxLength={500} />
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}><PrimaryButton label="Cancel" tone="light" onPress={() => setNotifyOpen(false)} /></View>
              <View style={{ flex: 1.4 }}><PrimaryButton label="Send now" onPress={send} busy={sending} /></View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  top: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: "800", color: "#111827" },
  link: { fontSize: 13.5, color: "#4F46E5", marginTop: 2, fontWeight: "600" },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  infoTxt: { fontSize: 14, color: "#374151", flex: 1 },
  stats: { flexDirection: "row", gap: 10, marginBottom: 14 },
  stat: { flex: 1, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "#EEF0F6" },
  statV: { fontSize: 22, fontWeight: "800", color: "#4F46E5" },
  statL: { fontSize: 11.5, color: "#6B7280", marginTop: 2, textAlign: "center" },
  section: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 10 },
  empty: { fontSize: 13.5, color: "#9CA3AF" },
  hrow: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#EEF0F6" },
  hTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  hMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  badgeOk: { backgroundColor: "#D1FAE5" },
  badgeNo: { backgroundColor: "#F3F4F6" },
  badgeTxt: { fontSize: 11.5, fontWeight: "800" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.5)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32 },
  sheetTitle: { fontSize: 19, fontWeight: "800", color: "#111827", marginBottom: 14 },
});

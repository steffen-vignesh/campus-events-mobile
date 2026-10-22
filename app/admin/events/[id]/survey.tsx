import { useCallback, useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type DbSurvey, type DbSurveyQuestion, getEventSurveys, getSurveyQuestions, addSurveyQuestion, deleteSurveyQuestion } from "@/lib/db";
import { StaffHeader } from "@/components/StaffHeader";

const TYPES: { type: DbSurveyQuestion["type"]; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: "rating", label: "Stars", icon: "star" },
  { type: "yesno", label: "Yes / No", icon: "checkmark-circle" },
  { type: "text", label: "Comment", icon: "chatbubble" },
];

// Students always get 3 standard questions (stars, organisation, recommend).
// Here the organizer sees the results and can add extra questions.
export default function SurveyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState<DbSurvey[]>([]);
  const [questions, setQuestions] = useState<DbSurveyQuestion[]>([]);
  const [text, setText] = useState("");
  const [type, setType] = useState<DbSurveyQuestion["type"]>("rating");

  const load = useCallback(() => {
    if (!id) return;
    Promise.all([getEventSurveys(id), getSurveyQuestions(id)])
      .then(([s, q]) => { setSurveys(s); setQuestions(q); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);
  useFocusEffect(load);

  const avg = (f: (s: DbSurvey) => number) => (surveys.length ? (surveys.reduce((a, s) => a + f(s), 0) / surveys.length).toFixed(1) : "–");
  const recommend = surveys.length ? Math.round((surveys.filter((s) => s.would_recommend).length / surveys.length) * 100) : 0;
  const comments = surveys.flatMap((s) => [s.liked_most, s.could_improve, s.other_feedback]).filter((c): c is string => !!c && !!c.trim()).slice(0, 8);

  const add = async () => {
    if (!text.trim()) return;
    try {
      const q = await addSurveyQuestion(id!, text.trim(), type, questions.length);
      setQuestions((p) => [...p, q]);
      setText("");
    } catch (e: any) { Alert.alert("Could not add", e.message ?? "Try again."); }
  };
  const remove = (q: DbSurveyQuestion) =>
    Alert.alert("Remove this question?", q.question, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { try { await deleteSurveyQuestion(q.id); setQuestions((p) => p.filter((x) => x.id !== q.id)); } catch (e: any) { Alert.alert("Could not remove", e.message); } } },
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Survey" subtitle="Feedback from students" />
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={styles.stats}>
            {[[String(surveys.length), "Responses"], [avg((s) => s.rating), "Event ★"], [avg((s) => s.organization_rating), "Organisation ★"], [`${recommend}%`, "Recommend"]].map(([v, l]) => (
              <View key={l} style={styles.stat}><Text style={styles.statV}>{v}</Text><Text style={styles.statL}>{l}</Text></View>
            ))}
          </View>

          {surveys.length === 0 && <Text style={styles.empty}>No feedback yet. Students can answer the survey after the event.</Text>}
          {comments.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>What students said</Text>
              {comments.map((c, i) => <Text key={i} style={styles.comment}>“{c}”</Text>)}
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Add your own question</Text>
            <View style={styles.types}>
              {TYPES.map((t) => (
                <TouchableOpacity key={t.type} style={[styles.typeBtn, type === t.type && styles.typeOn]} onPress={() => setType(t.type)}>
                  <Ionicons name={t.icon} size={16} color={type === t.type ? "#4338CA" : "#6B7280"} />
                  <Text style={[styles.typeTxt, type === t.type && { color: "#4338CA" }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput style={styles.input} value={text} onChangeText={setText} placeholder="e.g. Was the speaker clear?" placeholderTextColor="#9CA3AF" maxLength={200} />
            <TouchableOpacity style={[styles.addBtn, !text.trim() && { opacity: 0.5 }]} onPress={add} disabled={!text.trim()}>
              <Text style={styles.addTxt}>Add question</Text>
            </TouchableOpacity>
            {questions.map((q) => (
              <View key={q.id} style={styles.qRow}>
                <Text style={styles.qTxt}>{q.question}</Text>
                <TouchableOpacity onPress={() => remove(q)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }} accessibilityLabel="Remove question">
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: { width: "47.5%", flexGrow: 1, backgroundColor: "#fff", borderRadius: 18, padding: 14, borderWidth: 1, borderColor: "#EEF0F6" },
  statV: { fontSize: 26, fontWeight: "800", color: "#4F46E5" },
  statL: { fontSize: 12.5, color: "#6B7280", marginTop: 2 },
  empty: { fontSize: 13.5, color: "#6B7280", textAlign: "center", paddingVertical: 6 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#EEF0F6", gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  comment: { fontSize: 13.5, color: "#4B5563", lineHeight: 20 },
  types: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", paddingVertical: 11, borderRadius: 12, borderWidth: 1.5, borderColor: "#E5E7EB" },
  typeOn: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  typeTxt: { fontSize: 12.5, fontWeight: "700", color: "#6B7280" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827" },
  addBtn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  addTxt: { color: "#fff", fontWeight: "800", fontSize: 15 },
  qRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  qTxt: { flex: 1, fontSize: 14, color: "#111827" },
});

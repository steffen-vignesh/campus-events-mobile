import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type Event, isEventOver } from "@/lib/mock-data";
import {
  getAdaptedEvent, submitSurvey, getMyEventSurvey, isRegisteredForEvent, didIAttend,
  getSurveyQuestions, type DbSurveyQuestion,
} from "@/lib/db";

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}>
          <Ionicons name={n <= value ? "star" : "star-outline"} size={30} color={n <= value ? "#FBBF24" : "#D1D5DB"} />
        </TouchableOpacity>
      ))}
      {value > 0 && (
        <Text style={styles.starLabel}>{["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}</Text>
      )}
    </View>
  );
}

function YesNoRow({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.ynRow}>
      <TouchableOpacity
        style={[styles.ynBtn, value === true && styles.ynBtnYesActive]}
        onPress={() => onChange(true)}
      >
        <Ionicons name="thumbs-up" size={16} color={value === true ? "#fff" : "#6B7280"} />
        <Text style={[styles.ynTxt, value === true && styles.ynTxtActive]}>Yes</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.ynBtn, value === false && styles.ynBtnNoActive]}
        onPress={() => onChange(false)}
      >
        <Ionicons name="thumbs-down" size={16} color={value === false ? "#fff" : "#6B7280"} />
        <Text style={[styles.ynTxt, value === false && styles.ynTxtActive]}>No</Text>
      </TouchableOpacity>
    </View>
  );
}

function CustomQuestionField({
  q, qNum, value, onChange,
}: {
  q: DbSurveyQuestion; qNum: number; value: string | number | boolean | null;
  onChange: (v: string | number | boolean) => void;
}) {
  const label = `${qNum}. ${q.question}${q.required ? " *" : ""}`;
  if (q.type === "rating") {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <StarRow value={Number(value ?? 0)} onChange={onChange} />
      </View>
    );
  }
  if (q.type === "yesno") {
    return (
      <View style={styles.field}>
        <Text style={styles.label}>{label}</Text>
        <YesNoRow value={value === true ? true : value === false ? false : null} onChange={onChange} />
      </View>
    );
  }
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textarea}
        value={(value as string) ?? ""}
        onChangeText={onChange}
        placeholder="Your answer…"
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={3}
        maxLength={500}
      />
    </View>
  );
}

export default function SurveyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [registered, setRegistered] = useState(false);
  const [attended, setAttended] = useState<boolean | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [questions, setQuestions] = useState<DbSurveyQuestion[]>([]);

  const [rating, setRating] = useState(0);
  const [orgRating, setOrgRating] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [likedMost, setLikedMost] = useState("");
  const [couldImprove, setCouldImprove] = useState("");
  const [otherFeedback, setOtherFeedback] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | number | boolean | null>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
    isRegisteredForEvent(id).then(setRegistered).catch(() => {});
    didIAttend(id).then(setAttended).catch(() => setAttended(false));
    getMyEventSurvey(id).then((s) => setAlreadySubmitted(!!s)).catch(() => {});
    getSurveyQuestions(id).then(setQuestions).catch(() => setQuestions([]));
  }, [id]);

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please rate the event."); return; }
    if (orgRating === 0) { setError("Please rate the organization."); return; }
    if (recommend === null) { setError("Please answer the recommendation question."); return; }
    for (const q of questions) {
      if (q.required) {
        const ans = customAnswers[q.id];
        if (ans === null || ans === undefined || ans === "") {
          setError(`Please answer: "${q.question}"`);
          return;
        }
      }
    }
    setError("");
    setSubmitting(true);
    try {
      const filteredCustom: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(customAnswers)) {
        if (v !== null && v !== undefined && v !== "") filteredCustom[k] = v;
      }
      await submitSurvey(id!, {
        rating,
        organization_rating: orgRating,
        would_recommend: recommend,
        liked_most: likedMost,
        could_improve: couldImprove,
        other_feedback: otherFeedback,
        custom_answers: filteredCustom,
      });
      setDone(true);
    } catch {
      setError("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  if (event === undefined) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.blockedTxt}>Event not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPast = isEventOver(event);

  if (!isPast) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.blockedTxt}>Survey not available yet.</Text>
          <Text style={styles.blockedSub}>The survey opens after the event ends.</Text>
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Go back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (attended === null) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}><ActivityIndicator size="large" color="#4F46E5" /></View>
      </SafeAreaView>
    );
  }

  if (!attended && !alreadySubmitted && !done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <Text style={styles.blockedTxt}>{registered ? "Feedback is for students who attended." : "Survey is only for registered attendees."}</Text>
          {registered ? <Text style={styles.blockedSub}>If you were there, ask the organizer to mark you present.</Text> : null}
          <TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Go back</Text></TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (alreadySubmitted || done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.centerWrap}>
          <View style={styles.doneIconWrap}>
            <Ionicons name="checkmark-circle" size={40} color="#16A34A" />
          </View>
          <Text style={styles.doneTitle}>
            {done ? "Thank you for your feedback!" : "Survey already submitted"}
          </Text>
          <Text style={styles.blockedSub}>Your response for {event.title} has been recorded.</Text>
          <TouchableOpacity style={styles.backEventBtn} onPress={() => router.replace(`/(tabs)/events/${id}`)}>
            <Text style={styles.backEventBtnTxt}>Back to Event</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#6B7280" />
          <Text style={styles.backRowTxt}>Back to Event</Text>
        </TouchableOpacity>

        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.headerIcon}>
              <Ionicons name="clipboard" size={20} color="#4F46E5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Event Feedback</Text>
              <Text style={styles.headerSub}>{event.title} · {format(new Date(event.date), "dd MMM yyyy")}</Text>
            </View>
          </View>
          <Text style={styles.headerHelp}>Your honest feedback helps us improve future events. Takes under 2 minutes.</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.field}>
            <Text style={styles.label}>1. How would you rate the overall event? *</Text>
            <StarRow value={rating} onChange={setRating} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>2. How well was the event organized? *</Text>
            <StarRow value={orgRating} onChange={setOrgRating} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>3. Would you recommend this event to others? *</Text>
            <YesNoRow value={recommend} onChange={setRecommend} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>4. What did you like most?</Text>
            <TextInput
              style={styles.textarea}
              value={likedMost}
              onChangeText={setLikedMost}
              placeholder="Highlights, speakers, activities…"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>5. What could be improved?</Text>
            <TextInput
              style={styles.textarea}
              value={couldImprove}
              onChangeText={setCouldImprove}
              placeholder="Venue, timing, content, communication…"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>6. Any other feedback?</Text>
            <TextInput
              style={styles.textarea}
              value={otherFeedback}
              onChangeText={setOtherFeedback}
              placeholder="Anything else you'd like to share…"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          {questions.length > 0 && (
            <>
              <View style={styles.divider} />
              {questions.map((q, idx) => (
                <CustomQuestionField
                  key={q.id}
                  q={q}
                  qNum={idx + 7}
                  value={customAnswers[q.id] ?? null}
                  onChange={(val) => setCustomAnswers((prev) => ({ ...prev, [q.id]: val }))}
                />
              ))}
            </>
          )}

          {error !== "" && (
            <View style={styles.errorBox}><Text style={styles.errorTxt}>{error}</Text></View>
          )}

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.submitBtnTxt}>Submit Feedback</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  centerWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 8 },
  blockedTxt: { fontSize: 15, fontWeight: "600", color: "#374151", textAlign: "center" },
  blockedSub: { fontSize: 13, color: "#6B7280", textAlign: "center", marginBottom: 4 },
  link: { color: "#4F46E5", fontSize: 14, fontWeight: "600", marginTop: 6 },
  doneIconWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center", marginBottom: 8 },
  doneTitle: { fontSize: 18, fontWeight: "700", color: "#111827", textAlign: "center" },
  backEventBtn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24, marginTop: 12 },
  backEventBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  scroll: { padding: 20, paddingBottom: 40 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backRowTxt: { fontSize: 14, color: "#6B7280", fontWeight: "500" },
  headerCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: "#F0F0F5" },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  headerSub: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  headerHelp: { fontSize: 13, color: "#6B7280", marginTop: 12 },
  formCard: { backgroundColor: "#fff", borderRadius: 18, padding: 18, gap: 20, borderWidth: 1, borderColor: "#F0F0F5" },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151" },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  starLabel: { marginLeft: 8, fontSize: 13, color: "#6B7280" },
  ynRow: { flexDirection: "row", gap: 10 },
  ynBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB" },
  ynBtnYesActive: { backgroundColor: "#16A34A", borderColor: "#16A34A" },
  ynBtnNoActive: { backgroundColor: "#EF4444", borderColor: "#EF4444" },
  ynTxt: { fontSize: 14, fontWeight: "600", color: "#6B7280" },
  ynTxtActive: { color: "#fff" },
  textarea: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 14, padding: 12, fontSize: 14, color: "#111827", minHeight: 76, textAlignVertical: "top" },
  divider: { height: 1, backgroundColor: "#F0F0F5", marginVertical: 2 },
  errorBox: { backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FECACA", borderRadius: 14, padding: 12 },
  errorTxt: { color: "#DC2626", fontSize: 13 },
  submitBtn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 15, alignItems: "center" },
  submitBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

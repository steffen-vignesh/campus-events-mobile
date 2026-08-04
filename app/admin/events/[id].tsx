import { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, Switch,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { MOCK_EVENTS, CATEGORIES } from "@/lib/mock-data";

export default function AdminEditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = MOCK_EVENTS.find((e) => e.id === id);

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [organizer, setOrganizer] = useState(event?.organizer ?? "");
  const [email, setEmail] = useState(event?.contactEmail ?? "");
  const [fee, setFee] = useState(String(event?.registrationFee ?? 0));
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 100));
  const [eligibility, setEligibility] = useState(event?.eligibility ?? "");
  const [saved, setSaved] = useState(false);

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTxt}>Event not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.linkTxt}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = () => {
    if (!title) { Alert.alert("Title required"); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    Alert.alert("Saved!", "Event details have been updated.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Event</Text>
          <TouchableOpacity
            style={styles.regBtn}
            onPress={() => router.push(`/admin/events/${id}/registrants`)}
          >
            <Ionicons name="people" size={18} color="#4F46E5" />
            <Text style={styles.regBtnTxt}>{event.registrations}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Field label="Event Title *" value={title} onChangeText={setTitle} placeholder="e.g. National Hackathon 2026" />
          <Field label="Description *" value={description} onChangeText={setDescription} placeholder="Describe the event..." multiline />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Start Date</Text>
              <View style={styles.staticField}><Text style={styles.staticTxt}>{event.date}</Text></View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Time</Text>
              <View style={styles.staticField}><Text style={styles.staticTxt}>{event.time}</Text></View>
            </View>
          </View>

          <Field label="Venue *" value={venue} onChangeText={setVenue} placeholder="Main Auditorium, Block A" />
          <Field label="Organizer *" value={organizer} onChangeText={setOrganizer} placeholder="Dr. Ramesh Kumar" />
          <Field label="Contact Email *" value={email} onChangeText={setEmail} placeholder="organizer@college.edu" keyboardType="email-address" />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Capacity *" value={capacity} onChangeText={setCapacity} placeholder="100" keyboardType="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Fee (₹)" value={fee} onChangeText={setFee} placeholder="0" keyboardType="numeric" />
            </View>
          </View>

          <Field label="Eligibility" value={eligibility} onChangeText={setEligibility} placeholder="Open to all" />

          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
            <Text style={styles.infoTxt}>Category: <Text style={{ fontWeight: "700" }}>{event.category}</Text> · Status: <Text style={{ fontWeight: "700" }}>{event.status}</Text></Text>
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnTxt}>{saved ? "✓ Saved!" : "Save Changes"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
        autoCapitalize="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundTxt: { fontSize: 16, color: "#6B7280" },
  backLink: { marginTop: 12 },
  linkTxt: { color: "#4F46E5", fontSize: 14, fontWeight: "600" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  title: { flex: 1, fontSize: 18, fontWeight: "800", color: "#111827" },
  regBtn: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EEF2FF", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  regBtnTxt: { fontSize: 13, fontWeight: "700", color: "#4F46E5" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827" },
  inputMulti: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 10 },
  staticField: { backgroundColor: "#F3F4F6", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  staticTxt: { fontSize: 13, color: "#6B7280" },
  infoCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 14, padding: 14, marginBottom: 20 },
  infoTxt: { flex: 1, fontSize: 13, color: "#6366F1" },
  saveBtn: { backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  saveBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

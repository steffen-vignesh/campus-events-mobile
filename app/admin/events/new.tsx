import { useState } from "react";
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { CATEGORIES } from "@/lib/mock-data";

export default function NewEventScreen() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("technical");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("09:00 AM");
  const [venue, setVenue] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [email, setEmail] = useState("");
  const [deadline, setDeadline] = useState("");
  const [capacity, setCapacity] = useState("100");
  const [fee, setFee] = useState("0");
  const [eligibility, setEligibility] = useState("Open to all");

  const handlePublish = () => {
    if (!title || !description || !date || !venue || !organizer || !email || !deadline) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }
    Alert.alert("Published!", "Your event has been created successfully.", [
      { text: "OK", onPress: () => router.push("/admin/events") },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Create Event</Text>
        </View>

        <View style={styles.content}>
          <SectionCard title="Basic Information">
            <Field label="Event Title *" value={title} onChangeText={setTitle} placeholder="e.g. National Hackathon 2026" />
            <Field label="Description *" value={description} onChangeText={setDescription} placeholder="Describe the event..." multiline />
            <View style={styles.field}>
              <Text style={styles.label}>Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.chip, category === c.value && styles.chipActive]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text style={[styles.chipTxt, category === c.value && styles.chipTxtActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </SectionCard>

          <SectionCard title="Date, Time & Venue">
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Start Date *" value={date} onChangeText={setDate} placeholder="2026-08-20" keyboardType="numbers-and-punctuation" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Start Time *" value={time} onChangeText={setTime} placeholder="09:00 AM" />
              </View>
            </View>
            <Field label="Venue *" value={venue} onChangeText={setVenue} placeholder="Main Auditorium, Block A" />
          </SectionCard>

          <SectionCard title="Registration">
            <Field label="Deadline *" value={deadline} onChangeText={setDeadline} placeholder="2026-08-17" keyboardType="numbers-and-punctuation" />
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Field label="Capacity *" value={capacity} onChangeText={setCapacity} placeholder="100" keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <Field label="Fee (₹)" value={fee} onChangeText={setFee} placeholder="0" keyboardType="numeric" />
              </View>
            </View>
            <Field label="Eligibility" value={eligibility} onChangeText={setEligibility} placeholder="Open to all" />
          </SectionCard>

          <SectionCard title="Organizer">
            <Field label="Organizer Name *" value={organizer} onChangeText={setOrganizer} placeholder="Dr. Ramesh Kumar" />
            <Field label="Contact Email *" value={email} onChangeText={setEmail} placeholder="organizer@college.edu" keyboardType="email-address" autoCapitalize="none" />
          </SectionCard>

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
              <Text style={styles.cancelTxt}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.publishBtn} onPress={handlePublish}>
              <Ionicons name="send" size={18} color="#fff" />
              <Text style={styles.publishTxt}>Publish Event</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.card}>
      <Text style={sectionStyles.title}>{title}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  title: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 14 },
});

function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, autoCapitalize }: any) {
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
        autoCapitalize={autoCapitalize ?? "sentences"}
        textAlignVertical={multiline ? "top" : "center"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  content: { paddingHorizontal: 20, paddingBottom: 40 },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827" },
  inputMulti: { height: 100 },
  row: { flexDirection: "row", gap: 10 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "transparent" },
  chipActive: { backgroundColor: "#4F46E5" },
  chipTxt: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  chipTxtActive: { color: "#fff" },
  btnRow: { flexDirection: "row", gap: 12, marginTop: 6 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
  cancelTxt: { fontSize: 15, fontWeight: "700", color: "#6B7280" },
  publishBtn: { flex: 2, flexDirection: "row", gap: 8, paddingVertical: 15, borderRadius: 16, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  publishTxt: { color: "#fff", fontWeight: "700", fontSize: 15 },
});

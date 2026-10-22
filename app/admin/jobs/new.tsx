import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { createJob } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { PrimaryButton, LabeledInput, Chips } from "@/components/StaffUI";
import { DateField } from "@/components/DateTimeFields";

const TYPES = ["Internship", "Full-time", "Part-time", "Contract", "Freelance"].map((t) => ({ key: t, label: t }));

export default function NewJobScreen() {
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Internship");
  const [description, setDescription] = useState("");
  const [salary, setSalary] = useState("");
  const [link, setLink] = useState("");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim() || !company.trim() || !location.trim() || !description.trim()) {
      Alert.alert("Almost there", "Please add a title, company, location and description.");
      return;
    }
    setSaving(true);
    try {
      await createJob({
        title: title.trim(), company: company.trim(), location: location.trim(), type, description: description.trim(),
        salary_range: salary.trim() || null, apply_link: link.trim() || null, deadline: deadline || null,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Could not post the job", e.message ?? "Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Post a job" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <LabeledInput label="Job title *" value={title} onChangeText={setTitle} placeholder="e.g. Working student, marketing" />
          <LabeledInput label="Company *" value={company} onChangeText={setCompany} placeholder="Company name" />
          <LabeledInput label="Location *" value={location} onChangeText={setLocation} placeholder="e.g. Schmalkalden or Remote" />
          <Text style={styles.label}>Type *</Text>
          <Chips options={TYPES} value={type} onChange={setType} />
          <LabeledInput label="Description *" value={description} onChangeText={setDescription} placeholder="What will the student do?" multiline />
          <LabeledInput label="Salary (optional)" value={salary} onChangeText={setSalary} placeholder="e.g. €14 per hour" />
          <LabeledInput label="Apply link (optional)" value={link} onChangeText={setLink} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
          <Text style={styles.label}>Apply by (optional)</Text>
          <View style={{ marginBottom: 18 }}><DateField value={deadline} onChange={setDeadline} /></View>
          <PrimaryButton label="Post job" icon="send" onPress={save} busy={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
});

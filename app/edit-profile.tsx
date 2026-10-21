import { useState } from "react";
import { View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { ChipSelect } from "@/components/ChipSelect";
import { Avatar } from "@/components/Avatar";
import { pickImage, uploadImage } from "@/lib/upload";
import { STUDY_PROGRAMS, STUDENT_STATUSES, GERMAN_LEVELS } from "@/lib/profile-options";

export default function EditProfileScreen() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [homeCountry, setHomeCountry] = useState(user?.homeCountry ?? "");
  const [studyProgram, setStudyProgram] = useState(user?.studyProgram ?? "");
  const [studentStatus, setStudentStatus] = useState(user?.studentStatus ?? "");
  const [germanLevel, setGermanLevel] = useState(user?.germanLevel ?? "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarVersion, setAvatarVersion] = useState(0);

  if (!user) return null;

  const changePhoto = async () => {
    const asset = await pickImage([1, 1]);
    if (!asset) return;
    setUploading(true);
    try {
      await uploadImage(asset, "avatar");
      setAvatarVersion(Date.now());
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!name.trim()) { Alert.alert("Name required", "Name cannot be empty."); return; }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.trim(),
        phone: phone.trim() || null,
        home_country: homeCountry.trim() || null,
        study_program: studyProgram || null,
        student_status: studentStatus || null,
        german_level: germanLevel || null,
        department: studyProgram || null,
        year: studentStatus || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) { Alert.alert("Could not save", error.message); return; }
    await refreshUser();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
        </View>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.avatarWrap} onPress={changePhoto} disabled={uploading}>
            <Avatar userId={user.id} name={user.name} size={96} version={avatarVersion} />
            <View style={styles.camBadge}>
              {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="camera" size={16} color="#fff" />}
            </View>
          </TouchableOpacity>
          <Text style={styles.hint}>Tap to change your photo</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Your full name" placeholderTextColor="#9CA3AF" />
          <Text style={styles.label}>Mobiltelefon - Mobile phone</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="+49 170 1234567" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" />
          <Text style={styles.label}>Heimatland - Home Country</Text>
          <TextInput style={styles.input} value={homeCountry} onChangeText={setHomeCountry} placeholder="India" placeholderTextColor="#9CA3AF" />

          <Text style={styles.label}>Was studierst du? - What do you study / name of current study program?</Text>
          <ChipSelect options={STUDY_PROGRAMS} value={studyProgram} onChange={setStudyProgram} />
          <Text style={styles.label}>Welchen Studentenstatus hast du? - What is your student status?</Text>
          <ChipSelect options={STUDENT_STATUSES} value={studentStatus} onChange={setStudentStatus} />
          <Text style={styles.label}>Wie gut sind Ihre Deutschkenntnisse? - What is your level of proficiency in the German language?</Text>
          <ChipSelect options={GERMAN_LEVELS} value={germanLevel} onChange={setGermanLevel} />

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={save} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveTxt}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  content: { padding: 20, paddingTop: 4, paddingBottom: 48 },
  avatarWrap: { alignSelf: "center" },
  camBadge: { position: "absolute", right: -2, bottom: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#fff" },
  hint: { textAlign: "center", fontSize: 12, color: "#9CA3AF", marginTop: 8, marginBottom: 8 },
  label: { fontSize: 12.5, fontWeight: "700", color: "#374151", marginTop: 16, marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: "#111827" },
  saveBtn: { marginTop: 28, backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 15, alignItems: "center" },
  saveTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

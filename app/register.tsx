import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { Link, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { ChipSelect } from "@/components/ChipSelect";
import { StudyProgramSelect } from "@/components/StudyProgramSelect";
import { STUDENT_STATUSES, GERMAN_LEVELS } from "@/lib/profile-options";

function getPasswordStrength(p: string): { label: string; color: string; width: string } {
  if (p.length === 0) return { label: "", color: "#E5E7EB", width: "0%" };
  if (p.length < 6) return { label: "Weak", color: "#EF4444", width: "33%" };
  if (p.length < 10 || !/\d/.test(p) || !/[A-Z]/.test(p)) return { label: "Fair", color: "#F59E0B", width: "66%" };
  return { label: "Strong", color: "#10B981", width: "100%" };
}

export default function RegisterScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [homeCountry, setHomeCountry] = useState("");
  const [studyProgram, setStudyProgram] = useState("");
  const [studentStatus, setStudentStatus] = useState("");
  const [germanLevel, setGermanLevel] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async () => {
    if (!name || !email || !password || !confirm) {
      Alert.alert("Missing fields", "Please fill all required fields.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Password mismatch", "Passwords do not match.");
      return;
    }
    if (!accepted) {
      Alert.alert("Terms required", "Please accept the Terms & Conditions to continue.");
      return;
    }
    setLoading(true);
    const result = await register({ name, email, password, role: "student", phone, homeCountry, studyProgram, studentStatus, germanLevel });
    setLoading(false);
    if (!result.success) {
      Alert.alert("Error", result.error);
      return;
    }
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <View style={styles.logoBadge}>
            <Ionicons name="school" size={20} color="#fff" />
          </View>
        </View>

        <Text style={styles.heading}>Create account</Text>
        <Text style={styles.sub}>Join Spirits today</Text>

        <Field label="Full Name *" value={name} onChangeText={setName} placeholder="Your full name" />
        <Field label="Email *" value={email} onChangeText={setEmail} placeholder="you@college.edu" keyboardType="email-address" autoCapitalize="none" />
        <Field label="Mobiltelefon - Mobile phone" value={phone} onChangeText={setPhone} placeholder="+49 170 1234567" keyboardType="phone-pad" />
        <Field label="Heimatland - Home Country" value={homeCountry} onChangeText={setHomeCountry} placeholder="India" />
        <View style={styles.field}>
          <Text style={styles.label}>Was studierst du? / What is your current degree programme?</Text>
          <StudyProgramSelect value={studyProgram} onChange={setStudyProgram} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Welchen Studentenstatus hast du? - What is your student status?</Text>
          <ChipSelect options={STUDENT_STATUSES} value={studentStatus} onChange={setStudentStatus} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Wie gut sind Ihre Deutschkenntnisse? - What is your level of proficiency in the German language?</Text>
          <ChipSelect options={GERMAN_LEVELS} value={germanLevel} onChange={setGermanLevel} />
        </View>

        {/* Password */}
        <View style={styles.field}>
          <Text style={styles.label}>Password *</Text>
          <View style={styles.passWrap}>
            <TextInput
              style={[styles.input, { flex: 1, borderWidth: 0 }]}
              placeholder="Min. 8 characters"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={styles.eyeBtn}>
              <Ionicons name={showPass ? "eye-off" : "eye"} size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBar}>
                <View style={[styles.strengthFill, { width: strength.width as any, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}
        </View>

        <Field label="Confirm Password *" value={confirm} onChangeText={setConfirm} placeholder="Re-enter password" secureTextEntry />

        {/* T&C checkbox */}
        <TouchableOpacity style={styles.checkRow} onPress={() => setAccepted(!accepted)}>
          <View style={[styles.checkbox, accepted && styles.checkboxActive]}>
            {accepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={styles.checkText}>
            I agree to the{" "}
            <Text style={styles.link} onPress={() => router.push("/terms")}>Terms & Conditions</Text>
            {" "}and{" "}
            <Text style={styles.link} onPress={() => router.push("/privacy")}>Privacy Policy</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, !accepted && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={!accepted || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/login" asChild>
            <TouchableOpacity><Text style={styles.link}>Sign in</Text></TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, autoCapitalize, secureTextEntry }: any) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? "words"}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { flexGrow: 1, padding: 20, paddingTop: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  logoBadge: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 26, fontWeight: "700", color: "#111827", letterSpacing: -0.5 },
  sub: { fontSize: 14, color: "#6B7280", marginTop: 4, marginBottom: 24 },
  roleWrap: { flexDirection: "row", gap: 10, marginBottom: 20 },
  roleBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 14, backgroundColor: "#F3F4F6", borderWidth: 1.5, borderColor: "transparent" },
  roleBtnActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  roleTxt: { fontSize: 13, fontWeight: "600", color: "#6B7280" },
  roleTxtActive: { color: "#fff" },
  field: { marginBottom: 14 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827" },
  passWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingLeft: 14 },
  eyeBtn: { padding: 12 },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  strengthBar: { flex: 1, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  strengthFill: { height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: "600", width: 44 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 20, marginTop: 6 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: "#D1D5DB", alignItems: "center", justifyContent: "center", marginTop: 1 },
  checkboxActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  checkText: { flex: 1, fontSize: 13, color: "#6B7280", lineHeight: 20 },
  btn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnDisabled: { backgroundColor: "#A5B4FC" },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20, marginBottom: 24 },
  footerText: { color: "#6B7280", fontSize: 14 },
  link: { color: "#4F46E5", fontWeight: "600", fontSize: 14 },
});

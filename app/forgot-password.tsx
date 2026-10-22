import { useState } from "react";
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { WEB_URL } from "@/lib/config";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // The email link opens the Spirits web page, where the new password is set.
  const sendLink = async () => {
    const address = email.trim();
    if (!address || loading) return;
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${WEB_URL}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View style={styles.center}>
        <View style={styles.successIcon}>
          <Ionicons name="mail-outline" size={40} color="#4F46E5" />
        </View>
        <Text style={styles.heading}>Check your email</Text>
        <Text style={styles.sub}>
          We sent a password reset link to{"\n"}
          <Text style={{ fontWeight: "700", color: "#111827" }}>{email.trim()}</Text>
        </Text>
        <Text style={[styles.sub, { marginTop: -12 }]}>
          Open the link in the email to choose a new password for Spirits. Check your spam folder if it does not arrive.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.replace("/login")}>
          <Text style={styles.btnText}>Back to Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>

        <View style={styles.iconWrap}>
          <Ionicons name="lock-closed-outline" size={36} color="#4F46E5" />
        </View>
        <Text style={styles.heading}>Forgot password?</Text>
        <Text style={styles.sub}>Enter your email and we'll send you a reset link.</Text>

        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={styles.input}
          placeholder="you@college.edu"
          placeholderTextColor="#9CA3AF"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !email && styles.btnDisabled]}
          onPress={sendLink}
          disabled={!email || loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Reset Link</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFF" },
  inner: { flex: 1, padding: 24, paddingTop: 60 },
  center: { flex: 1, backgroundColor: "#F8FAFF", padding: 32, justifyContent: "center", alignItems: "center" },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center", marginBottom: 32 },
  iconWrap: { width: 72, height: 72, borderRadius: 20, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  successIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  heading: { fontSize: 24, fontWeight: "700", color: "#111827", letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: "#6B7280", lineHeight: 22, marginBottom: 28, textAlign: "center" },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", marginBottom: 20 },
  btn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  btnDisabled: { backgroundColor: "#A5B4FC" },
  error: { color: "#DC2626", fontSize: 13, marginTop: -12, marginBottom: 16 },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

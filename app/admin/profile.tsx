import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { updateMyName, changeMyPassword } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, PrimaryButton, LabeledInput, Initials } from "@/components/StaffUI";

const ROLE_LABEL: Record<string, string> = { admin: "Organizer", super_admin: "Super admin", event_head: "Event head" };

export default function OrganizerProfile() {
  const { user, logout, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [savingName, setSavingName] = useState(false);
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveName = async () => {
    if (name.trim().length < 2) { Alert.alert("Please enter your name."); return; }
    setSavingName(true);
    try { await updateMyName(name.trim()); await refreshUser(); Alert.alert("Saved", "Your name was updated."); }
    catch (e: any) { Alert.alert("Could not save", e.message ?? "Please try again."); }
    finally { setSavingName(false); }
  };

  const savePw = async () => {
    if (pw.length < 6) { Alert.alert("Password too short", "Use at least 6 characters."); return; }
    if (pw !== pw2) { Alert.alert("Passwords do not match"); return; }
    setSavingPw(true);
    try { await changeMyPassword(pw); setPw(""); setPw2(""); Alert.alert("Password changed", "Use your new password next time you sign in."); }
    catch (e: any) { Alert.alert("Could not change password", e.message ?? "Please try again."); }
    finally { setSavingPw(false); }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="My profile" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Card>
            <View style={styles.top}>
              <Initials name={user?.name ?? "?"} size={64} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{user?.name}</Text>
                <Text style={styles.email}>{user?.email}</Text>
                <View style={styles.role}><Text style={styles.roleTxt}>{ROLE_LABEL[user?.role ?? ""] ?? user?.role}</Text></View>
              </View>
            </View>
            <LabeledInput label="Your name" value={name} onChangeText={setName} placeholder="Your name" />
            <PrimaryButton label="Save name" onPress={saveName} busy={savingName} disabled={name.trim() === user?.name} />
          </Card>

          <Card>
            <Text style={styles.section}>Change password</Text>
            <LabeledInput label="New password" value={pw} onChangeText={setPw} secureTextEntry placeholder="At least 6 characters" autoCapitalize="none" />
            <LabeledInput label="Confirm new password" value={pw2} onChangeText={setPw2} secureTextEntry placeholder="Type it again" autoCapitalize="none" />
            <PrimaryButton label="Change password" tone="light" onPress={savePw} busy={savingPw} disabled={!pw} />
          </Card>

          <PrimaryButton label="Sign out" icon="log-out-outline" tone="red" onPress={() => { logout(); router.replace("/login"); }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  top: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  name: { fontSize: 18, fontWeight: "800", color: "#111827" },
  email: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  role: { alignSelf: "flex-start", backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9, marginTop: 6 },
  roleTxt: { fontSize: 11.5, fontWeight: "800", color: "#4338CA" },
  section: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 12 },
});

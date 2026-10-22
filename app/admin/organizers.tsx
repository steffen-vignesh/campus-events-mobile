import { useCallback, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, Alert, Share, Modal, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { type StaffProfile, getAllOrganizers, createOrganizer } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { PrimaryButton, LabeledInput, Chips, SearchBar, Empty, Initials } from "@/components/StaffUI";

const ROLE_LABEL: Record<string, string> = { admin: "Organizer", super_admin: "Super admin", event_head: "Event head" };

// Super admin only: see who can manage events and add new organizers or event heads.
export default function OrganizersScreen() {
  const [people, setPeople] = useState<StaffProfile[] | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dept, setDept] = useState("");
  const [role, setRole] = useState<"admin" | "event_head">("admin");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<{ email: string; password: string; name: string } | null>(null);

  const load = useCallback(() => { getAllOrganizers().then(setPeople).catch(() => setPeople([])); }, []);
  useFocusEffect(load);

  const shown = (people ?? []).filter((p) => {
    const t = q.trim().toLowerCase();
    return !t || p.name.toLowerCase().includes(t) || p.email.toLowerCase().includes(t);
  });

  const add = async () => {
    if (!name.trim() || !email.trim()) { Alert.alert("Please add a name and an email."); return; }
    setBusy(true);
    try {
      const r = await createOrganizer({ name: name.trim(), email: email.trim(), department: dept.trim() || undefined, role });
      setCreated(r); load();
    } catch (e: any) {
      Alert.alert("Could not add this person", e.message ?? "Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const close = () => { setOpen(false); setCreated(null); setName(""); setEmail(""); setDept(""); setRole("admin"); };

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Organizers" subtitle="People who can manage events" />
      <View style={styles.pad}>
        <PrimaryButton label="Add a person" icon="person-add-outline" onPress={() => setOpen(true)} />
        <View style={{ height: 12 }} />
        <SearchBar value={q} onChangeText={setQ} placeholder="Search name or email" />
      </View>
      {people === null ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <FlatList
          data={shown}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Empty icon="people-outline" title="Nobody found" />}
          renderItem={({ item: p }) => (
            <View style={styles.row}>
              <Initials name={p.name} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{p.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{p.email}</Text>
              </View>
              <View style={styles.role}><Text style={styles.roleTxt}>{ROLE_LABEL[p.role] ?? p.role}</Text></View>
            </View>
          )}
        />
      )}

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {created ? (
                <>
                  <Text style={styles.sheetTitle}>Account created</Text>
                  <Text style={styles.note}>Share these login details with {created.name.split(" ")[0]}. The password is shown only now.</Text>
                  <View style={styles.cred}><Text style={styles.credLbl}>Email</Text><Text style={styles.credVal}>{created.email}</Text><Text style={[styles.credLbl, { marginTop: 10 }]}>Temporary password</Text><Text style={styles.credVal} selectable>{created.password}</Text></View>
                  <PrimaryButton label="Share login details" icon="share-outline" onPress={() => Share.share({ message: `Spirits login\nEmail: ${created.email}\nPassword: ${created.password}\nSign in at https://campus-events-peach.vercel.app/login or in the Spirits app.` })} />
                  <View style={{ height: 10 }} />
                  <PrimaryButton label="Done" tone="light" onPress={close} />
                </>
              ) : (
                <>
                  <Text style={styles.sheetTitle}>Add a person</Text>
                  <Text style={styles.label}>Role</Text>
                  <Chips<"admin" | "event_head"> options={[{ key: "admin", label: "Organizer (all events)" }, { key: "event_head", label: "Event head (one event)" }]} value={role} onChange={setRole} />
                  <LabeledInput label="Full name *" value={name} onChangeText={setName} placeholder="Name" />
                  <LabeledInput label="Email *" value={email} onChangeText={setEmail} placeholder="name@example.com" autoCapitalize="none" keyboardType="email-address" />
                  <LabeledInput label="Department (optional)" value={dept} onChangeText={setDept} placeholder="e.g. International Office" />
                  <View style={{ flexDirection: "row", gap: 10 }}>
                    <View style={{ flex: 1 }}><PrimaryButton label="Cancel" tone="light" onPress={close} /></View>
                    <View style={{ flex: 1.4 }}><PrimaryButton label="Create account" onPress={add} busy={busy} /></View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  pad: { paddingHorizontal: 20 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: "#EEF0F6" },
  name: { fontSize: 15, fontWeight: "700", color: "#111827" },
  meta: { fontSize: 12.5, color: "#6B7280", marginTop: 1 },
  role: { backgroundColor: "#EEF2FF", paddingHorizontal: 9, paddingVertical: 4, borderRadius: 9 },
  roleTxt: { fontSize: 11, fontWeight: "800", color: "#4338CA" },
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.5)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, maxHeight: "92%" },
  sheetTitle: { fontSize: 19, fontWeight: "800", color: "#111827", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
  note: { fontSize: 13.5, color: "#6B7280", marginBottom: 12, lineHeight: 20 },
  cred: { backgroundColor: "#F3F4F6", borderRadius: 14, padding: 14, marginBottom: 14 },
  credLbl: { fontSize: 11.5, fontWeight: "800", color: "#6B7280" },
  credVal: { fontSize: 16, fontWeight: "700", color: "#111827", marginTop: 2 },
});

import { useState } from "react";
import { View, Text, TouchableOpacity, TextInput, Modal, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from "react-native";

export const CANCEL_REASONS = ["I am sick", "Schedule clash", "I changed my mind", "Transport problem", "Other"];

type Props = {
  visible: boolean;
  mode: "seat" | "waitlist";
  eventTitle: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

// Asks a student why they are cancelling. A reason is required for a real seat and optional for the waiting list.
export function CancelRegistrationModal({ visible, mode, eventTitle, busy, error, onClose, onConfirm }: Props) {
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  const required = mode === "seat";
  const reason = choice === "Other" ? other.trim() : choice;
  const ok = !required || reason.length >= 3;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.overlay}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>{mode === "seat" ? "Cancel your registration?" : "Leave the waiting list?"}</Text>
            <Text style={styles.sub} numberOfLines={2}>{eventTitle}</Text>

            <Text style={styles.label}>{required ? "Please tell us why you are cancelling *" : "Reason (optional)"}</Text>
            <View style={styles.chips}>
              {CANCEL_REASONS.map((r) => (
                <TouchableOpacity key={r} style={[styles.chip, choice === r && styles.chipOn]} onPress={() => setChoice(choice === r ? "" : r)} accessibilityLabel={r}>
                  <Text style={[styles.chipTxt, choice === r && styles.chipTxtOn]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {choice === "Other" && (
              <TextInput
                style={styles.input}
                value={other}
                onChangeText={setOther}
                placeholder="Write your reason"
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={300}
              />
            )}
            {mode === "seat" && <Text style={styles.note}>Your seat goes to the next person on the waiting list. The organizer sees your reason.</Text>}
            {error ? <Text style={styles.error}>{error}</Text> : null}

            <View style={styles.row}>
              <TouchableOpacity style={styles.keep} onPress={onClose} disabled={busy}>
                <Text style={styles.keepTxt}>Keep it</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.cancel, (!ok || busy) && { opacity: 0.5 }]} onPress={() => onConfirm(reason)} disabled={!ok || busy} accessibilityLabel="Confirm cancel">
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.cancelTxt}>{mode === "seat" ? "Cancel registration" : "Leave list"}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(17,24,39,0.5)" },
  sheet: { backgroundColor: "#fff", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 32, maxHeight: "88%" },
  title: { fontSize: 19, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 3, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 11, borderRadius: 22, borderWidth: 1.5, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  chipOn: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  chipTxt: { fontSize: 13.5, fontWeight: "600", color: "#4B5563" },
  chipTxtOn: { color: "#4338CA" },
  input: { backgroundColor: "#F9FAFB", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827", minHeight: 80, textAlignVertical: "top", marginBottom: 12 },
  note: { fontSize: 12.5, color: "#6B7280", marginBottom: 10 },
  error: { fontSize: 13, color: "#DC2626", marginBottom: 10 },
  row: { flexDirection: "row", gap: 10, marginTop: 6 },
  keep: { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", alignItems: "center" },
  keepTxt: { fontSize: 15, fontWeight: "700", color: "#4B5563" },
  cancel: { flex: 1.3, paddingVertical: 15, borderRadius: 14, backgroundColor: "#DC2626", alignItems: "center", justifyContent: "center" },
  cancelTxt: { fontSize: 15, fontWeight: "800", color: "#fff" },
});

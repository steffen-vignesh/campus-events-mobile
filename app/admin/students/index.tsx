import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { type StaffProfile, getAllStudents } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { SearchBar, Empty, Initials } from "@/components/StaffUI";

export default function StudentsScreen() {
  const [students, setStudents] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    getAllStudents().then(setStudents).catch(console.error).finally(() => setLoading(false));
  }, []);

  const shown = students.filter((s) => {
    const t = q.trim().toLowerCase();
    return !t || s.name.toLowerCase().includes(t) || s.email.toLowerCase().includes(t) || (s.study_program ?? s.department ?? "").toLowerCase().includes(t);
  });

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Students" subtitle={loading ? "" : `${students.length} registered students`} />
      <View style={styles.pad}>
        <SearchBar value={q} onChangeText={setQ} placeholder="Search name, email or study program" />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <FlatList
          data={shown}
          keyExtractor={(s) => s.id}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={<Empty icon="people-outline" title="No students found" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => router.push(`/admin/students/${item.id}` as any)} activeOpacity={0.8} accessibilityLabel={item.name}>
              <Initials name={item.name} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.email}</Text>
                {(item.study_program || item.department) ? <Text style={styles.meta} numberOfLines={1}>{item.study_program ?? item.department}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          )}
        />
      )}
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
});

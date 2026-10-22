import { useCallback, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { type StaffJob, getJobs, deleteJob } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, PrimaryButton, Empty } from "@/components/StaffUI";

export default function JobsScreen() {
  const [jobs, setJobs] = useState<StaffJob[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    getJobs().then(setJobs).catch(console.error).finally(() => setLoading(false));
  }, []));

  const remove = (j: StaffJob) =>
    Alert.alert("Delete this job?", `"${j.title}" and its applications will be removed.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteJob(j.id); setJobs((p) => p.filter((x) => x.id !== j.id)); }
        catch (e: any) { Alert.alert("Could not delete", e.message ?? "Please try again."); }
      } },
    ]);

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Jobs" subtitle="Jobs and internships for students" />
      <View style={styles.pad}>
        <PrimaryButton label="Post a new job" icon="add-circle-outline" onPress={() => router.push("/admin/jobs/new" as any)} />
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <FlatList
          data={jobs}
          keyExtractor={(j) => j.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Empty icon="briefcase-outline" title="No jobs yet" sub="Post a job and students can apply from the app." />}
          renderItem={({ item: j }) => (
            <Card>
              <View style={styles.head}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{j.title}</Text>
                  <Text style={styles.sub}>{j.company} · {j.location}</Text>
                </View>
                <View style={styles.type}><Text style={styles.typeTxt}>{j.type}</Text></View>
              </View>
              <Text style={styles.meta}>
                {j.salary_range ? `${j.salary_range} · ` : ""}{j.deadline ? `Apply by ${format(parseISO(j.deadline), "d MMM yyyy")}` : "No deadline"}
              </Text>
              <View style={styles.actions}>
                <TouchableOpacity style={styles.act} onPress={() => router.push(`/admin/jobs/${j.id}/applicants` as any)} accessibilityLabel="See applicants">
                  <Ionicons name="people-outline" size={18} color="#4F46E5" /><Text style={styles.actTxt}>Applicants</Text>
                </TouchableOpacity>
                {j.apply_link ? (
                  <TouchableOpacity style={styles.act} onPress={() => Linking.openURL(j.apply_link!)} accessibilityLabel="Open apply link">
                    <Ionicons name="open-outline" size={18} color="#4F46E5" /><Text style={styles.actTxt}>Link</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity style={[styles.act, { backgroundColor: "#FEF2F2" }]} onPress={() => remove(j)} accessibilityLabel="Delete job">
                  <Ionicons name="trash-outline" size={18} color="#DC2626" /><Text style={[styles.actTxt, { color: "#DC2626" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  pad: { paddingHorizontal: 20, marginBottom: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  head: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  title: { fontSize: 16, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 13, color: "#6B7280", marginTop: 2 },
  type: { backgroundColor: "#EEF2FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  typeTxt: { fontSize: 11.5, fontWeight: "800", color: "#4338CA" },
  meta: { fontSize: 12.5, color: "#6B7280", marginTop: 8 },
  actions: { flexDirection: "row", gap: 8, marginTop: 12 },
  act: { flex: 1, flexDirection: "row", gap: 6, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2FF", borderRadius: 12, paddingVertical: 11 },
  actTxt: { fontSize: 12.5, fontWeight: "800", color: "#4F46E5" },
});

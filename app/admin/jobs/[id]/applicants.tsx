import { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type StaffJob, type JobApplication, getJob, getJobApplications } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { Card, Empty, Initials } from "@/components/StaffUI";

export default function ApplicantsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<StaffJob | null>(null);
  const [apps, setApps] = useState<JobApplication[] | null>(null);

  useEffect(() => {
    if (!id) return;
    getJob(id).then(setJob).catch(console.error);
    getJobApplications(id).then(setApps).catch(() => setApps([]));
  }, [id]);

  return (
    <SafeAreaView style={styles.safe}>
      <StaffHeader title="Applicants" subtitle={job?.title} />
      {apps === null ? <View style={styles.center}><ActivityIndicator size="large" color="#4F46E5" /></View> : (
        <FlatList
          data={apps}
          keyExtractor={(a) => a.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={<Text style={styles.count}>{apps.length} applicant{apps.length === 1 ? "" : "s"}</Text>}
          ListEmptyComponent={<Empty icon="people-outline" title="No applicants yet" sub="Students who apply will show up here." />}
          renderItem={({ item: a }) => (
            <Card>
              <View style={styles.top}>
                <Initials name={a.student_name} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{a.student_name}</Text>
                  <Text style={styles.date}>Applied {format(new Date(a.created_at), "d MMM yyyy, HH:mm")}</Text>
                </View>
              </View>
              <View style={styles.contact}>
                <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`mailto:${a.student_email}`)} accessibilityLabel={`Email ${a.student_name}`}>
                  <Ionicons name="mail-outline" size={18} color="#4F46E5" /><Text style={styles.btnTxt} numberOfLines={1}>{a.student_email}</Text>
                </TouchableOpacity>
                {a.student_phone ? (
                  <TouchableOpacity style={styles.btn} onPress={() => Linking.openURL(`tel:${a.student_phone}`)} accessibilityLabel={`Call ${a.student_name}`}>
                    <Ionicons name="call-outline" size={18} color="#4F46E5" /><Text style={styles.btnTxt}>{a.student_phone}</Text>
                  </TouchableOpacity>
                ) : null}
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
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 30 },
  count: { fontSize: 13.5, fontWeight: "700", color: "#6B7280", marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  name: { fontSize: 15.5, fontWeight: "800", color: "#111827" },
  date: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  contact: { gap: 8, marginTop: 12 },
  btn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12 },
  btnTxt: { fontSize: 13.5, fontWeight: "700", color: "#4338CA", flex: 1 },
});

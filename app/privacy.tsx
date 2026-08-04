import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  { title: "1. Information We Collect", body: "We collect information you provide during registration (name, email, department, year), event registrations, and app usage patterns to improve our services." },
  { title: "2. How We Use Your Information", body: "Your information is used to manage your account, process event registrations, send notifications about events you're interested in, and improve the platform." },
  { title: "3. Data Sharing", body: "We do not sell your personal data to third parties. Event organizers can see your registration details (name, email, department) for events you register for." },
  { title: "4. Data Security", body: "We implement industry-standard security measures to protect your data. However, no method of transmission over the internet is 100% secure." },
  { title: "5. Cookies & Analytics", body: "We use analytics tools to understand app usage patterns. This data is anonymized and used solely for improving the platform experience." },
  { title: "6. Data Retention", body: "We retain your personal data for as long as your account is active. You can request deletion of your data by contacting our support team." },
  { title: "7. Your Rights", body: "You have the right to access, correct, or delete your personal information. Contact us at privacy@campusevents.edu to exercise these rights." },
  { title: "8. Children's Privacy", body: "CampusEvents is designed for college students (18+). We do not knowingly collect data from anyone under 18 years of age." },
  { title: "9. Changes to This Policy", body: "We may update this Privacy Policy periodically. We'll notify you of significant changes via the app or email." },
  { title: "10. Contact Us", body: "If you have questions about this Privacy Policy, please contact us at privacy@campusevents.edu or visit our campus administration office." },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={styles.updated}>Last updated: August 1, 2026</Text>
        {SECTIONS.map((s) => (
          <View key={s.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{s.title}</Text>
            <Text style={styles.sectionBody}>{s.body}</Text>
          </View>
        ))}
        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "800", color: "#111827" },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },
  updated: { fontSize: 12, color: "#9CA3AF", marginBottom: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 6 },
  sectionBody: { fontSize: 13, color: "#6B7280", lineHeight: 22 },
  spacer: { height: 32 },
});

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const SECTIONS = [
  { title: "1. Acceptance of Terms", body: "By accessing and using CampusEvents, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use the application." },
  { title: "2. Use of Service", body: "CampusEvents is provided for educational and campus event management purposes only. Users must not misuse the platform for any unlawful or prohibited activities." },
  { title: "3. Account Registration", body: "You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials." },
  { title: "4. Event Registration", body: "By registering for an event, you agree to attend. Cancellations should be made at least 24 hours before the event. Refund policies are set by individual event organizers." },
  { title: "5. User Conduct", body: "Users must treat all other members with respect. Harassment, spam, or any form of misconduct will result in immediate account suspension." },
  { title: "6. Intellectual Property", body: "All content on CampusEvents, including logos, designs, and software, is the property of the platform and may not be reproduced without permission." },
  { title: "7. Privacy", body: "Your use of CampusEvents is subject to our Privacy Policy. By using the service, you consent to the collection and use of your data as described therein." },
  { title: "8. Limitation of Liability", body: "CampusEvents is not liable for any indirect, incidental, or consequential damages arising from your use of the platform or attendance at any event." },
  { title: "9. Modifications", body: "We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the revised terms." },
  { title: "10. Governing Law", body: "These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in the applicable jurisdiction." },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Terms & Conditions</Text>
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

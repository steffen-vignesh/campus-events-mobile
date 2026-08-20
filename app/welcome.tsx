import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }[] = [
  {
    icon: "calendar",
    title: "Know what's on, instantly",
    body: "No more finding out an event happened after it's over.",
  },
  {
    icon: "qr-code",
    title: "Walk in, you're marked present",
    body: "Scan at the door — no queues, no sign-in sheets.",
  },
  {
    icon: "notifications",
    title: "Nothing sneaks up on you",
    body: "A nudge before it starts, an alert if anything changes.",
  },
];

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>Built after one too many events found out about too late</Text>
        </View>

        <View style={styles.logoBadge}>
          <Ionicons name="school" size={30} color="#fff" />
        </View>

        <Text style={styles.heading}>Never miss what&apos;s{"\n"}happening on campus.</Text>
        <Text style={styles.sub}>
          You shouldn&apos;t have to scroll five WhatsApp groups to find out what you already missed.
          One tap to see what&apos;s on, one tap to be there.
        </Text>

        <View style={styles.features}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color="#4F46E5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureBody}>{f.body}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.stats}>
          {[
            { number: "50+", label: "Events / Month" },
            { number: "1,500+", label: "Students" },
            { number: "100%", label: "Free" },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statNumber}>{s.number}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => router.push("/register")}>
          <Text style={styles.primaryBtnTxt}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={() => router.push("/login")}>
          <Text style={styles.secondaryBtnTxt}>Log in</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  scroll: { padding: 24, paddingTop: 12, alignItems: "center" },
  badge: { backgroundColor: "#EEF2FF", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 20 },
  badgeTxt: { color: "#4338CA", fontSize: 11, fontWeight: "700", textAlign: "center" },
  logoBadge: { width: 64, height: 64, borderRadius: 18, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center", marginBottom: 20 },
  heading: { fontSize: 30, fontWeight: "800", color: "#111827", textAlign: "center", letterSpacing: -0.5, lineHeight: 36 },
  sub: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 21, marginTop: 12, marginBottom: 28, maxWidth: 340 },
  features: { width: "100%", gap: 16, marginBottom: 28 },
  featureRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F0F0F5" },
  featureIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  featureTitle: { fontSize: 14, fontWeight: "700", color: "#111827" },
  featureBody: { fontSize: 12, color: "#6B7280", marginTop: 2, lineHeight: 17 },
  stats: { flexDirection: "row", gap: 28, marginBottom: 8 },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 18, fontWeight: "800", color: "#111827" },
  statLabel: { fontSize: 10, color: "#9CA3AF", marginTop: 2, fontWeight: "600" },
  ctaBar: { padding: 20, paddingBottom: 28, gap: 10, borderTopWidth: 1, borderTopColor: "#F0F0F5", backgroundColor: "#F8FAFF" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#4F46E5", borderRadius: 16, paddingVertical: 15 },
  primaryBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
  secondaryBtn: { alignItems: "center", justifyContent: "center", borderRadius: 16, paddingVertical: 15, borderWidth: 1.5, borderColor: "#E5E7EB" },
  secondaryBtnTxt: { color: "#374151", fontWeight: "700", fontSize: 15 },
});

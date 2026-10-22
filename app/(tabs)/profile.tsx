import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { getMyRegistrations, getAdaptedEvents, getMyBookmarks } from "@/lib/db";
import { isEventPast } from "@/lib/mock-data";
import { Avatar } from "@/components/Avatar";
import { NotificationBell } from "@/components/NotificationBell";

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [attendedCount, setAttendedCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    Promise.all([getAdaptedEvents(), getMyRegistrations(), getMyBookmarks()])
      .then(([events, allRegs, bms]) => {
        const regs = allRegs.filter((r) => r.status === "confirmed");
        const upcoming = regs.filter((r) => {
          const evt = events.find((e) => e.id === r.event_id);
          return evt && !isEventPast(evt);
        }).length;
        const attended = regs.filter((r) => {
          const evt = events.find((e) => e.id === r.event_id);
          return evt && isEventPast(evt);
        }).length;
        setUpcomingCount(upcoming);
        setAttendedCount(attended);
        setSavedCount(bms.length);
      })
      .catch(console.error);
  }, []);

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { logout(); router.replace("/login"); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8 }}>
        <Text style={{ fontSize: 22, fontWeight: "800", color: "#111827" }}>Profile</Text>
        <NotificationBell />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          {user && <Avatar userId={user.id} name={user.name} size={80} />}
          <View style={{ height: 12 }} />
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={user?.role === "admin" ? "briefcase" : "school"} size={13} color="#4F46E5" />
            <Text style={styles.roleText}>{user?.role === "admin" ? "Organizer / Faculty" : "Student"}</Text>
          </View>
          {[user?.studyProgram, user?.studentStatus, user?.homeCountry].filter(Boolean).map((v) => (
            <Text key={v} style={styles.dept}>{v}</Text>
          ))}
          {user?.germanLevel && <Text style={styles.dept}>German: {user.germanLevel}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{upcomingCount}</Text>
            <Text style={styles.statLbl}>Upcoming</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{attendedCount}</Text>
            <Text style={styles.statLbl}>Attended</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBox}>
            <Text style={styles.statNum}>{savedCount}</Text>
            <Text style={styles.statLbl}>Saved</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push("/edit-profile" as never)} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push("/notifications" as never)} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push("/privacy")} />
          <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push("/terms")} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Spirits v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon as any} size={20} color="#4F46E5" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  profileCard: { alignItems: "center", backgroundColor: "#fff", margin: 20, borderRadius: 24, padding: 28, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarTxt: { fontSize: 28, fontWeight: "800", color: "#4F46E5" },
  name: { fontSize: 20, fontWeight: "800", color: "#111827" },
  email: { fontSize: 13, color: "#9CA3AF", marginTop: 4 },
  roleBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#EEF2FF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 10 },
  roleText: { fontSize: 12, fontWeight: "700", color: "#4F46E5" },
  dept: { fontSize: 12, color: "#6B7280", marginTop: 8 },
  statsRow: { flexDirection: "row", backgroundColor: "#fff", marginHorizontal: 20, borderRadius: 20, padding: 16, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  statBox: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800", color: "#111827" },
  statLbl: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginTop: 2 },
  divider: { width: 1, backgroundColor: "#E5E7EB" },
  menu: { marginHorizontal: 20, backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  menuIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: "#374151" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginHorizontal: 20, paddingVertical: 14, borderRadius: 16, borderWidth: 1.5, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5", marginBottom: 16 },
  logoutTxt: { fontSize: 15, fontWeight: "700", color: "#EF4444" },
  version: { textAlign: "center", fontSize: 12, color: "#D1D5DB", marginBottom: 32 },
});

import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  SafeAreaView, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/auth-context";
import { MOCK_EVENTS, isEventPast } from "@/lib/mock-data";

const registeredIds = ["e1", "e3"];
const attendedIds = ["e7", "e9", "e10"];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => { logout(); router.replace("/login"); } },
    ]);
  };

  const upcomingCount = MOCK_EVENTS.filter((e) => registeredIds.includes(e.id) && !isEventPast(e)).length;
  const attendedCount = attendedIds.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{user?.name.slice(0, 2).toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Ionicons name={user?.role === "admin" ? "briefcase" : "school"} size={13} color="#4F46E5" />
            <Text style={styles.roleText}>{user?.role === "admin" ? "Organizer / Faculty" : "Student"}</Text>
          </View>
          {user?.department && (
            <Text style={styles.dept}>{user.department}{user.year ? ` · ${user.year}` : ""}</Text>
          )}
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
            <Text style={styles.statNum}>2</Text>
            <Text style={styles.statLbl}>Saved</Text>
          </View>
        </View>

        {/* Menu items */}
        <View style={styles.menu}>
          <MenuItem icon="person-outline" label="Edit Profile" onPress={() => {}} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <MenuItem icon="shield-checkmark-outline" label="Privacy Policy" onPress={() => router.push("/privacy")} />
          <MenuItem icon="document-text-outline" label="Terms & Conditions" onPress={() => router.push("/terms")} />
          <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>CampusEvents v1.0.0</Text>
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

import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View, StyleSheet } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getMyNotifications } from "@/lib/db";

// Bell shown at the top of every student screen. The red badge counts unread
// messages; tapping opens the inbox with everything organizers have sent.
export function NotificationBell() {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(() => {
    getMyNotifications().then((n) => setUnread(n.filter((x) => !x.read).length));
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
      const t = setInterval(refresh, 30000);
      return () => clearInterval(t);
    }, [refresh])
  );

  return (
    <TouchableOpacity
      onPress={() => router.push("/notifications" as never)}
      accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      style={styles.btn}
    >
      <Ionicons name="notifications-outline" size={20} color="#374151" />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB" },
  badge: { position: "absolute", top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 9, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  badgeTxt: { color: "#fff", fontSize: 10, fontWeight: "800" },
});

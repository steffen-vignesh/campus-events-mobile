import { Redirect } from "expo-router";
import { useAuth, isStaffRole } from "@/contexts/auth-context";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user) return <Redirect href="/welcome" />;
  if (isStaffRole(user.role)) return <Redirect href="/admin" />;
  return <Redirect href="/(tabs)/events" />;
}

import { Stack, Redirect } from "expo-router";
import { useAuth, isStaffRole } from "@/contexts/auth-context";
import { View, ActivityIndicator } from "react-native";

export default function AdminLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!user || !isStaffRole(user.role)) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="events/index" />
      <Stack.Screen name="events/new" />
      <Stack.Screen name="events/[id]/index" />
      <Stack.Screen name="events/[id]/edit" />
      <Stack.Screen name="events/[id]/checkin" />
      <Stack.Screen name="events/[id]/registrants" />
      <Stack.Screen name="events/[id]/announce" />
      <Stack.Screen name="events/[id]/survey" />
    </Stack>
  );
}

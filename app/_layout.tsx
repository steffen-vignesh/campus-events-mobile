import { useEffect } from "react";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "@/contexts/auth-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const eventId = response.notification.request.content.data?.eventId as string | undefined;
      router.push((eventId ? `/(tabs)/events/${eventId}` : "/notifications") as never);
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="welcome" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="admin" />
            <Stack.Screen name="scan" options={{ presentation: "fullScreenModal" }} />
            <Stack.Screen name="attend/[eventId]" options={{ presentation: "modal" }} />
            <Stack.Screen name="survey/[id]" />
            <Stack.Screen name="edit-profile" />
            <Stack.Screen name="notifications" />
          </Stack>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

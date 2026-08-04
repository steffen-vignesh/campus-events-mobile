import { Stack } from "expo-router";
import { AuthProvider } from "@/contexts/auth-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="admin" />
      </Stack>
    </AuthProvider>
  );
}

import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "@/lib/supabase";

// Show alerts even while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Asks for permission and saves this phone's push token, so organizers' messages
// arrive as real phone notifications. Push is optional: any failure is ignored
// and the in-app inbox keeps working.
export async function registerForPushNotifications(): Promise<void> {
  try {
    if (!Device.isDevice) return; // simulators cannot receive remote push
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Event updates",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== "granted") return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await supabase.rpc("register_push_token", { p_token: token, p_platform: Platform.OS });
  } catch {
    /* ignore */
  }
}

import { useState } from "react";
import { Image, View, StyleProp, ImageStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Shows the event image, or a placeholder when the link is missing, isn't an
// http(s) URL, or fails to load.
export function EventImage({ uri, style }: { uri?: string | null; style: StyleProp<ImageStyle> }) {
  const [failed, setFailed] = useState(false);
  const valid = !!uri && /^https?:\/\//i.test(uri.trim());
  if (!valid || failed) {
    return (
      <View style={[style as object, { backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="calendar" size={28} color="#A5B4FC" />
      </View>
    );
  }
  return <Image source={{ uri: uri!.trim() }} style={style} onError={() => setFailed(true)} />;
}

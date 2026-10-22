import { useState } from "react";
import { Image, View, StyleProp, ImageStyle, ViewStyle, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  uri?: string | null;
  style: StyleProp<ImageStyle>;
  // "cover" fills the box and may crop (small thumbnails).
  // "contain" shows the whole picture on a soft blurred backdrop (banners and posters).
  fit?: "cover" | "contain";
};

const isHttp = (u?: string | null): u is string => !!u && /^https?:\/\//i.test(u.trim());

// Shows the event image, or a placeholder when the link is missing, isn't an
// http(s) URL, or fails to load.
export function EventImage({ uri, style, fit = "cover" }: Props) {
  const [failed, setFailed] = useState(false);
  if (!isHttp(uri) || failed) {
    return (
      <View style={[style as ViewStyle, { backgroundColor: "#E0E7FF", alignItems: "center", justifyContent: "center" }]}>
        <Ionicons name="calendar" size={28} color="#A5B4FC" />
      </View>
    );
  }
  const url = uri.trim();
  if (fit === "contain") {
    return (
      <View style={[style as ViewStyle, { backgroundColor: "#F3F4F6", overflow: "hidden" }]}>
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="cover" blurRadius={25} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.25)" }]} />
        <Image source={{ uri: url }} style={StyleSheet.absoluteFill} resizeMode="contain" onError={() => setFailed(true)} />
      </View>
    );
  }
  return <Image source={{ uri: url }} style={style} onError={() => setFailed(true)} />;
}

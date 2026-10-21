import { useState } from "react";
import { Image, Text, View } from "react-native";
import { SUPABASE_URL } from "@/lib/config";

export function Avatar({ userId, name, size = 80, version = 0 }: { userId: string; name: string; size?: number; version?: number }) {
  const [failed, setFailed] = useState(false);
  const uri = `${SUPABASE_URL}/storage/v1/object/public/avatars/${userId}${version ? `?v=${version}` : ""}`;
  const radius = size / 2;
  if (failed) {
    return (
      <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: size * 0.35, fontWeight: "800", color: "#4F46E5" }}>{name.slice(0, 2).toUpperCase()}</Text>
      </View>
    );
  }
  return <Image key={version} source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} onError={() => setFailed(true)} />;
}

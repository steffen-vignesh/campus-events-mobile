import * as ImagePicker from "expo-image-picker";
import { supabase } from "@/lib/supabase";
import { WEB_URL } from "@/lib/config";

export type PickedImage = ImagePicker.ImagePickerAsset;

export async function pickImage(aspect: [number, number]): Promise<PickedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect,
    quality: 0.6,
  });
  if (res.canceled || !res.assets[0]) return null;
  return res.assets[0];
}

// Uploads through the web app's /api/upload (same rules as the website:
// banners are organizer-only, 4 MB max). Returns the public image URL.
export async function uploadImage(asset: PickedImage, kind: "avatar" | "banner"): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in.");
  const type = asset.mimeType ?? "image/jpeg";
  const body = new FormData();
  body.append("file", { uri: asset.uri, name: `upload.${type.split("/")[1] ?? "jpg"}`, type } as unknown as Blob);
  body.append("kind", kind);
  const res = await fetch(`${WEB_URL}/api/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Upload failed.");
  return json.url as string;
}

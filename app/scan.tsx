import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

// QR codes encode a full check-in URL, e.g. https://campus-events-peach.vercel.app/attend/<eventId>
function extractEventId(scanned: string): string | null {
  const match = scanned.match(/\/attend\/([^/?#]+)/);
  if (match) return decodeURIComponent(match[1]);
  // Fall back to treating the whole payload as a raw event id (e.g. testing with a plain QR code).
  if (/^[a-zA-Z0-9-]+$/.test(scanned.trim())) return scanned.trim();
  return null;
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scanError, setScanError] = useState("");

  const handleScan = ({ data }: BarcodeScanningResult) => {
    if (scanned) return;
    const eventId = extractEventId(data);
    if (!eventId) {
      setScanError("That QR code doesn't look like a CampusEvents check-in code.");
      return;
    }
    setScanned(true);
    router.replace(`/attend/${eventId}`);
  };

  if (!permission) {
    return <SafeAreaView style={styles.safe} />;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.permWrap}>
          <Ionicons name="camera-outline" size={48} color="#9CA3AF" />
          <Text style={styles.permTitle}>Camera access needed</Text>
          <Text style={styles.permSub}>
            CampusEvents needs your camera to scan the check-in QR code at the venue.
          </Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnTxt}>Grant Camera Access</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={scanned ? undefined : handleScan}
      />

      <SafeAreaView style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.frameWrap}>
          <View style={styles.frame} />
          <Text style={styles.hint}>Point your camera at the event check-in QR code</Text>
          {scanError !== "" && (
            <View style={styles.errorBox}>
              <Text style={styles.errorTxt}>{scanError}</Text>
              <TouchableOpacity onPress={() => setScanError("")}>
                <Text style={styles.errorDismiss}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomSpace} />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  overlay: { flex: 1, justifyContent: "space-between" },
  topBar: { flexDirection: "row", justifyContent: "flex-end", padding: 16 },
  closeBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" },
  frameWrap: { alignItems: "center", justifyContent: "center", gap: 20, paddingHorizontal: 32 },
  frame: { width: 240, height: 240, borderRadius: 24, borderWidth: 3, borderColor: "rgba(255,255,255,0.85)" },
  hint: { color: "#fff", fontSize: 14, textAlign: "center", fontWeight: "500" },
  errorBox: { backgroundColor: "rgba(239,68,68,0.9)", borderRadius: 14, padding: 12, alignItems: "center", gap: 4 },
  errorTxt: { color: "#fff", fontSize: 13, textAlign: "center" },
  errorDismiss: { color: "#fff", fontSize: 13, fontWeight: "700", textDecorationLine: "underline" },
  bottomSpace: { height: 80 },
  permWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40, gap: 10 },
  permTitle: { fontSize: 17, fontWeight: "700", color: "#fff", marginTop: 6 },
  permSub: { fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20, marginBottom: 8 },
  permBtn: { backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 13, paddingHorizontal: 28, marginTop: 4 },
  permBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelTxt: { color: "#9CA3AF", fontSize: 14, marginTop: 14 },
});

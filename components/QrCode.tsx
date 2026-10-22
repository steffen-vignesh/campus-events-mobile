import { useMemo } from "react";
import { View } from "react-native";
import QRCode from "qrcode";

// Pure-JS QR renderer: draws each run of dark modules as one View.
export function QrCode({ value, size = 260 }: { value: string; size?: number }) {
  const { n, runs } = useMemo(() => {
    const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const runs: { r: number; c: number; w: number }[] = [];
    for (let r = 0; r < n; r++) {
      let c = 0;
      while (c < n) {
        if (qr.modules.get(r, c)) {
          let w = 1;
          while (c + w < n && qr.modules.get(r, c + w)) w++;
          runs.push({ r, c, w });
          c += w;
        } else c++;
      }
    }
    return { n, runs };
  }, [value]);
  const cell = size / n;
  return (
    <View style={{ width: size, height: size, backgroundColor: "#fff" }} accessibilityLabel="Check-in QR code">
      {runs.map((u, i) => (
        <View
          key={i}
          style={{ position: "absolute", left: u.c * cell, top: u.r * cell, width: u.w * cell + 0.5, height: cell + 0.5, backgroundColor: "#111827" }}
        />
      ))}
    </View>
  );
}

import { ReactNode } from "react";
import { View, Text, TouchableOpacity, TextInput, TextInputProps, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Small building blocks shared by the organizer screens, so they all look and behave the same.

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function PrimaryButton({ label, onPress, busy, disabled, tone = "indigo", icon }: {
  label: string; onPress: () => void; busy?: boolean; disabled?: boolean; tone?: "indigo" | "red" | "light"; icon?: keyof typeof Ionicons.glyphMap;
}) {
  const bg = tone === "red" ? "#DC2626" : tone === "light" ? "#EEF2FF" : "#4F46E5";
  const fg = tone === "light" ? "#4F46E5" : "#fff";
  return (
    <TouchableOpacity
      style={[s.btn, { backgroundColor: bg }, (disabled || busy) && { opacity: 0.5 }]}
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityLabel={label}
      activeOpacity={0.85}
    >
      {busy ? <ActivityIndicator color={fg} /> : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={fg} /> : null}
          <Text style={[s.btnTxt, { color: fg }]}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

export function LabeledInput({ label, ...props }: { label: string } & TextInputProps) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        placeholderTextColor="#9CA3AF"
        {...props}
        style={[s.input, props.multiline && { height: 110, textAlignVertical: "top" }, props.style]}
      />
    </View>
  );
}

export function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={s.search}>
      <Ionicons name="search" size={18} color="#9CA3AF" style={{ paddingHorizontal: 12 }} />
      <TextInput style={s.searchInput} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#9CA3AF" autoCapitalize="none" />
    </View>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: { key: T; label: string }[]; value: T; onChange: (k: T) => void }) {
  return (
    <View style={s.chips}>
      {options.map((o) => (
        <TouchableOpacity key={o.key} style={[s.chip, value === o.key && s.chipOn]} onPress={() => onChange(o.key)} accessibilityLabel={o.label}>
          <Text style={[s.chipTxt, value === o.key && s.chipTxtOn]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Empty({ icon, title, sub }: { icon: keyof typeof Ionicons.glyphMap; title: string; sub?: string }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={44} color="#D1D5DB" />
      <Text style={s.emptyTitle}>{title}</Text>
      {sub ? <Text style={s.emptySub}>{sub}</Text> : null}
    </View>
  );
}

export function Initials({ name, size = 44, bg = "#EEF2FF", color = "#4F46E5" }: { name: string; size?: number; bg?: string; color?: string }) {
  const t = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ fontSize: size * 0.32, fontWeight: "800", color }}>{t}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "#EEF0F6", marginBottom: 12 },
  btn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", borderRadius: 14, paddingVertical: 15, paddingHorizontal: 16 },
  btnTxt: { fontSize: 15, fontWeight: "800" },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 6 },
  input: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#E5E7EB", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: "#111827" },
  search: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 12, paddingRight: 12, fontSize: 15, color: "#111827" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1.5, borderColor: "#E5E7EB", backgroundColor: "#fff" },
  chipOn: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  chipTxt: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
  chipTxtOn: { color: "#4338CA" },
  empty: { alignItems: "center", paddingVertical: 48, gap: 6 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "#6B7280", marginTop: 8 },
  emptySub: { fontSize: 13, color: "#9CA3AF", textAlign: "center", paddingHorizontal: 24 },
});

import { Text, TouchableOpacity, View } from "react-native";

export function ChipSelect({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
      {options.map((o) => {
        const active = value === o;
        return (
          <TouchableOpacity
            key={o}
            onPress={() => onChange(active ? "" : o)}
            style={{
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5,
              borderColor: active ? "#4F46E5" : "#E5E7EB", backgroundColor: active ? "#EEF2FF" : "#fff",
            }}
          >
            <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? "#4338CA" : "#4B5563" }}>{o}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

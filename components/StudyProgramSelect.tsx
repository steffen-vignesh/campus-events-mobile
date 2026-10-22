import { useState } from "react";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import { STUDY_PROGRAMS, STUDY_OTHER_LABEL, isPresetProgram } from "@/lib/profile-options";

// Preset programmes plus "Other – please specify" with a free-text box.
// The stored value is the preset name or whatever the student typed.
export function StudyProgramSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [otherPicked, setOtherPicked] = useState(false);
  const isOther = otherPicked || (value !== "" && !isPresetProgram(value));

  const chip = (label: string, active: boolean, onPress: () => void) => (
    <TouchableOpacity
      key={label}
      onPress={onPress}
      accessibilityLabel={label}
      style={{
        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18, borderWidth: 1.5,
        borderColor: active ? "#4F46E5" : "#E5E7EB", backgroundColor: active ? "#EEF2FF" : "#fff",
      }}
    >
      <Text style={{ fontSize: 12.5, fontWeight: "600", color: active ? "#4338CA" : "#4B5563" }}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {STUDY_PROGRAMS.map((o) =>
          chip(o, !isOther && value === o, () => {
            setOtherPicked(false);
            onChange(value === o ? "" : o);
          })
        )}
        {chip(STUDY_OTHER_LABEL, isOther, () => {
          if (isOther) {
            setOtherPicked(false);
            onChange("");
          } else {
            setOtherPicked(true);
            onChange("");
          }
        })}
      </View>
      {isOther && (
        <TextInput
          value={isPresetProgram(value) ? "" : value}
          onChangeText={onChange}
          maxLength={100}
          placeholder="Your study programme / Dein Studiengang"
          placeholderTextColor="#9CA3AF"
          accessibilityLabel="Other study programme"
          style={{ backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#111827" }}
        />
      )}
    </View>
  );
}

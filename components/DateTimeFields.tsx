import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { addDays, addMonths, eachDayOfInterval, endOfMonth, format, isBefore, isSameDay, parseISO, startOfDay, startOfMonth, subMonths } from "date-fns";

// Tap-to-pick date and time (no typing). Pure JS, so no native module is needed.

export function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const selected = value ? parseISO(value) : null;
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(selected ?? new Date());
  const today = startOfDay(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });
  const lead = (startOfMonth(month).getDay() + 6) % 7; // Monday first
  const pick = (d: Date) => { onChange(format(d, "yyyy-MM-dd")); setOpen(false); };

  return (
    <View>
      <View style={styles.quickRow}>
        {([["Today", today], ["Tomorrow", addDays(today, 1)], ["In a week", addDays(today, 7)]] as const).map(([l, d]) => (
          <TouchableOpacity key={l} style={[styles.quick, selected && isSameDay(selected, d) && styles.quickOn]} onPress={() => pick(d)}>
            <Text style={[styles.quickTxt, selected && isSameDay(selected, d) && styles.quickTxtOn]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.field} onPress={() => setOpen((o) => !o)} accessibilityLabel="Pick a date">
        <Ionicons name="calendar" size={20} color="#4F46E5" />
        <Text style={[styles.fieldTxt, !selected && { color: "#9CA3AF" }]}>{selected ? format(selected, "EEEE, d MMMM yyyy") : "Pick a date"}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color="#9CA3AF" />
      </TouchableOpacity>
      {open && (
        <View style={styles.cal}>
          <View style={styles.calHead}>
            <TouchableOpacity onPress={() => setMonth(subMonths(month, 1))} style={styles.nav}><Ionicons name="chevron-back" size={20} color="#4B5563" /></TouchableOpacity>
            <Text style={styles.calTitle}>{format(month, "MMMM yyyy")}</Text>
            <TouchableOpacity onPress={() => setMonth(addMonths(month, 1))} style={styles.nav}><Ionicons name="chevron-forward" size={20} color="#4B5563" /></TouchableOpacity>
          </View>
          <View style={styles.week}>{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <Text key={d} style={styles.weekTxt}>{d}</Text>)}</View>
          <View style={styles.grid}>
            {Array.from({ length: lead }).map((_, i) => <View key={`e${i}`} style={styles.cell} />)}
            {days.map((d) => {
              const past = isBefore(d, today);
              const on = selected && isSameDay(selected, d);
              return (
                <TouchableOpacity key={d.toISOString()} style={styles.cell} disabled={past} onPress={() => pick(d)} accessibilityLabel={format(d, "EEEE d MMMM")}>
                  <View style={[styles.day, on && styles.dayOn]}>
                    <Text style={[styles.dayTxt, past && { color: "#D1D5DB" }, on && { color: "#fff" }]}>{format(d, "d")}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

// value "HH:MM" (24h)
export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [h24, m] = value.split(":").map((n) => parseInt(n, 10));
  const pm = h24 >= 12;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const set = (h: number, min: number) => onChange(`${String(((h % 24) + 24) % 24).padStart(2, "0")}:${String(((min % 60) + 60) % 60).padStart(2, "0")}`);
  const Stepper = ({ label, onMinus, onPlus }: { label: string; onMinus: () => void; onPlus: () => void }) => (
    <View style={styles.stepper}>
      <TouchableOpacity style={styles.stepBtn} onPress={onMinus} accessibilityLabel="Less"><Ionicons name="remove" size={20} color="#4F46E5" /></TouchableOpacity>
      <Text style={styles.stepVal}>{label}</Text>
      <TouchableOpacity style={styles.stepBtn} onPress={onPlus} accessibilityLabel="More"><Ionicons name="add" size={20} color="#4F46E5" /></TouchableOpacity>
    </View>
  );
  return (
    <View style={styles.timeRow}>
      <Stepper label={String(h12)} onMinus={() => set(h24 - 1, m)} onPlus={() => set(h24 + 1, m)} />
      <Text style={styles.colon}>:</Text>
      <Stepper label={String(m).padStart(2, "0")} onMinus={() => set(h24, m - 15)} onPlus={() => set(h24, m + 15)} />
      <View style={styles.ampm}>
        {(["AM", "PM"] as const).map((x) => {
          const on = (x === "PM") === pm;
          return (
            <TouchableOpacity key={x} style={[styles.ampmBtn, on && styles.ampmOn]} onPress={() => set(x === "PM" ? (h24 % 12) + 12 : h24 % 12, m)}>
              <Text style={[styles.ampmTxt, on && { color: "#fff" }]}>{x}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  quick: { flex: 1, paddingVertical: 11, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center" },
  quickOn: { backgroundColor: "#4F46E5" },
  quickTxt: { fontSize: 13, fontWeight: "700", color: "#4B5563" },
  quickTxtOn: { color: "#fff" },
  field: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14 },
  fieldTxt: { flex: 1, fontSize: 15, color: "#111827", fontWeight: "600" },
  cal: { marginTop: 10, backgroundColor: "#F8FAFF", borderRadius: 16, padding: 10, borderWidth: 1, borderColor: "#E0E7FF" },
  calHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  nav: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  calTitle: { fontSize: 15, fontWeight: "800", color: "#111827" },
  week: { flexDirection: "row" },
  weekTxt: { flex: 1, textAlign: "center", fontSize: 11, fontWeight: "700", color: "#6366F1", paddingBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: `${100 / 7}%`, height: 42, alignItems: "center", justifyContent: "center" },
  day: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  dayOn: { backgroundColor: "#4F46E5" },
  dayTxt: { fontSize: 14.5, fontWeight: "600", color: "#111827" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  stepper: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 6, paddingVertical: 6 },
  stepBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  stepVal: { fontSize: 18, fontWeight: "800", color: "#111827" },
  colon: { fontSize: 20, fontWeight: "800", color: "#9CA3AF" },
  ampm: { gap: 4 },
  ampmBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#F3F4F6" },
  ampmOn: { backgroundColor: "#4F46E5" },
  ampmTxt: { fontSize: 12.5, fontWeight: "800", color: "#4B5563" },
});

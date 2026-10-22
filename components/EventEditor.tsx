import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { pickImage, uploadImage } from "@/lib/upload";
import { EventImage } from "@/components/EventImage";
import { DateField, TimeField } from "@/components/DateTimeFields";
import { Card, PrimaryButton, LabeledInput, Chips } from "@/components/StaffUI";

// Same category names the website uses, so filters match on both apps.
export const EVENT_CATEGORIES = ["Workshop", "Seminar", "Competition", "Cultural", "Sports", "Guest Lecture", "Hackathon", "Technical", "Field Trip", "Other"];

export type EventValues = {
  title: string; description: string; category: string; banner: string;
  date: string; endDate: string; time: string; // time is 24h "HH:MM"
  venue: string; capacity: string; fee: string; ticketUrl: string;
  organizer: string; email: string; tags: string;
  publishLater: boolean; publishDate: string; publishTime: string;
};

export const emptyEventValues = (organizer = "", email = ""): EventValues => ({
  title: "", description: "", category: "Workshop", banner: "",
  date: "", endDate: "", time: "10:00", venue: "", capacity: "100", fee: "0", ticketUrl: "",
  organizer, email, tags: "", publishLater: false, publishDate: "", publishTime: "09:00",
});

// One form for creating and editing events: everything an organizer can set on the website.
export function EventEditor({ initial, submitLabel, onSubmit, footer }: {
  initial: EventValues; submitLabel: string; onSubmit: (v: EventValues) => Promise<void>; footer?: React.ReactNode;
}) {
  const [v, setV] = useState<EventValues>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof EventValues>(k: K, val: EventValues[K]) => setV((p) => ({ ...p, [k]: val }));

  const addBanner = async () => {
    const asset = await pickImage([16, 9]);
    if (!asset) return;
    setUploading(true);
    try { set("banner", await uploadImage(asset, "banner")); }
    catch (e) { Alert.alert("Upload failed", e instanceof Error ? e.message : "Please try again."); }
    finally { setUploading(false); }
  };

  const save = async () => {
    if (!v.title.trim() || !v.description.trim() || !v.date || !v.venue.trim() || !v.organizer.trim() || !v.email.trim()) {
      Alert.alert("Almost there", "Please add a title, description, date, venue and organizer details.");
      return;
    }
    if (v.endDate && v.endDate < v.date) { Alert.alert("Check the dates", "The end date can't be before the start date."); return; }
    if (v.publishLater && !v.publishDate) { Alert.alert("Pick a publish date", "Choose when the event should go live."); return; }
    setSaving(true);
    try { await onSubmit(v); }
    catch (e) { Alert.alert("Could not save", e instanceof Error ? e.message : "You may not have permission to change events."); }
    finally { setSaving(false); }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.section}>The basics</Text>
          <LabeledInput label="Event title *" value={v.title} onChangeText={(t) => set("title", t)} placeholder="e.g. National Hackathon 2026" />
          <Text style={styles.label}>Category *</Text>
          <Chips options={EVENT_CATEGORIES.map((c) => ({ key: c, label: c }))} value={v.category} onChange={(c) => set("category", c)} />
          <LabeledInput label="Description *" value={v.description} onChangeText={(t) => set("description", t)} placeholder="Describe the event…" multiline />
        </Card>

        <Card>
          <Text style={styles.section}>Banner image</Text>
          {v.banner ? <EventImage uri={v.banner} fit="contain" style={{ width: "100%", height: 160, borderRadius: 12, marginBottom: 10 }} /> : null}
          <TouchableOpacity style={styles.bannerBtn} onPress={addBanner} disabled={uploading} accessibilityLabel="Add or change banner">
            {uploading ? <ActivityIndicator color="#4F46E5" /> : <><Ionicons name="image-outline" size={20} color="#4F46E5" /><Text style={styles.bannerTxt}>{v.banner ? "Change banner" : "Add banner image"}</Text></>}
          </TouchableOpacity>
          <Text style={styles.hint}>JPG, PNG, WebP or GIF, up to 4 MB.</Text>
        </Card>

        <Card>
          <Text style={styles.section}>Date, time and place</Text>
          <Text style={styles.label}>Start date *</Text>
          <View style={styles.gap}><DateField value={v.date} onChange={(d) => set("date", d)} /></View>
          <Text style={styles.label}>End date (for multi-day events)</Text>
          <View style={styles.gap}>
            <DateField value={v.endDate} onChange={(d) => set("endDate", d)} />
            {v.endDate ? <TouchableOpacity onPress={() => set("endDate", "")}><Text style={styles.clear}>Remove end date</Text></TouchableOpacity> : null}
          </View>
          <Text style={styles.label}>Start time *</Text>
          <View style={styles.gap}><TimeField value={v.time} onChange={(t) => set("time", t)} /></View>
          <LabeledInput label="Venue *" value={v.venue} onChangeText={(t) => set("venue", t)} placeholder="Main Auditorium, Block A" />
        </Card>

        <Card>
          <Text style={styles.section}>Seats and price</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1 }}><LabeledInput label="Capacity *" value={v.capacity} onChangeText={(t) => set("capacity", t.replace(/[^0-9]/g, ""))} keyboardType="number-pad" placeholder="100" /></View>
            <View style={{ flex: 1 }}><LabeledInput label="Fee (₹)" value={v.fee} onChangeText={(t) => set("fee", t.replace(/[^0-9.]/g, ""))} keyboardType="decimal-pad" placeholder="0" /></View>
          </View>
          <LabeledInput label="Ticket / payment link (optional)" value={v.ticketUrl} onChangeText={(t) => set("ticketUrl", t)} placeholder="https://…" autoCapitalize="none" keyboardType="url" />
        </Card>

        <Card>
          <Text style={styles.section}>Contact</Text>
          <LabeledInput label="Organizer name *" value={v.organizer} onChangeText={(t) => set("organizer", t)} placeholder="Name" />
          <LabeledInput label="Contact email *" value={v.email} onChangeText={(t) => set("email", t)} placeholder="organizer@example.com" autoCapitalize="none" keyboardType="email-address" />
          <LabeledInput label="Tags (optional, separated by commas)" value={v.tags} onChangeText={(t) => set("tags", t)} placeholder="ai, career, networking" autoCapitalize="none" />
        </Card>

        <Card>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.section}>Publish later</Text>
              <Text style={styles.hint}>Keep it hidden from students until a date you choose.</Text>
            </View>
            <Switch value={v.publishLater} onValueChange={(b) => set("publishLater", b)} trackColor={{ true: "#4F46E5" }} />
          </View>
          {v.publishLater ? (
            <View style={{ marginTop: 12 }}>
              <Text style={styles.label}>Go live on *</Text>
              <View style={styles.gap}><DateField value={v.publishDate} onChange={(d) => set("publishDate", d)} /></View>
              <Text style={styles.label}>At</Text>
              <TimeField value={v.publishTime} onChange={(t) => set("publishTime", t)} />
            </View>
          ) : null}
        </Card>

        <PrimaryButton label={submitLabel} icon="checkmark-circle" onPress={save} busy={saving} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48 },
  section: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151", marginBottom: 8 },
  hint: { fontSize: 12, color: "#9CA3AF", marginTop: 6 },
  gap: { marginBottom: 14 },
  clear: { fontSize: 12.5, fontWeight: "700", color: "#DC2626", marginTop: 8 },
  bannerBtn: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", backgroundColor: "#EEF2FF", borderRadius: 14, paddingVertical: 14 },
  bannerTxt: { fontSize: 14.5, fontWeight: "800", color: "#4F46E5" },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
});

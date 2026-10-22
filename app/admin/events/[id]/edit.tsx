import { useEffect, useState } from "react";
import { View, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { getEvent, updateEvent, deleteEvent, type DbEvent } from "@/lib/db";
import { cloneEvent } from "@/lib/staff";
import { StaffHeader } from "@/components/StaffHeader";
import { PrimaryButton } from "@/components/StaffUI";
import { EventEditor, type EventValues, EVENT_CATEGORIES } from "@/components/EventEditor";

const hhmm = (t?: string | null) => (t ?? "10:00").slice(0, 5);

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ev, setEv] = useState<(DbEvent & { publish_at?: string | null }) | null | undefined>(undefined);

  useEffect(() => { if (id) getEvent(id).then((e) => setEv(e as any)).catch(() => setEv(null)); }, [id]);

  if (ev === undefined) return <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFF" }}><View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><ActivityIndicator size="large" color="#4F46E5" /></View></SafeAreaView>;
  if (!ev) return <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFF" }}><StaffHeader title="Event not found" /></SafeAreaView>;

  const pub = ev.publish_at ? new Date(ev.publish_at) : null;
  const pad = (n: number) => String(n).padStart(2, "0");
  const initial: EventValues = {
    title: ev.title, description: ev.description,
    category: EVENT_CATEGORIES.find((c) => c.toLowerCase() === (ev.category ?? "").toLowerCase()) ?? ev.category ?? "Other",
    banner: ev.banner_image ?? "", date: ev.date, endDate: ev.end_date ?? "", time: hhmm(ev.time),
    venue: ev.venue, capacity: String(ev.capacity), fee: String(ev.registration_fee), ticketUrl: ev.ticket_url ?? "",
    organizer: ev.organizer_name, email: ev.organizer_email, tags: (ev.tags ?? []).join(", "),
    publishLater: !!pub, publishDate: pub ? `${pub.getFullYear()}-${pad(pub.getMonth() + 1)}-${pad(pub.getDate())}` : "",
    publishTime: pub ? `${pad(pub.getHours())}:${pad(pub.getMinutes())}` : "09:00",
  };

  const save = async (v: EventValues) => {
    const publishAt = v.publishLater ? new Date(`${v.publishDate}T${v.publishTime}:00`).toISOString() : null;
    const end = new Date(`${v.endDate || v.date}T${v.endDate ? "23:59" : v.time}:00`);
    const base: any = {
      title: v.title.trim(), description: v.description.trim(), date: v.date, end_date: v.endDate || null, time: v.time,
      venue: v.venue.trim(), category: v.category,
      status: publishAt ? "scheduled" : end < new Date() ? "completed" : "upcoming", publish_at: publishAt,
      capacity: parseInt(v.capacity, 10) || ev.capacity, registration_fee: parseFloat(v.fee) || 0,
      organizer_name: v.organizer.trim(), organizer_email: v.email.trim(),
      tags: v.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean), banner_image: v.banner,
    };
    try { await updateEvent(ev.id, { ...base, ticket_url: v.ticketUrl.trim() || null }); }
    catch { await updateEvent(ev.id, base); }
    Alert.alert("Saved", "The event was updated.", [{ text: "OK", onPress: () => router.back() }]);
  };

  const duplicate = () =>
    Alert.alert("Duplicate this event?", "A copy is created as a new event, with no registrations.", [
      { text: "Cancel", style: "cancel" },
      { text: "Duplicate", onPress: async () => {
        try { const nid = await cloneEvent(ev.id); router.replace(`/admin/events/${nid}/edit` as any); }
        catch (e: any) { Alert.alert("Could not duplicate", e.message ?? "Please try again."); }
      } },
    ]);

  const remove = () =>
    Alert.alert("Delete this event?", `"${ev.title}" and all its registrations will be removed. This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try { await deleteEvent(ev.id); router.replace("/admin" as any); }
        catch (e: any) { Alert.alert("Could not delete", e.message ?? "Please try again."); }
      } },
    ]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFF" }}>
      <StaffHeader title="Edit event" subtitle={ev.title} />
      <EventEditor
        initial={initial}
        submitLabel="Save changes"
        onSubmit={save}
        footer={
          <View style={{ gap: 10, marginTop: 14 }}>
            <PrimaryButton label="Duplicate event" icon="copy-outline" tone="light" onPress={duplicate} />
            <PrimaryButton label="Delete event" icon="trash-outline" tone="red" onPress={remove} />
          </View>
        }
      />
    </SafeAreaView>
  );
}

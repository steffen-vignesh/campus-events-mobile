import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { createEvent } from "@/lib/db";
import { StaffHeader } from "@/components/StaffHeader";
import { EventEditor, emptyEventValues, type EventValues } from "@/components/EventEditor";

export default function NewEventScreen() {
  const { user } = useAuth();

  const create = async (v: EventValues) => {
    const publishAt = v.publishLater ? new Date(`${v.publishDate}T${v.publishTime}:00`).toISOString() : null;
    const end = new Date(`${v.endDate || v.date}T${v.endDate ? "23:59" : v.time}:00`);
    const created = await createEvent({
      title: v.title.trim(), description: v.description.trim(), date: v.date, end_date: v.endDate || null,
      time: v.time, end_time: null, venue: v.venue.trim(), category: v.category,
      status: publishAt ? "scheduled" : end < new Date() ? "completed" : "upcoming",
      capacity: parseInt(v.capacity, 10) || 100, registration_fee: parseFloat(v.fee) || 0,
      organizer_name: v.organizer.trim(), organizer_email: v.email.trim(), organizer_department: "",
      tags: v.tags.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean),
      banner_image: v.banner, banner_link: null, ticket_url: v.ticketUrl.trim() || null,
      requirements: [], created_by: user?.id ?? null,
      ...(publishAt ? { publish_at: publishAt } : {}),
    } as any);
    router.replace(`/admin/events/${created.id}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F8FAFF" }}>
      <StaffHeader title="Create event" />
      <EventEditor initial={emptyEventValues(user?.name ?? "", user?.email ?? "")} submitLabel="Publish event" onSubmit={create} />
    </SafeAreaView>
  );
}

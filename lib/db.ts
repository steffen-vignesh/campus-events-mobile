import { supabase } from "@/lib/supabase";
import { WEB_URL } from "@/lib/config";
import type { Event, Category } from "@/lib/mock-data";

export type DbEvent = {
  id: string;
  title: string;
  description: string;
  date: string;
  end_date: string | null;
  time: string;
  end_time: string | null;
  venue: string;
  category: string;
  status: string;
  capacity: number;
  registration_fee: number;
  organizer_name: string;
  organizer_email: string;
  organizer_department: string;
  tags: string[];
  banner_image: string;
  banner_link?: string | null;
  ticket_url?: string | null;
  requirements: string[];
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type DbRegistration = {
  id: string;
  event_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_department: string | null;
  student_year: string | null;
  payment_status: string;
  attended: boolean;
  registered_at: string;
};

export function adaptDbEvent(e: DbEvent, registrationCount = 0): Event {
  return {
    id: e.id,
    title: e.title,
    category: e.category as Category,
    description: e.description,
    date: e.date,
    endDate: e.end_date ?? undefined,
    time: e.time,
    venue: e.venue,
    bannerImage: e.banner_image,
    bannerLink: e.banner_link ?? undefined,
    ticketUrl: e.ticket_url ?? undefined,
    organizer: e.organizer_name,
    contactEmail: e.organizer_email,
    registrationDeadline: e.date,
    capacity: e.capacity,
    registrationFee: e.registration_fee,
    eligibility: "Open to all",
    tags: e.tags ?? [],
    attachments: [],
    status: e.status as Event["status"],
    views: 0,
    registrations: registrationCount,
  };
}

async function getRegistrationCounts(): Promise<Record<string, number>> {
  // Security-definer function: real totals for everyone, individual rows stay private.
  const { data } = await supabase.rpc("event_registration_counts");
  const counts: Record<string, number> = {};
  ((data ?? []) as { event_id: string; registrations: number }[]).forEach((r) => { counts[r.event_id] = Number(r.registrations); });
  return counts;
}

// ── Events ───────────────────────────────────────────────────

export async function getEvents(): Promise<DbEvent[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getAdaptedEvents(): Promise<Event[]> {
  const [events, counts] = await Promise.all([getEvents(), getRegistrationCounts()]);
  return events.map((e) => adaptDbEvent(e, counts[e.id] ?? 0));
}

export async function getEvent(id: string): Promise<DbEvent | null> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getAdaptedEvent(id: string): Promise<Event | null> {
  const [raw, counts] = await Promise.all([getEvent(id), getRegistrationCounts()]);
  return raw ? adaptDbEvent(raw, counts[id] ?? 0) : null;
}

export async function createEvent(payload: Omit<DbEvent, "id" | "created_at" | "updated_at">): Promise<DbEvent> {
  const { data, error } = await supabase
    .from("events")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateEvent(id: string, payload: Partial<DbEvent>): Promise<DbEvent> {
  const { data, error } = await supabase
    .from("events")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) throw error;
}

// ── Registrations ─────────────────────────────────────────────

export async function getMyRegistrations(): Promise<DbRegistration[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("user_id", user.id)
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getEventRegistrations(eventId: string): Promise<DbRegistration[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .eq("event_id", eventId)
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function registerForEvent(eventId: string, info: {
  name: string;
  email: string;
  department?: string;
  year?: string;
  fee: number;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase.from("registrations").insert({
    event_id: eventId,
    user_id: user.id,
    student_name: info.name,
    student_email: info.email,
    student_department: info.department ?? null,
    student_year: info.year ?? null,
    payment_status: info.fee === 0 ? "free" : "pending",
  });
  if (error) throw error;
}

export async function cancelRegistration(eventId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { error } = await supabase
    .from("registrations")
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id);
  if (error) throw error;
}

export async function isRegisteredForEvent(eventId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  return !!data;
}

export async function getAllRegistrations(): Promise<DbRegistration[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("*")
    .order("registered_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

export async function toggleAttendance(registrationId: string, attended: boolean): Promise<void> {
  const { error } = await supabase
    .from("registrations")
    .update({ attended })
    .eq("id", registrationId);
  if (error) throw error;
}

export async function markMyAttendance(eventId: string): Promise<"ok" | "not_registered" | "already_marked"> {
  const { data, error } = await supabase.rpc("mark_attendance", { p_event_id: eventId });
  if (error) throw error;
  return data as "ok" | "not_registered" | "already_marked";
}

// ── Bookmarks ─────────────────────────────────────────────────

export async function getMyBookmarks(): Promise<string[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("bookmarks")
    .select("event_id")
    .eq("user_id", user.id);
  if (error) return [];
  return (data ?? []).map((r) => r.event_id);
}

export async function addBookmark(eventId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase.from("bookmarks").insert({ user_id: user.id, event_id: eventId });
  if (error && error.code !== "23505") throw error;
}

export async function removeBookmark(eventId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const { error } = await supabase
    .from("bookmarks")
    .delete()
    .eq("user_id", user.id)
    .eq("event_id", eventId);
  if (error) throw error;
}

// ── Surveys ───────────────────────────────────────────────────

export type DbSurvey = {
  id: string;
  event_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  rating: number;
  organization_rating: number;
  would_recommend: boolean;
  liked_most: string | null;
  could_improve: string | null;
  other_feedback: string | null;
  custom_answers: Record<string, string | number | boolean> | null;
  submitted_at: string;
};

export type DbSurveyQuestion = {
  id: string;
  event_id: string;
  question: string;
  type: "text" | "rating" | "yesno";
  required: boolean;
  sort_order: number;
};

export async function getSurveyQuestions(eventId: string): Promise<DbSurveyQuestion[]> {
  const { data, error } = await supabase
    .from("survey_questions")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function submitSurvey(
  eventId: string,
  data: {
    rating: number;
    organization_rating: number;
    would_recommend: boolean;
    liked_most?: string;
    could_improve?: string;
    other_feedback?: string;
    custom_answers?: Record<string, string | number | boolean>;
  }
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();
  const { error } = await supabase.from("event_surveys").insert({
    event_id: eventId,
    user_id: user.id,
    student_name: profile?.name ?? user.email ?? "",
    student_email: profile?.email ?? user.email ?? "",
    rating: data.rating,
    organization_rating: data.organization_rating,
    would_recommend: data.would_recommend,
    liked_most: data.liked_most || null,
    could_improve: data.could_improve || null,
    other_feedback: data.other_feedback || null,
    custom_answers: data.custom_answers ?? {},
  });
  if (error) throw error;
}

export async function getMyEventSurvey(eventId: string): Promise<DbSurvey | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("event_surveys")
    .select("*")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();
  return data ?? null;
}

export async function getEventSurveys(eventId: string): Promise<DbSurvey[]> {
  const { data, error } = await supabase
    .from("event_surveys")
    .select("*")
    .eq("event_id", eventId)
    .order("submitted_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function addSurveyQuestion(
  eventId: string,
  question: string,
  type: DbSurveyQuestion["type"],
  sortOrder: number
): Promise<DbSurveyQuestion> {
  const { data, error } = await supabase
    .from("survey_questions")
    .insert({ event_id: eventId, question, type, required: false, sort_order: sortOrder })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSurveyQuestion(id: string): Promise<void> {
  const { error } = await supabase.from("survey_questions").delete().eq("id", id);
  if (error) throw error;
}

// ── Notifications ─────────────────────────────────────────────

export type DbNotification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  event_id: string | null;
  read: boolean;
  sent_by: string | null;
  created_at: string;
};

export async function getMyNotifications(): Promise<DbNotification[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return [];
  return data ?? [];
}

export async function markNotificationRead(id: string): Promise<void> {
  await supabase.from("notifications").update({ read: true }).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
}

// Organizer: send a message about an event to its registered students, or to all students.
// Returns how many students were notified.
export async function sendEventNotification(
  eventId: string,
  title: string,
  message: string,
  audience: "registered" | "all"
): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  let ids: string[] = [];
  if (audience === "registered") {
    const { data, error } = await supabase.from("registrations").select("user_id").eq("event_id", eventId);
    if (error) throw error;
    ids = [...new Set((data ?? []).map((r) => r.user_id as string).filter(Boolean))];
  } else {
    const { data, error } = await supabase.from("profiles").select("id").eq("role", "student");
    if (error) throw error;
    ids = (data ?? []).map((p) => p.id as string);
  }
  if (ids.length === 0) return 0;
  const { error } = await supabase.from("notifications").insert(
    ids.map((uid) => ({ user_id: uid, title, message, event_id: eventId, sent_by: user.id }))
  );
  if (error) throw error;
  // Also send it as a phone push notification (best effort).
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    fetch(`${WEB_URL}/api/push/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ userIds: ids, title, message, eventId }),
    }).catch(() => {});
  }
  return ids.length;
}

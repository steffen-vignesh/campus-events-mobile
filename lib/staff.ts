import { supabase } from "@/lib/supabase";
import { WEB_URL } from "@/lib/config";

// Data the organizer screens need beyond events: students, jobs, announcements, organizers and the profile.

export type StaffProfile = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  year: string | null;
  phone: string | null;
  home_country?: string | null;
  study_program?: string | null;
  student_status?: string | null;
  german_level?: string | null;
};

async function api<T>(path: string, body: unknown): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in.");
  const res = await fetch(`${WEB_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
  return json as T;
}

// ── Students ─────────────────────────────────────────────────

export async function getAllStudents(): Promise<StaffProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*").eq("role", "student").order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getStudentProfile(userId: string): Promise<StaffProfile | null> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return error ? null : data;
}

export type StudentHistoryRow = {
  id: string;
  event_id: string;
  attended: boolean;
  registered_at: string;
  event_title: string;
  event_date: string;
  event_time: string;
  event_venue: string;
};

export async function getStudentHistory(userId: string): Promise<StudentHistoryRow[]> {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, event_id, attended, registered_at, events(title, date, time, venue)")
    .eq("user_id", userId)
    .eq("status", "confirmed")
    .order("registered_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    id: r.id,
    event_id: r.event_id,
    attended: !!r.attended,
    registered_at: r.registered_at,
    event_title: r.events?.title ?? "",
    event_date: r.events?.date ?? "",
    event_time: r.events?.time ?? "",
    event_venue: r.events?.venue ?? "",
  }));
}

// Sets a temporary password and returns it once, so an organizer can pass it on (works without email).
export async function resetStudentPassword(userId: string): Promise<string> {
  const r = await api<{ password: string }>("/api/admin/reset-student-password", { userId });
  return r.password;
}

// ── Announcements ────────────────────────────────────────────

// Saves an in-app notification for each user and sends the phone alert.
export async function sendToUsers(userIds: string[], title: string, message: string, eventId?: string): Promise<number> {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return 0;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase.from("notifications").insert(
    ids.map((uid) => ({ user_id: uid, title, message, event_id: eventId ?? null, sent_by: user.id }))
  );
  if (error) throw error;
  api("/api/push/send", { userIds: ids, title, message, eventId: eventId ?? null }).catch(() => {});
  return ids.length;
}

export async function getEventSeatUserIds(eventId: string): Promise<string[]> {
  const { data, error } = await supabase.from("registrations").select("user_id").eq("event_id", eventId).eq("status", "confirmed");
  if (error) throw error;
  return (data ?? []).map((r) => r.user_id as string);
}

// ── Jobs ─────────────────────────────────────────────────────

export type StaffJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary_range: string | null;
  apply_link: string | null;
  deadline: string | null;
  created_at: string;
};

export type JobApplication = {
  id: string;
  job_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  status: string;
  created_at: string;
};

export async function getJobs(): Promise<StaffJob[]> {
  const { data, error } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
  if (error) { if (error.code === "42P01") return []; throw error; }
  return data ?? [];
}

export async function getJob(id: string): Promise<StaffJob | null> {
  const { data, error } = await supabase.from("jobs").select("*").eq("id", id).single();
  return error ? null : data;
}

export async function createJob(payload: Omit<StaffJob, "id" | "created_at">): Promise<StaffJob> {
  const { data, error } = await supabase.from("jobs").insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

export async function getJobApplications(jobId: string): Promise<JobApplication[]> {
  const { data, error } = await supabase.from("job_applications").select("*").eq("job_id", jobId).order("created_at", { ascending: false });
  if (error) { if (error.code === "42P01") return []; throw error; }
  return data ?? [];
}

// ── Organizers (super admin) ─────────────────────────────────

export async function getAllOrganizers(): Promise<StaffProfile[]> {
  const { data, error } = await supabase.from("profiles").select("*").in("role", ["admin", "super_admin", "event_head"]).order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createOrganizer(input: { name: string; email: string; department?: string; role: "admin" | "event_head" }) {
  return api<{ email: string; password: string; name: string; role: string }>("/api/super-admin/create-organizer", input);
}

// ── My profile ───────────────────────────────────────────────

export async function updateMyName(name: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { error } = await supabase.from("profiles").update({ name }).eq("id", user.id);
  if (error) throw error;
}

export async function changeMyPassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

// ── Events ───────────────────────────────────────────────────

export async function cloneEvent(id: string): Promise<string> {
  const { data: ev, error } = await supabase.from("events").select("*").eq("id", id).single();
  if (error || !ev) throw error ?? new Error("Event not found");
  const { id: _id, created_at: _c, updated_at: _u, ...rest } = ev;
  const { data, error: insertErr } = await supabase
    .from("events")
    .insert({ ...rest, title: `Copy of ${ev.title}`, status: "upcoming" })
    .select("id")
    .single();
  if (insertErr) throw insertErr;
  return data.id as string;
}

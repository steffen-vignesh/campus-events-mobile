import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image, Alert, Share, Linking, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type Event, getCategoryColor, isEventPast, isEventOver } from "@/lib/mock-data";
import { getAdaptedEvent, registerForEvent, isRegisteredForEvent, didIAttend, getMyBookmarks, addBookmark, removeBookmark, getMyEventSurvey } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";
import { EventImage } from "@/components/EventImage";
import { ImageViewer } from "@/components/ImageViewer";
import { addEventToCalendar } from "@/lib/calendar";

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [attended, setAttended] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      getAdaptedEvent(id),
      isRegisteredForEvent(id),
      getMyBookmarks(),
      getMyEventSurvey(id),
      didIAttend(id),
    ]).then(([evt, registered, bms, survey, didAttend]) => {
      setEvent(evt);
      setIsRegistered(registered);
      setIsBookmarked(bms.includes(id));
      setSurveySubmitted(!!survey);
      setAttended(didAttend);
    }).catch(() => setEvent(null));
  }, [id]);

  const handleBookmark = async () => {
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      if (next) await addBookmark(id!);
      else await removeBookmark(id!);
    } catch {
      setIsBookmarked(!next);
    }
  };

  if (event === undefined) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTxt}>Event not found.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
            <Text style={styles.backLinkTxt}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cat = getCategoryColor(event.category);
  const fillPct = Math.round((event.registrations / event.capacity) * 100);
  const isFull = event.registrations >= event.capacity;
  const isPast = isEventPast(event);
  const isPastDeadline = new Date(event.registrationDeadline) < new Date();
  const hasTicketUrl = event.registrationFee > 0 && event.ticketUrl;

  const handleRegister = async () => {
    if (isRegistered || !user) return;
    setRegistering(true);
    try {
      await registerForEvent(id!, {
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        fee: event.registrationFee,
      });
      setIsRegistered(true);
      Alert.alert("Registered!", "You're registered for this event. Add it to your calendar so you don't miss it.", [
        { text: "Not now", style: "cancel" },
        { text: "Add to calendar", onPress: () => event && addEventToCalendar(event) },
      ]);
    } catch (err: any) {
      Alert.alert("Registration failed", err.message ?? "Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    Share.share({ message: `Check out ${event.title} at ${event.venue} on ${format(new Date(event.date), "MMM d, yyyy")}` });
  };

  const registerLabel = () => {
    if (isRegistered) return "✓ You're Registered!";
    if (isPast) return "Event Ended";
    if (isFull) return "Event Full";
    if (isPastDeadline) return "Registration Closed";
    if (hasTicketUrl) return `Buy Ticket — ₹${event.registrationFee}`;
    return event.registrationFee === 0 ? "Register for Free" : `Register — ₹${event.registrationFee}`;
  };

  const registerDisabled = isRegistered || isPast || isFull || isPastDeadline;
  const registerBg = isRegistered ? "#10B981" : registerDisabled ? "#9CA3AF" : "#4F46E5";

  const handleRegisterPress = () => {
    if (hasTicketUrl && !isRegistered && !registerDisabled) {
      Linking.openURL(event.ticketUrl!);
    } else {
      handleRegister();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={styles.bannerWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setViewerOpen(true)} accessibilityLabel="Open image full screen">
            <EventImage uri={event.bannerImage} style={styles.banner} fit="contain" />
            <View style={styles.enlargeHint}>
              <Ionicons name="expand-outline" size={13} color="#fff" />
              <Text style={styles.enlargeTxt}>Tap to enlarge</Text>
            </View>
          </TouchableOpacity>
          <ImageViewer uri={event.bannerImage} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
          <TouchableOpacity style={[styles.backBtn, { top: insets.top + 8 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={[styles.bannerTop, { top: insets.top + 12 }]}>
            <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
              <Text style={[styles.catTxt, { color: cat.text }]}>{event.category}</Text>
            </View>
            <View style={styles.feeBadge}>
              <Text style={styles.feeBadgeTxt}>
                {event.registrationFee === 0 ? "FREE" : `₹${event.registrationFee}`}
              </Text>
            </View>
          </View>
          <View style={styles.bannerActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleBookmark}>
              <Ionicons
                name={isBookmarked ? "bookmark" : "bookmark-outline"}
                size={22}
                color={isBookmarked ? "#4F46E5" : "#fff"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          {/* Past banner */}
          {isPast && (
            <View style={styles.pastBanner}>
              <Ionicons name="time-outline" size={18} color="#6B7280" />
              <Text style={styles.pastTxt}>
                This event ended on {format(new Date(event.endDate ?? event.date), "MMMM d, yyyy")}
              </Text>
            </View>
          )}

          <Text style={styles.title}>{event.title}</Text>

          {/* Info cards */}
          <View style={styles.infoGrid}>
            <InfoCard icon="calendar" label="Date" value={format(new Date(event.date), "EEE, MMM d, yyyy") + (event.endDate ? ` – ${format(new Date(event.endDate), "MMM d")}` : "")} />
            <InfoCard icon="time" label="Time" value={event.time} />
            <InfoCard icon="location" label="Venue" value={event.venue} />
            <InfoCard icon="people" label="Capacity" value={`${event.registrations}/${event.capacity} registered`} />
          </View>

          {/* Fill bar */}
          <View style={styles.fillSection}>
            <View style={styles.fillRow}>
              <Text style={styles.fillLabel}>Spots filled</Text>
              <Text style={styles.fillPct}>{fillPct}%</Text>
            </View>
            <View style={styles.fillBg}>
              <View
                style={[styles.fillBar, {
                  width: `${Math.min(fillPct, 100)}%` as any,
                  backgroundColor: fillPct >= 90 ? "#EF4444" : fillPct >= 70 ? "#F59E0B" : "#4F46E5",
                }]}
              />
            </View>
            {fillPct >= 80 && !isFull && (
              <Text style={styles.fillingFast}>
                ⚡ Filling fast — only {event.capacity - event.registrations} spots left!
              </Text>
            )}
          </View>

          {/* Description */}
          <Text style={styles.sectionHead}>About this Event</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Tags */}
          {event.tags.length > 0 && (
            <View style={styles.tagsWrap}>
              {event.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagTxt}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Organizer */}
          <View style={styles.orgCard}>
            <Text style={styles.orgHead}>Organizer</Text>
            <View style={styles.orgRow}>
              <View style={styles.orgAvatar}>
                <Text style={styles.orgAvatarTxt}>{event.organizer.slice(0, 2).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.orgName}>{event.organizer}</Text>
                <TouchableOpacity onPress={() => Linking.openURL(`mailto:${event.contactEmail}`)}>
                  <Text style={styles.orgEmail}>{event.contactEmail}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Eligibility */}
          <View style={styles.eligCard}>
            <Text style={styles.eligHead}>Eligibility</Text>
            <Text style={styles.eligTxt}>{event.eligibility}</Text>
          </View>

          {/* Registration deadline */}
          <View style={styles.deadlineCard}>
            <Ionicons name="calendar-outline" size={16} color="#4F46E5" />
            <Text style={styles.deadlineTxt}>
              Registration closes{" "}
              <Text style={{ fontWeight: "700", color: "#111827" }}>
                {format(new Date(event.registrationDeadline), "MMMM d, yyyy")}
              </Text>
            </Text>
          </View>

          {/* Add to calendar — registered students, event still ahead */}
          {isRegistered && !isPast && (
            <TouchableOpacity style={styles.calCard} onPress={() => addEventToCalendar(event)} activeOpacity={0.7}>
              <Ionicons name="calendar-outline" size={20} color="#4F46E5" />
              <View style={{ flex: 1 }}>
                <Text style={styles.calTitle}>Add to your calendar</Text>
                <Text style={styles.calSub}>Get it in your phone's calendar so you don't miss it</Text>
              </View>
              <Ionicons name="add-circle" size={24} color="#4F46E5" />
            </TouchableOpacity>
          )}

          {/* Feedback survey — only for students marked present, once the event is over */}
          {isEventOver(event) && isRegistered && !attended && !surveySubmitted && (
            <View style={styles.surveyNote}>
              <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
              <Text style={styles.surveyNoteTxt}>Feedback is for students who attended. If you were there, ask the organizer to mark you present.</Text>
            </View>
          )}
          {isEventOver(event) && isRegistered && attended && (
            surveySubmitted ? (
              <View style={styles.surveyDoneCard}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
                <Text style={styles.surveyDoneTxt}>Feedback submitted — thank you!</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.surveyBtn} onPress={() => router.push(`/survey/${id}`)}>
                <Ionicons name="clipboard-outline" size={18} color="#fff" />
                <Text style={styles.surveyBtnTxt}>Fill Feedback Survey</Text>
              </TouchableOpacity>
            )
          )}

          <View style={styles.spacer} />
        </View>
      </ScrollView>

      {/* Sticky register button */}
      <View style={styles.stickyBar}>
        <TouchableOpacity
          style={[styles.regBtn, { backgroundColor: registerBg }]}
          onPress={handleRegisterPress}
          disabled={registerDisabled || registering}
        >
          <Text style={styles.regBtnTxt}>
            {registering ? "Registering..." : registerLabel()}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoCard}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={18} color="#4F46E5" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EEF2FF", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#E0E7FF", marginBottom: 14 },
  calTitle: { fontSize: 14, fontWeight: "800", color: "#312E81" },
  calSub: { fontSize: 12, color: "#6366F1", marginTop: 2 },
  safe: { flex: 1, backgroundColor: "#fff" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFoundTxt: { fontSize: 16, color: "#6B7280" },
  backLink: { marginTop: 12 },
  backLinkTxt: { color: "#4F46E5", fontSize: 14, fontWeight: "600" },
  bannerWrap: { position: "relative" },
  banner: { width: "100%", height: 300 },
  enlargeHint: { position: "absolute", right: 12, bottom: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  enlargeTxt: { color: "#fff", fontSize: 11, fontWeight: "700" },
  backBtn: { position: "absolute", left: 16, width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  bannerTop: { position: "absolute", right: 16, left: 68, flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  catTxt: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  feeBadge: { backgroundColor: "rgba(0,0,0,0.7)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  feeBadgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },
  bannerActions: { position: "absolute", bottom: 12, right: 14, flexDirection: "row", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" },
  content: { padding: 20 },
  pastBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F3F4F6", borderRadius: 14, padding: 14, marginBottom: 16 },
  pastTxt: { flex: 1, fontSize: 13, color: "#6B7280", lineHeight: 18 },
  title: { fontSize: 22, fontWeight: "800", color: "#111827", letterSpacing: -0.5, lineHeight: 30, marginBottom: 16 },
  infoGrid: { gap: 10, marginBottom: 16 },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#F8FAFF", borderRadius: 14, padding: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  infoLabel: { fontSize: 11, color: "#9CA3AF", fontWeight: "600", marginBottom: 2 },
  infoValue: { fontSize: 13, fontWeight: "600", color: "#111827" },
  fillSection: { marginBottom: 20 },
  fillRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  fillLabel: { fontSize: 13, color: "#6B7280" },
  fillPct: { fontSize: 13, fontWeight: "700", color: "#111827" },
  fillBg: { height: 6, backgroundColor: "#E5E7EB", borderRadius: 3 },
  fillBar: { height: 6, borderRadius: 3 },
  fillingFast: { fontSize: 12, color: "#F59E0B", marginTop: 4, fontWeight: "600" },
  sectionHead: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8 },
  description: { fontSize: 14, color: "#6B7280", lineHeight: 22, marginBottom: 16 },
  tagsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  tag: { backgroundColor: "#EEF2FF", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  tagTxt: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
  orgCard: { backgroundColor: "#F8FAFF", borderRadius: 16, padding: 16, marginBottom: 12 },
  orgHead: { fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 10 },
  orgRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  orgAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  orgAvatarTxt: { fontSize: 14, fontWeight: "700", color: "#4F46E5" },
  orgName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  orgEmail: { fontSize: 12, color: "#4F46E5", marginTop: 2 },
  eligCard: { backgroundColor: "#FFFBEB", borderRadius: 16, padding: 16, marginBottom: 12 },
  eligHead: { fontSize: 14, fontWeight: "700", color: "#92400E", marginBottom: 4 },
  eligTxt: { fontSize: 13, color: "#92400E", lineHeight: 20 },
  deadlineCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 14, padding: 14, marginBottom: 12 },
  deadlineTxt: { fontSize: 13, color: "#6B7280" },
  surveyDoneCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#ECFDF5", borderRadius: 14, padding: 14, marginBottom: 12 },
  surveyDoneTxt: { fontSize: 13, fontWeight: "600", color: "#166534" },
  surveyNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 14, padding: 14, marginBottom: 12 },
  surveyNoteTxt: { flex: 1, fontSize: 13, color: "#3730A3", lineHeight: 19 },
  surveyBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#4F46E5", borderRadius: 14, paddingVertical: 13, marginBottom: 12 },
  surveyBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 14 },
  spacer: { height: 16 },
  stickyBar: { padding: 16, paddingBottom: 24, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  regBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  regBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 16 },
});

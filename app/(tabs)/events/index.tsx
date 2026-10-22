import { useState, useEffect } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import {
  format, parseISO, isSameDay, isToday, startOfMonth, endOfMonth,
  eachDayOfInterval, addMonths, subMonths,
} from "date-fns";
import { type Event, CATEGORIES, Category, isEventPast, getCategoryColor } from "@/lib/mock-data";
import { getAdaptedEvents, getMyBookmarks, addBookmark, removeBookmark } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";
import { EventImage } from "@/components/EventImage";
import { NotificationBell } from "@/components/NotificationBell";

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [showPast, setShowPast] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());

  useEffect(() => {
    Promise.all([getAdaptedEvents(), getMyBookmarks()])
      .then(([evts, bms]) => {
        setEvents(evts);
        setBookmarks(bms);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleBookmark = async (id: string) => {
    const isBookmarked = bookmarks.includes(id);
    setBookmarks((prev) => isBookmarked ? prev.filter((b) => b !== id) : [...prev, id]);
    try {
      if (isBookmarked) await removeBookmark(id);
      else await addBookmark(id);
    } catch {
      setBookmarks((prev) => isBookmarked ? [...prev, id] : prev.filter((b) => b !== id));
    }
  };

  const match = (e: Event) => {
    const s = search.toLowerCase();
    const matchSearch = e.title.toLowerCase().includes(s) || e.venue.toLowerCase().includes(s) || e.tags.some((t) => t.includes(s));
    const matchCat = category === "all" || e.category === category;
    return matchSearch && matchCat;
  };

  const upcoming = events.filter((e) => !isEventPast(e) && match(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const past = events.filter((e) => isEventPast(e) && match(e))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calendar — plots all events (upcoming + past) across the visible month
  const allFiltered = events.filter(match);
  const monthDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) });
  const startDow = (startOfMonth(calMonth).getDay() + 6) % 7; // Monday first
  const selectedDayEvents = allFiltered.filter((e) => isSameDay(parseISO(e.date), selectedDay));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name.split(" ")[0]} 👋</Text>
          <Text style={styles.sub}>{upcoming.length} upcoming · {past.length} past</Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewToggleBtn, view === "list" && styles.viewToggleBtnActive]}
              onPress={() => setView("list")}
              accessibilityLabel="List view"
            >
              <Ionicons name="list" size={16} color={view === "list" ? "#fff" : "#6B7280"} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewToggleBtn, view === "calendar" && styles.viewToggleBtnActive]}
              onPress={() => setView("calendar")}
              accessibilityLabel="Calendar view"
            >
              <Ionicons name="calendar" size={16} color={view === "calendar" ? "#fff" : "#6B7280"} />
            </TouchableOpacity>
          </View>
          <NotificationBell />
          <View style={styles.avatar}>
            <Text style={styles.avatarTxt}>{user?.name.slice(0, 2).toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search events..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Category chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
          <TouchableOpacity
            key={c.value}
            style={[styles.chip, category === c.value && styles.chipActive]}
            onPress={() => setCategory(c.value as "all" | Category)}
          >
            <Text style={[styles.chipTxt, category === c.value && styles.chipTxtActive]}>{c.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : view === "calendar" ? (
        <FlatList
          data={selectedDayEvents}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <CalendarGrid
              calMonth={calMonth}
              monthDays={monthDays}
              startDow={startDow}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onPrevMonth={() => setCalMonth((m) => subMonths(m, 1))}
              onNextMonth={() => setCalMonth((m) => addMonths(m, 1))}
              onToday={() => { setCalMonth(new Date()); setSelectedDay(new Date()); }}
              events={allFiltered}
            />
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              isPast={isEventPast(item)}
              isBookmarked={bookmarks.includes(item.id)}
              onBookmark={() => toggleBookmark(item.id)}
              onPress={() => router.push(`/(tabs)/events/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-clear-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyTxt}>No events on {format(selectedDay, "MMM d")}</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={[...upcoming, ...(showPast ? past : [])]}
          keyExtractor={(e) => e.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            upcoming.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Upcoming Events</Text>
                <View style={styles.badge}><Text style={styles.badgeTxt}>{upcoming.length}</Text></View>
              </View>
            ) : null
          }
          ListFooterComponent={
            past.length > 0 ? (
              <TouchableOpacity style={styles.pastBtn} onPress={() => setShowPast(!showPast)}>
                <Ionicons name={showPast ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
                <Text style={styles.pastBtnTxt}>
                  {showPast ? "Hide past events" : `Show ${past.length} past events`}
                </Text>
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item }) => (
            <EventCard
              event={item}
              isPast={isEventPast(item)}
              isBookmarked={bookmarks.includes(item.id)}
              onBookmark={() => toggleBookmark(item.id)}
              onPress={() => router.push(`/(tabs)/events/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTxt}>No events found</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const DOT_COLORS: Record<string, string> = {
  workshop: "#3B82F6", seminar: "#A855F7", competition: "#F97316",
  cultural: "#EC4899", sports: "#22C55E", "guest-lecture": "#14B8A6",
  hackathon: "#6366F1", technical: "#4338CA", arts: "#EA580C", social: "#16A34A",
};

function CalendarGrid({
  calMonth, monthDays, startDow, selectedDay, onSelectDay, onPrevMonth, onNextMonth, onToday, events,
}: {
  calMonth: Date; monthDays: Date[]; startDow: number; selectedDay: Date;
  onSelectDay: (d: Date) => void; onPrevMonth: () => void; onNextMonth: () => void; onToday: () => void;
  events: Event[];
}) {
  return (
    <View style={styles.calCard}>
      <View style={styles.calHeader}>
        <Text style={styles.calMonthTxt}>{format(calMonth, "MMMM yyyy")}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <TouchableOpacity onPress={onPrevMonth} style={styles.calNavBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToday} style={styles.calTodayBtn}>
            <Text style={styles.calTodayTxt}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNextMonth} style={styles.calNavBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calWeekRow}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => (
          <Text key={`${d}-${i}`} style={styles.calWeekTxt}>{d}</Text>
        ))}
      </View>

      <View style={styles.calGrid}>
        {Array.from({ length: startDow }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.calCell} />
        ))}
        {monthDays.map((day) => {
          const dayEvents = events.filter((e) => isSameDay(parseISO(e.date), day));
          const selected = isSameDay(day, selectedDay);
          const todayDate = isToday(day);
          return (
            <TouchableOpacity
              key={day.toISOString()}
              style={styles.calCell}
              onPress={() => onSelectDay(day)}
              activeOpacity={0.7}
              accessibilityLabel={`${format(day, "EEEE d MMMM")}, ${dayEvents.length} events`}
            >
              <View style={[styles.calCellInner, selected && styles.calCellSelected]}>
                <View style={[styles.calDayNum, todayDate && styles.calDayNumToday]}>
                  <Text style={[styles.calDayNumTxt, todayDate && styles.calDayNumTxtToday]}>
                    {format(day, "d")}
                  </Text>
                </View>
                {dayEvents.slice(0, 2).map((e) => (
                  <View
                    key={e.id}
                    style={[styles.calChip, isEventPast(e) && styles.calChipPast]}
                  >
                    <Text numberOfLines={1} style={[styles.calChipTxt, isEventPast(e) && styles.calChipTxtPast]}>
                      {e.title}
                    </Text>
                  </View>
                ))}
                {dayEvents.length > 2 && (
                  <Text style={styles.calMore}>+{dayEvents.length - 2} more</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.calSelectedHead}>
        <Text style={styles.calSelectedTxt}>
          {isToday(selectedDay) ? "Today" : format(selectedDay, "EEEE, MMM d")}
        </Text>
      </View>
    </View>
  );
}

function EventCard({ event, isPast, isBookmarked, onBookmark, onPress }: any) {
  const cat = getCategoryColor(event.category);
  const fillPct = Math.round((event.registrations / event.capacity) * 100);

  return (
    <TouchableOpacity style={[styles.card, isPast && styles.cardPast]} onPress={onPress} activeOpacity={0.85}>
      <EventImage uri={event.bannerImage} style={styles.cardImg} fit="contain" />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
            <Text style={[styles.catTxt, { color: cat.text }]}>{event.category}</Text>
          </View>
          <TouchableOpacity onPress={onBookmark} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons
              name={isBookmarked ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isBookmarked ? "#4F46E5" : "#9CA3AF"}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
          <Text style={styles.cardMetaTxt}>{format(new Date(event.date), "MMM d, yyyy")} · {event.time}</Text>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="location-outline" size={13} color="#9CA3AF" />
          <Text style={styles.cardMetaTxt} numberOfLines={1}>{event.venue}</Text>
        </View>
        {/* Fill bar */}
        <View style={styles.fillRow}>
          <View style={styles.fillBg}>
            <View
              style={[styles.fillBar, {
                width: `${Math.min(fillPct, 100)}%` as any,
                backgroundColor: fillPct >= 90 ? "#EF4444" : fillPct >= 70 ? "#F59E0B" : "#4F46E5",
              }]}
            />
          </View>
          <Text style={styles.fillTxt}>{event.registrations}/{event.capacity}</Text>
        </View>
        <View style={styles.cardFooter}>
          <Text style={styles.feeTxt}>
            {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
          </Text>
          {isPast && (
            <View style={styles.completedBadge}><Text style={styles.completedTxt}>Completed</Text></View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  greeting: { fontSize: 20, fontWeight: "700", color: "#111827" },
  sub: { fontSize: 12, color: "#9CA3AF", marginTop: 2 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontSize: 14, fontWeight: "700", color: "#4F46E5" },
  viewToggle: { flexDirection: "row", backgroundColor: "#EEF2FF", borderRadius: 12, padding: 3, gap: 2 },
  viewToggleBtn: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 9 },
  viewToggleBtnActive: { backgroundColor: "#4F46E5" },
  calCard: { backgroundColor: "#fff", borderRadius: 20, padding: 8, marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  calHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  calMonthTxt: { fontSize: 16, fontWeight: "700", color: "#111827" },
  calNavBtn: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  calTodayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  calTodayTxt: { fontSize: 11, fontWeight: "700", color: "#4F46E5" },
  calWeekRow: { flexDirection: "row" },
  calWeekTxt: { flex: 1, textAlign: "center", fontSize: 10, fontWeight: "700", color: "#6366F1", paddingBottom: 6 },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: { width: `${100 / 7}%` as any, height: 74, padding: 1.5 },
  calCellInner: { flex: 1, borderRadius: 8, backgroundColor: "#F5F6FF", paddingTop: 3, paddingHorizontal: 2, gap: 2, borderWidth: 1.5, borderColor: "transparent" },
  calCellSelected: { borderColor: "#4F46E5", backgroundColor: "#EEF2FF" },
  calChip: { backgroundColor: "#4F46E5", borderRadius: 4, paddingHorizontal: 3, paddingVertical: 1.5 },
  calChipPast: { backgroundColor: "#E5E7EB" },
  calChipTxt: { fontSize: 9, fontWeight: "700", color: "#fff" },
  calChipTxtPast: { color: "#6B7280" },
  calMore: { fontSize: 8.5, fontWeight: "700", color: "#4F46E5", paddingHorizontal: 3 },
  calDayNum: { alignSelf: "center", minWidth: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  calDayNumToday: { backgroundColor: "#4F46E5" },
  calDayNumSelected: { backgroundColor: "#4F46E5" },
  calDayNumTxt: { fontSize: 13, fontWeight: "600", color: "#374151" },
  calDayNumTxtToday: { color: "#fff" },
  calDayNumTxtSelected: { color: "#fff" },
  calDots: { flexDirection: "row", gap: 3 },
  calDot: { width: 5, height: 5, borderRadius: 2.5 },
  calSelectedHead: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  calSelectedTxt: { fontSize: 13, fontWeight: "700", color: "#111827" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 20, marginBottom: 12, paddingRight: 12 },
  searchIcon: { paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: "#111827" },
  chipScroll: { flexGrow: 0, flexShrink: 0, height: 48 },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 12, alignItems: "flex-start" },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipTxt: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  chipTxtActive: { color: "#fff" },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  badge: { backgroundColor: "#EEF2FF", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeTxt: { fontSize: 11, fontWeight: "700", color: "#4F46E5" },
  card: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardPast: { opacity: 0.72 },
  cardImg: { width: "100%", height: 190 },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catTxt: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#111827", marginBottom: 8, lineHeight: 22 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  cardMetaTxt: { fontSize: 12, color: "#9CA3AF", flex: 1 },
  fillRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  fillBg: { flex: 1, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  fillBar: { height: 4, borderRadius: 2 },
  fillTxt: { fontSize: 11, color: "#9CA3AF" },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  feeTxt: { fontSize: 14, fontWeight: "700", color: "#4F46E5" },
  completedBadge: { backgroundColor: "#F3F4F6", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  completedTxt: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  pastBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: "#E5E7EB", borderStyle: "dashed", marginTop: 4 },
  pastBtnTxt: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: "#9CA3AF", marginTop: 12 },
});

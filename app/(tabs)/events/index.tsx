import { useState, useEffect } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, Image, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { type Event, CATEGORIES, Category, isEventPast, getCategoryColor } from "@/lib/mock-data";
import { getAdaptedEvents, getMyBookmarks, addBookmark, removeBookmark } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";

export default function EventsScreen() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [showPast, setShowPast] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);

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

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name.split(" ")[0]} 👋</Text>
          <Text style={styles.sub}>{upcoming.length} upcoming · {past.length} past</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{user?.name.slice(0, 2).toUpperCase()}</Text>
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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

function EventCard({ event, isPast, isBookmarked, onBookmark, onPress }: any) {
  const cat = getCategoryColor(event.category);
  const fillPct = Math.round((event.registrations / event.capacity) * 100);

  return (
    <TouchableOpacity style={[styles.card, isPast && styles.cardPast]} onPress={onPress} activeOpacity={0.85}>
      <Image source={{ uri: event.bannerImage }} style={styles.cardImg} />
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
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 20, marginBottom: 12, paddingRight: 12 },
  searchIcon: { paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: "#111827" },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
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
  cardImg: { width: "100%", height: 150, resizeMode: "cover" },
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

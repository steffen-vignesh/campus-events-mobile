import { useState } from "react";
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, Image, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { MOCK_EVENTS, CATEGORIES, Category, isEventPast, CATEGORY_COLORS } from "@/lib/mock-data";

export default function AdminEventsScreen() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");

  const sorted = [...MOCK_EVENTS].sort((a, b) => {
    const aPast = isEventPast(a);
    const bPast = isEventPast(b);
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const filtered = sorted.filter((e) => {
    const s = search.toLowerCase();
    const matchSearch = e.title.toLowerCase().includes(s) || e.tags.some((t) => t.includes(s));
    const matchCat = category === "all" || e.category === category;
    return matchSearch && matchCat;
  });

  const upcomingCnt = MOCK_EVENTS.filter((e) => !isEventPast(e)).length;
  const pastCnt = MOCK_EVENTS.filter((e) => isEventPast(e)).length;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Events</Text>
          <Text style={styles.sub}>{upcomingCnt} upcoming · {pastCnt} past</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push("/admin/events/new")}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
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

      {/* Category filter */}
      <FlatList
        data={[{ value: "all", label: "All" }, ...CATEGORIES]}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c.value}
        contentContainerStyle={styles.chips}
        renderItem={({ item: c }) => (
          <TouchableOpacity
            style={[styles.chip, category === c.value && styles.chipActive]}
            onPress={() => setCategory(c.value as "all" | Category)}
          >
            <Text style={[styles.chipTxt, category === c.value && styles.chipTxtActive]}>{c.label}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Event list */}
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: event }) => {
          const past = isEventPast(event);
          const fillPct = Math.round((event.registrations / event.capacity) * 100);
          const cat = CATEGORY_COLORS[event.category];
          return (
            <View style={[styles.card, past && styles.cardPast]}>
              <Image source={{ uri: event.bannerImage }} style={styles.cardImg} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                    <Text style={[styles.catTxt, { color: cat.text }]}>{event.category}</Text>
                  </View>
                  {past ? (
                    <View style={styles.completedBadge}><Text style={styles.completedTxt}>Completed</Text></View>
                  ) : (
                    <View style={styles.upcomingBadge}><Text style={styles.upcomingTxt}>Upcoming</Text></View>
                  )}
                </View>
                <Text style={styles.cardTitle} numberOfLines={2}>{event.title}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color="#9CA3AF" />
                  <Text style={styles.metaTxt}>{format(new Date(event.date), "MMM d, yyyy")}</Text>
                  <Ionicons name="location-outline" size={13} color="#9CA3AF" style={{ marginLeft: 8 }} />
                  <Text style={styles.metaTxt} numberOfLines={1}>{event.venue}</Text>
                </View>
                <View style={styles.fillRow}>
                  <View style={styles.fillBg}>
                    <View style={[styles.fillBar, {
                      width: `${Math.min(fillPct, 100)}%` as any,
                      backgroundColor: fillPct >= 90 ? "#EF4444" : fillPct >= 70 ? "#F59E0B" : "#4F46E5",
                    }]} />
                  </View>
                  <Text style={styles.fillTxt}>{event.registrations}/{event.capacity}</Text>
                </View>
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/admin/events/${event.id}`)}
                  >
                    <Ionicons name="create-outline" size={18} color="#4F46E5" />
                    <Text style={styles.actionTxt}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => router.push(`/admin/events/${event.id}/registrants`)}
                  >
                    <Ionicons name="people-outline" size={18} color="#059669" />
                    <Text style={[styles.actionTxt, { color: "#059669" }]}>Registrants</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Alert.alert("Delete", `Delete "${event.title}"?`, [
                      { text: "Cancel", style: "cancel" },
                      { text: "Delete", style: "destructive", onPress: () => {} },
                    ])}
                  >
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    <Text style={[styles.actionTxt, { color: "#EF4444" }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTxt}>No events found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8FAFF" },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 20, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 12, color: "#9CA3AF" },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#4F46E5", alignItems: "center", justifyContent: "center" },
  searchWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", marginHorizontal: 20, marginBottom: 10, paddingRight: 12 },
  searchIcon: { paddingHorizontal: 12 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 15, color: "#111827" },
  chips: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: "#E5E7EB" },
  chipActive: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipTxt: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  chipTxtActive: { color: "#fff" },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  card: { backgroundColor: "#fff", borderRadius: 20, overflow: "hidden", marginBottom: 14, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardPast: { opacity: 0.7 },
  cardImg: { width: "100%", height: 130, resizeMode: "cover" },
  cardBody: { padding: 14 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  catTxt: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  completedBadge: { backgroundColor: "#F3F4F6", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  completedTxt: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  upcomingBadge: { backgroundColor: "#EEF2FF", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  upcomingTxt: { fontSize: 11, fontWeight: "600", color: "#4F46E5" },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 8 },
  metaTxt: { fontSize: 12, color: "#9CA3AF" },
  fillRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  fillBg: { flex: 1, height: 4, backgroundColor: "#E5E7EB", borderRadius: 2 },
  fillBar: { height: 4, borderRadius: 2 },
  fillTxt: { fontSize: 11, color: "#9CA3AF" },
  actions: { flexDirection: "row", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10, gap: 4 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 6, borderRadius: 10, backgroundColor: "#F8FAFF" },
  actionTxt: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
  empty: { alignItems: "center", paddingVertical: 48 },
  emptyTxt: { fontSize: 15, color: "#9CA3AF", marginTop: 12 },
});

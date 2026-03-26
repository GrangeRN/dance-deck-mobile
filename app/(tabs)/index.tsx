import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Upload, CalendarPlus, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";
import { ColorDot } from "@/components/common/ColorDot";
import { Bookmark, BookmarkCheck } from "lucide-react-native";
import type { Event, DancerProfile } from "@/types/database";

interface ScheduleEntry {
  id: string;
  routine_title: string;
  studio_name: string | null;
  time_exact: string | null;
  time_estimated: string | null;
  heat_number: number | null;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [todayEvent, setTodayEvent] = useState<Event | null>(null);
  const [todayEntries, setTodayEntries] = useState<ScheduleEntry[]>([]);
  const [myDayIds, setMyDayIds] = useState<Set<string>>(new Set());
  const [dancers, setDancers] = useState<DancerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [scheduleFilter, setScheduleFilter] = useState<"all" | "myday">("all");

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      (async () => {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];

        const [eventRes, dancerRes, todayEventRes] = await Promise.all([
          supabase
            .from("events")
            .select("*")
            .gte("end_date", today)
            .is("deleted_at", null)
            .order("start_date", { ascending: true })
            .limit(1),
          supabase
            .from("dancer_profiles")
            .select("*")
            .eq("parent_user_id", user.id)
            .order("created_at"),
          // Check if today is a competition day
          supabase
            .from("events")
            .select("*")
            .lte("start_date", today)
            .gte("end_date", today)
            .is("deleted_at", null)
            .limit(1),
        ]);

        setNextEvent(eventRes.data?.[0] || null);
        setDancers(dancerRes.data || []);

        const todayEv = todayEventRes.data?.[0] || null;
        setTodayEvent(todayEv);

        // If competition day, load schedule
        if (todayEv) {
          const [entriesRes, myDayRes] = await Promise.all([
            supabase
              .from("schedule_entries")
              .select("id, routine_title, studio_name, time_exact, time_estimated, heat_number")
              .eq("event_id", todayEv.id)
              .is("deleted_at", null)
              .order("time_exact", { nullsFirst: false })
              .order("heat_number", { nullsFirst: false }),
            supabase
              .from("my_day_selections")
              .select("schedule_entry_id")
              .eq("event_id", todayEv.id)
              .eq("user_id", user.id),
          ]);
          setTodayEntries(entriesRes.data || []);
          setMyDayIds(new Set(myDayRes.data?.map((d) => d.schedule_entry_id) || []));
        }

        setLoading(false);
      })();
    }, [user])
  );

  const toggleMyDay = async (entryId: string) => {
    if (!user || !todayEvent) return;
    if (myDayIds.has(entryId)) {
      await supabase.from("my_day_selections").delete().eq("schedule_entry_id", entryId).eq("user_id", user.id);
      setMyDayIds((prev) => { const n = new Set(prev); n.delete(entryId); return n; });
    } else {
      await supabase.from("my_day_selections").insert({ user_id: user.id, event_id: todayEvent.id, schedule_entry_id: entryId });
      setMyDayIds((prev) => new Set(prev).add(entryId));
    }
  };

  const formatTime = (t: string | null) => {
    if (!t) return null;
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m} ${ampm}`;
  };

  const daysUntil = nextEvent
    ? Math.ceil(
        (new Date(nextEvent.start_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  // ── Competition Day Mode ──────────────────────────────────
  if (todayEvent && todayEntries.length > 0) {
    const filtered = scheduleFilter === "myday"
      ? todayEntries.filter((e) => myDayIds.has(e.id))
      : todayEntries;

    return (
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
        {/* Competition Day Header */}
        <View className="px-page-mobile pt-4 pb-2">
          <Text className="font-body-medium text-sm text-accent-violet">COMPETITION DAY</Text>
          <Text className="font-display text-xl text-txt-primary mt-1">{todayEvent.name}</Text>
          <Text className="font-mono text-sm text-txt-muted mt-1">
            {new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </Text>
        </View>

        {/* Filter Tabs */}
        <View className="flex-row px-page-mobile mb-2 gap-2">
          {(["all", "myday"] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setScheduleFilter(f)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: scheduleFilter === f ? "#4C1D95" : "transparent",
              }}
            >
              <Text className={`font-body-medium text-sm ${scheduleFilter === f ? "text-accent-violet" : "text-txt-muted"}`}>
                {f === "all" ? "All" : "My Day"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Schedule Timeline */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center pt-12">
              <Text className="font-body text-base text-txt-secondary">
                {scheduleFilter === "myday" ? "No bookmarked entries. Tap the bookmark icon to add." : "No entries"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-bg-card border border-border-subtle rounded-lg p-3 mb-2 flex-row items-center">
              <View className="mr-3 items-center" style={{ width: 50 }}>
                {(item.time_exact || item.time_estimated) ? (
                  <Text className="font-mono text-xs text-txt-muted">
                    {formatTime(item.time_exact || item.time_estimated)}
                  </Text>
                ) : item.heat_number ? (
                  <Text className="font-mono text-xs text-txt-muted">#{item.heat_number}</Text>
                ) : null}
              </View>
              <View className="flex-1">
                <Text className="font-body-medium text-sm text-txt-primary">{item.routine_title}</Text>
                {item.studio_name && (
                  <Text className="font-body text-xs text-txt-muted">{item.studio_name}</Text>
                )}
              </View>
              <Pressable onPress={() => toggleMyDay(item.id)} className="pl-2">
                {myDayIds.has(item.id) ? (
                  <BookmarkCheck color="#C084FC" size={20} strokeWidth={1.5} fill="#C084FC" />
                ) : (
                  <Bookmark color="#52525B" size={20} strokeWidth={1.5} />
                )}
              </Pressable>
            </View>
          )}
        />
      </SafeAreaView>
    );
  }

  // ── Normal Mode (Non-Competition Day) ──────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="px-page-mobile pt-6 pb-6">
          <Text className="font-display text-3xl text-txt-primary">
            DanceDeck
          </Text>
          <Text className="font-body text-base text-txt-secondary mt-1">
            {user?.user_metadata?.first_name
              ? `Hey, ${user.user_metadata.first_name}`
              : "Welcome back"}
          </Text>
        </View>

        {/* Next Event Card */}
        {nextEvent ? (
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/(tabs)/events/[eventId]",
                params: { eventId: nextEvent.id },
              })
            }
            className="mx-page-mobile mb-6"
          >
            <Card>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-body-medium text-sm text-accent-violet">
                  NEXT UP
                </Text>
                {daysUntil !== null && daysUntil >= 0 && (
                  <Text className="font-mono text-sm text-accent-violet">
                    {daysUntil === 0
                      ? "TODAY"
                      : daysUntil === 1
                        ? "TOMORROW"
                        : `${daysUntil} DAYS`}
                  </Text>
                )}
              </View>
              <Text className="font-body-medium text-lg text-txt-primary">
                {nextEvent.name}
              </Text>
              {nextEvent.venue_name && (
                <Text className="font-body text-sm text-txt-secondary mt-1">
                  {nextEvent.venue_name}
                  {nextEvent.venue_city ? `, ${nextEvent.venue_city}` : ""}
                </Text>
              )}
              <Text className="font-mono text-sm text-txt-muted mt-2">
                {new Date(nextEvent.start_date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                {nextEvent.start_date !== nextEvent.end_date &&
                  ` – ${new Date(nextEvent.end_date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}`}
              </Text>
            </Card>
          </Pressable>
        ) : (
          <View className="mx-page-mobile mb-6">
            <Card>
              <Text className="font-body-medium text-base text-txt-primary text-center">
                No upcoming events
              </Text>
              <Text className="font-body text-sm text-txt-secondary text-center mt-1">
                Add a competition or upload a program to get started
              </Text>
            </Card>
          </View>
        )}

        {/* Quick Actions */}
        <View className="px-page-mobile mb-6">
          <Text className="font-body-medium text-sm text-txt-secondary mb-3">
            QUICK ACTIONS
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={() => router.push("/upload")}
              className="flex-1"
            >
              <LinearGradient
                colors={[...gradients.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 88,
                }}
              >
                <Upload color="#F4F4F5" size={24} strokeWidth={1.5} />
                <Text className="font-body-medium text-sm text-txt-primary mt-2">
                  Upload Program
                </Text>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={() => router.push("/(tabs)/events")}
              className="flex-1"
            >
              <View
                style={{
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#27272A",
                  backgroundColor: "#1A1A1F",
                  padding: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  minHeight: 88,
                }}
              >
                <CalendarPlus color="#C084FC" size={24} strokeWidth={1.5} />
                <Text className="font-body-medium text-sm text-txt-primary mt-2">
                  Add Event
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Dancers Quick View */}
        <View className="px-page-mobile">
          <Pressable
            onPress={() => router.push("/(tabs)/account/dancers")}
            className="flex-row items-center mb-3"
          >
            <Text className="font-body-medium text-sm text-txt-secondary flex-1">
              YOUR DANCERS
            </Text>
            <ChevronRight color="#52525B" size={16} strokeWidth={1.5} />
          </Pressable>
          {dancers.length === 0 ? (
            <Card>
              <Text className="font-body text-sm text-txt-secondary text-center">
                Add your dancers in Account → Dancer Profiles
              </Text>
            </Card>
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {dancers.map((d) => (
                <Pressable
                  key={d.id}
                  onPress={() =>
                    router.push({
                      pathname: "/(tabs)/account/dancers/[dancerId]",
                      params: { dancerId: d.id },
                    })
                  }
                >
                  <Card className="flex-row items-center gap-2 py-2 px-3">
                    <ColorDot color={d.assigned_color} size={24} />
                    <Text className="font-body-medium text-sm text-txt-primary">{d.name}</Text>
                  </Card>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

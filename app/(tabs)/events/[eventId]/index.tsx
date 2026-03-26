import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, FlatList } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Bookmark, BookmarkCheck } from "lucide-react-native";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Event } from "@/types/database";

interface ScheduleEntry {
  id: string;
  routine_title: string;
  studio_name: string | null;
  dance_style: string | null;
  time_exact: string | null;
  time_estimated: string | null;
  heat_number: number | null;
  day_date: string;
  stage_room: string | null;
  entry_type: string;
}

type Tab = "info" | "schedule" | "packing" | "notes";

export default function EventDetailScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [myDayIds, setMyDayIds] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<Tab>("info");

  useFocusEffect(
    useCallback(() => {
      if (!eventId || !user) return;

      (async () => {
        const { data: e } = await supabase
          .from("events")
          .select("*")
          .eq("id", eventId)
          .single();
        setEvent(e);

        const { data: s } = await supabase
          .from("schedule_entries")
          .select("*")
          .eq("event_id", eventId)
          .is("deleted_at", null)
          .order("day_date")
          .order("time_exact", { nullsFirst: false })
          .order("heat_number", { nullsFirst: false });
        setEntries(s || []);

        const { data: md } = await supabase
          .from("my_day_selections")
          .select("schedule_entry_id")
          .eq("event_id", eventId)
          .eq("user_id", user.id);
        setMyDayIds(new Set(md?.map((d) => d.schedule_entry_id) || []));
      })();
    }, [eventId, user])
  );

  const toggleMyDay = async (entryId: string) => {
    if (!user || !eventId) return;

    if (myDayIds.has(entryId)) {
      await supabase
        .from("my_day_selections")
        .delete()
        .eq("schedule_entry_id", entryId)
        .eq("user_id", user.id);
      setMyDayIds((prev) => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    } else {
      await supabase.from("my_day_selections").insert({
        user_id: user.id,
        event_id: eventId,
        schedule_entry_id: entryId,
      });
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

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const tabs: { key: Tab; label: string }[] = [
    { key: "info", label: "Info" },
    { key: "schedule", label: "Schedule" },
    { key: "packing", label: "Packing" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View className="px-page-mobile pt-4 pb-2">
        <View className="flex-row items-center mb-2">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
          </Pressable>
          <Text className="font-display text-xl text-txt-primary flex-1" numberOfLines={1}>
            {event?.name || "Event"}
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View className="flex-row gap-1">
            {tabs.map((tab) => (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 999,
                  backgroundColor: activeTab === tab.key ? "#4C1D95" : "transparent",
                }}
              >
                <Text
                  className={`font-body-medium text-sm ${
                    activeTab === tab.key ? "text-accent-violet" : "text-txt-muted"
                  }`}
                >
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tab Content */}
      {activeTab === "info" && (
        <ScrollView className="flex-1 px-page-mobile pt-4">
          {event && (
            <>
              {event.organization_name && (
                <Text className="font-body text-base text-txt-secondary mb-4">
                  {event.organization_name}
                </Text>
              )}
              <Card className="mb-3">
                <Text className="font-body-medium text-sm text-txt-muted mb-1">DATES</Text>
                <Text className="font-mono text-base text-txt-primary">
                  {formatDate(event.start_date)}
                  {event.start_date !== event.end_date && ` – ${formatDate(event.end_date)}`}
                </Text>
              </Card>
              {(event.venue_name || event.venue_city) && (
                <Card className="mb-3">
                  <Text className="font-body-medium text-sm text-txt-muted mb-1">VENUE</Text>
                  {event.venue_name && (
                    <Text className="font-body text-base text-txt-primary">{event.venue_name}</Text>
                  )}
                  {event.venue_city && (
                    <Text className="font-body text-sm text-txt-secondary">
                      {event.venue_city}{event.venue_state ? `, ${event.venue_state}` : ""}
                    </Text>
                  )}
                </Card>
              )}
              {entries.length === 0 && (
                <Card className="mb-3">
                  <Text className="font-body text-sm text-txt-secondary text-center">
                    No schedule yet. Upload a program to add entries.
                  </Text>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      )}

      {activeTab === "schedule" && (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}
          ListEmptyComponent={
            <View className="items-center pt-12">
              <Text className="font-body text-base text-txt-secondary">No schedule entries yet</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="bg-bg-card border border-border-subtle rounded-lg p-3 mb-2 flex-row items-center">
              <View className="mr-3 items-center" style={{ width: 50 }}>
                {item.time_exact || item.time_estimated ? (
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
      )}

      {activeTab === "packing" && (
        <View className="flex-1 items-center justify-center">
          <Text className="font-body text-base text-txt-secondary">Packing list coming soon</Text>
        </View>
      )}

      {activeTab === "notes" && (
        <View className="flex-1 items-center justify-center">
          <Text className="font-body text-base text-txt-secondary">Memory notes coming soon</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

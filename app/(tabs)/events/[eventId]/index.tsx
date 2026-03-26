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
        <PackingListInline eventId={eventId!} userId={user?.id || ""} />
      )}

      {activeTab === "notes" && (
        <MemoryNotesInline eventId={eventId!} userId={user?.id || ""} />
      )}
    </SafeAreaView>
  );
}

// ── Inline Packing List ──────────────────────────────────────

function PackingListInline({ eventId, userId }: { eventId: string; userId: string }) {
  const [items, setItems] = useState<{ id: string; text: string; checked: boolean }[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  const defaults = [
    { id: "1", text: "Dance bag", checked: false },
    { id: "2", text: "Water bottle", checked: false },
    { id: "3", text: "Snacks", checked: false },
    { id: "4", text: "Bobby pins", checked: false },
    { id: "5", text: "Hair spray", checked: false },
    { id: "6", text: "Makeup kit", checked: false },
    { id: "7", text: "Safety pins", checked: false },
  ];

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      (async () => {
        const { data } = await supabase
          .from("packing_lists")
          .select("*")
          .eq("event_id", eventId)
          .eq("user_id", userId)
          .eq("is_template", false)
          .single();

        if (data) {
          setListId(data.id);
          const sections = data.sections as any[];
          setItems(sections?.[0]?.items || []);
        } else {
          const { data: created } = await supabase
            .from("packing_lists")
            .insert({ user_id: userId, event_id: eventId, name: "Packing List", sections: [{ id: "main", title: "Essentials", items: defaults }] })
            .select()
            .single();
          if (created) { setListId(created.id); setItems(defaults); }
        }
      })();
    }, [eventId, userId])
  );

  const save = async (updated: typeof items) => {
    setItems(updated);
    if (listId) {
      await supabase.from("packing_lists").update({ sections: [{ id: "main", title: "Essentials", items: updated }], updated_at: new Date().toISOString() }).eq("id", listId);
    }
  };

  const toggle = (id: string) => save(items.map((i) => i.id === id ? { ...i, checked: !i.checked } : i));

  const addNewItem = () => {
    if (!newItem.trim()) return;
    save([...items, { id: `c${Date.now()}`, text: newItem.trim(), checked: false }]);
    setNewItem("");
  };

  const { Check: CheckIcon, Plus } = require("lucide-react-native");
  const { TextInput: TI } = require("react-native");

  return (
    <ScrollView className="flex-1 px-page-mobile pt-4" contentContainerStyle={{ paddingBottom: 40 }}>
      <Text className="font-body-medium text-sm text-txt-secondary mb-3">
        {items.filter((i) => i.checked).length} / {items.length} packed
      </Text>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => toggle(item.id)} className="flex-row items-center py-3 border-b border-border-subtle">
          <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: item.checked ? "#C084FC" : "#3F3F46", backgroundColor: item.checked ? "#4C1D95" : "transparent", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
            {item.checked && <CheckIcon color="#C084FC" size={14} strokeWidth={2} />}
          </View>
          <Text className={`font-body text-base ${item.checked ? "line-through text-txt-muted" : "text-txt-primary"}`}>{item.text}</Text>
        </Pressable>
      ))}
      <View className="flex-row items-center mt-3 gap-2">
        <TI value={newItem} onChangeText={setNewItem} placeholder="Add item..." placeholderTextColor="#52525B" onSubmitEditing={addNewItem} className="flex-1 bg-bg-input text-txt-primary font-body text-base rounded-md px-3 py-2 border border-border" />
        <Pressable onPress={addNewItem} className="bg-accent-violet/20 rounded-md px-3 py-2">
          <Plus color="#C084FC" size={18} strokeWidth={1.5} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

// ── Inline Memory Notes ──────────────────────────────────────

function MemoryNotesInline({ eventId, userId }: { eventId: string; userId: string }) {
  const [content, setContent] = useState("");
  const [memId, setMemId] = useState<string | null>(null);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const { TextInput: TI } = require("react-native");

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      (async () => {
        const { data } = await supabase.from("season_memories").select("*").eq("event_id", eventId).eq("user_id", userId).single();
        if (data) { setMemId(data.id); setContent(data.content); }
      })();
    }, [eventId, userId])
  );

  const handleChange = (text: string) => {
    setContent(text);
    if (timer) clearTimeout(timer);
    setTimer(setTimeout(async () => {
      if (memId) {
        await supabase.from("season_memories").update({ content: text, updated_at: new Date().toISOString() }).eq("id", memId);
      } else if (text.trim()) {
        const { data } = await supabase.from("season_memories").insert({ user_id: userId, event_id: eventId, content: text }).select().single();
        if (data) setMemId(data.id);
      }
    }, 1000));
  };

  return (
    <View className="flex-1 px-page-mobile pt-4">
      <Text className="font-body text-xs text-txt-muted mb-3">Private — only you can see this</Text>
      <TI value={content} onChangeText={handleChange} placeholder="Write your memories from this competition..." placeholderTextColor="#52525B" multiline textAlignVertical="top" style={{ backgroundColor: "#1A1A1F", borderRadius: 12, padding: 16, minHeight: 300 }} className="text-txt-primary font-body text-base border border-border-subtle flex-1" />
      <Text className="font-body text-xs text-txt-muted mt-2 text-center">Auto-saves as you type</Text>
    </View>
  );
}

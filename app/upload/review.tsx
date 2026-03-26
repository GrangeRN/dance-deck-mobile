import { useState } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Check, X, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";

interface ParsedEntry {
  routine_title: string;
  studio_name?: string;
  dance_style?: string;
  division?: string;
  age_group?: string;
  heat_number?: number;
  time_exact?: string;
  time_estimated?: string;
  time_is_estimated?: boolean;
  dancer_names?: string[];
  choreographer_name?: string;
  day_date?: string;
  stage_room?: string;
  entry_type?: string;
  is_section_header?: boolean;
  is_title_contestant?: boolean;
  _removed?: boolean;
}

interface ParsedData {
  entries: ParsedEntry[];
  metadata?: {
    organization?: string;
    event_name?: string;
    day_date?: string;
  };
}

export default function ReviewScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { parsed } = useLocalSearchParams<{ parsed: string }>();

  let initialData: ParsedData = { entries: [] };
  try {
    initialData = JSON.parse(parsed || "{}");
  } catch {}

  const [entries, setEntries] = useState<ParsedEntry[]>(
    initialData.entries?.map((e) => ({ ...e, _removed: false })) || []
  );
  const [saving, setSaving] = useState(false);
  const metadata = initialData.metadata;

  const activeEntries = entries.filter((e) => !e._removed);

  const toggleRemove = (index: number) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === index ? { ...e, _removed: !e._removed } : e))
    );
  };

  const handleSave = async () => {
    if (!user) return;

    const toSave = entries.filter((e) => !e._removed);
    if (toSave.length === 0) {
      Alert.alert("No entries", "All entries have been removed.");
      return;
    }

    setSaving(true);
    try {
      // Create event first
      const eventName =
        metadata?.event_name ||
        (metadata?.organization ? `${metadata.organization}` : "Uploaded Program");

      const dayDate = metadata?.day_date || toSave[0]?.day_date || new Date().toISOString().split("T")[0];

      const { data: event, error: eventError } = await supabase
        .from("events")
        .insert({
          name: eventName,
          created_by: user.id,
          event_type: "competition",
          organization_name: metadata?.organization || null,
          start_date: dayDate,
          end_date: dayDate,
          status: "personal",
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Insert schedule entries
      const scheduleEntries = toSave.map((e) => ({
        event_id: event.id,
        entry_type: e.entry_type || "routine",
        day_date: e.day_date || dayDate,
        stage_room: e.stage_room || null,
        heat_number: e.heat_number || null,
        time_exact: e.time_exact || null,
        time_estimated: e.time_estimated || null,
        time_is_estimated: e.time_is_estimated || false,
        routine_title: e.routine_title,
        studio_name: e.studio_name || null,
        dance_style: e.dance_style || null,
        division: e.division || null,
        age_group: e.age_group || null,
        dancer_names: e.dancer_names || null,
        choreographer_name: e.choreographer_name || null,
        is_title_contestant: e.is_title_contestant || false,
        is_section_header: e.is_section_header || false,
      }));

      const { error: entriesError } = await supabase
        .from("schedule_entries")
        .insert(scheduleEntries);

      if (entriesError) throw entriesError;

      Alert.alert(
        "Program Saved!",
        `${toSave.length} entries added to "${eventName}"`,
        [{
          text: "View Event",
          onPress: () => router.replace({
            pathname: "/(tabs)/events/[eventId]",
            params: { eventId: event.id },
          }),
        }]
      );
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (t: string | null | undefined) => {
    if (!t) return null;
    const [h, m] = t.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${h12}:${m} ${ampm}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View className="px-page-mobile pt-4 pb-2">
        <View className="flex-row items-center mb-1">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
          </Pressable>
          <Text className="font-display text-xl text-txt-primary flex-1">
            Review Entries
          </Text>
        </View>
        <Text className="font-body text-sm text-txt-secondary">
          {activeEntries.length} entries found
          {metadata?.organization ? ` · ${metadata.organization}` : ""}
        </Text>
      </View>

      {/* Entries List */}
      <FlatList
        data={entries}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 120 }}
        renderItem={({ item, index }) => (
          <Pressable onPress={() => toggleRemove(index)}>
            <View
              className={`border rounded-lg p-3 mb-2 flex-row items-center ${
                item._removed
                  ? "bg-bg-primary border-border-subtle opacity-40"
                  : item.is_section_header
                    ? "bg-bg-elevated border-border"
                    : "bg-bg-card border-border-subtle"
              }`}
            >
              <View className="mr-3 items-center" style={{ width: 44 }}>
                {item.heat_number ? (
                  <Text className="font-mono text-xs text-txt-muted">#{item.heat_number}</Text>
                ) : (item.time_exact || item.time_estimated) ? (
                  <Text className="font-mono text-xs text-txt-muted">
                    {formatTime(item.time_exact || item.time_estimated)}
                  </Text>
                ) : null}
              </View>
              <View className="flex-1">
                <Text
                  className={`font-body-medium text-sm ${
                    item._removed ? "line-through text-txt-muted" : "text-txt-primary"
                  }`}
                >
                  {item.routine_title}
                </Text>
                <View className="flex-row flex-wrap gap-1 mt-0.5">
                  {item.studio_name && (
                    <Text className="font-body text-xs text-txt-muted">{item.studio_name}</Text>
                  )}
                  {item.dance_style && (
                    <Text className="font-body text-xs text-accent-violet"> · {item.dance_style}</Text>
                  )}
                </View>
              </View>
              {item._removed ? (
                <X color="#52525B" size={16} strokeWidth={1.5} />
              ) : (
                <Trash2 color="#52525B" size={16} strokeWidth={1.5} />
              )}
            </View>
          </Pressable>
        )}
      />

      {/* Save Button */}
      <View className="absolute bottom-0 left-0 right-0 px-page-mobile pb-8 pt-4 bg-bg-primary">
        <Pressable onPress={handleSave} disabled={saving || activeEntries.length === 0}>
          <LinearGradient
            colors={saving || activeEntries.length === 0 ? ["#27272A", "#27272A"] : [...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
          >
            <Text className={`font-body-medium text-base ${saving || activeEntries.length === 0 ? "text-txt-muted" : "text-txt-primary"}`}>
              {saving ? "Saving..." : `Save ${activeEntries.length} Entries`}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

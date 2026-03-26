import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, Alert, TextInput } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { adjudicationTiers } from "@/lib/theme";

interface ScheduleEntry {
  id: string;
  routine_title: string;
  studio_name: string | null;
  dance_style: string | null;
  heat_number: number | null;
  day_date: string;
}

interface AwardResult {
  id?: string;
  schedule_entry_id: string;
  adjudication_tier: string | null;
  category_placement: number | null;
  overall_placement: number | null;
  comment: string | null;
}

const DEFAULT_TIERS = ["Platinum", "High Gold", "Gold", "High Silver", "Silver"];

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  Platinum: { bg: "#4C1D95", text: "#C084FC" },
  "High Gold": { bg: "#451A03", text: "#F59E0B" },
  Gold: { bg: "#713F12", text: "#FCD34D" },
  "High Silver": { bg: "#1E293B", text: "#94A3B8" },
  Silver: { bg: "#0F172A", text: "#64748B" },
};

export default function AwardEntryScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [awards, setAwards] = useState<Record<string, AwardResult>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [eventName, setEventName] = useState("");

  useFocusEffect(
    useCallback(() => {
      if (!eventId || !user) return;

      (async () => {
        // Load event name
        const { data: ev } = await supabase
          .from("events")
          .select("name")
          .eq("id", eventId)
          .single();
        setEventName(ev?.name || "");

        // Load schedule entries
        const { data: se } = await supabase
          .from("schedule_entries")
          .select("id, routine_title, studio_name, dance_style, heat_number, day_date")
          .eq("event_id", eventId)
          .is("deleted_at", null)
          .eq("is_section_header", false)
          .order("heat_number", { nullsFirst: false });
        setEntries(se || []);

        // Load existing awards
        const { data: ar } = await supabase
          .from("award_results")
          .select("*")
          .eq("event_id", eventId);

        const awardsMap: Record<string, AwardResult> = {};
        ar?.forEach((a) => {
          awardsMap[a.schedule_entry_id] = a;
        });
        setAwards(awardsMap);
      })();
    }, [eventId, user])
  );

  const setTier = async (entryId: string, tier: string) => {
    if (!user || !eventId) return;

    const existing = awards[entryId];
    const newTier = existing?.adjudication_tier === tier ? null : tier;

    if (existing?.id) {
      await supabase
        .from("award_results")
        .update({ adjudication_tier: newTier, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("award_results")
        .insert({
          event_id: eventId,
          schedule_entry_id: entryId,
          adjudication_tier: newTier,
          created_by: user.id,
        })
        .select()
        .single();

      if (data) {
        setAwards((prev) => ({ ...prev, [entryId]: data }));
        return;
      }
    }

    setAwards((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], schedule_entry_id: entryId, adjudication_tier: newTier },
    }));
  };

  const setPlacement = async (entryId: string, field: "category_placement" | "overall_placement", value: string) => {
    if (!user || !eventId) return;

    const num = value ? parseInt(value) : null;
    const existing = awards[entryId];

    if (existing?.id) {
      await supabase
        .from("award_results")
        .update({ [field]: num, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      const { data } = await supabase
        .from("award_results")
        .insert({
          event_id: eventId,
          schedule_entry_id: entryId,
          [field]: num,
          created_by: user.id,
        })
        .select()
        .single();

      if (data) {
        setAwards((prev) => ({ ...prev, [entryId]: data }));
        return;
      }
    }

    setAwards((prev) => ({
      ...prev,
      [entryId]: { ...prev[entryId], schedule_entry_id: entryId, [field]: num },
    }));
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-page-mobile pt-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-display text-xl text-txt-primary flex-1" numberOfLines={1}>
          {eventName || "Awards"}
        </Text>
      </View>

      {entries.length === 0 ? (
        <View className="flex-1 items-center justify-center px-page-mobile">
          <Text className="font-body text-base text-txt-secondary text-center">
            No schedule entries. Upload a program first to track awards.
          </Text>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => {
            const award = awards[item.id];
            const isExpanded = expandedId === item.id;

            return (
              <View className="bg-bg-card border border-border-subtle rounded-lg mb-2 overflow-hidden">
                {/* Entry Row */}
                <Pressable
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  className="p-3 flex-row items-center"
                >
                  {item.heat_number && (
                    <Text className="font-mono text-xs text-txt-muted w-8">#{item.heat_number}</Text>
                  )}
                  <View className="flex-1">
                    <Text className="font-body-medium text-sm text-txt-primary">{item.routine_title}</Text>
                    {item.studio_name && (
                      <Text className="font-body text-xs text-txt-muted">{item.studio_name}</Text>
                    )}
                  </View>
                  {award?.adjudication_tier && (
                    <View
                      style={{
                        backgroundColor: TIER_COLORS[award.adjudication_tier]?.bg || "#27272A",
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 999,
                        marginRight: 8,
                      }}
                    >
                      <Text
                        style={{ color: TIER_COLORS[award.adjudication_tier]?.text || "#A1A1AA" }}
                        className="font-body-medium text-xs"
                      >
                        {award.adjudication_tier}
                      </Text>
                    </View>
                  )}
                  {isExpanded ? (
                    <ChevronUp color="#52525B" size={16} />
                  ) : (
                    <ChevronDown color="#52525B" size={16} />
                  )}
                </Pressable>

                {/* Expanded: Tier Buttons + Placements */}
                {isExpanded && (
                  <View className="px-3 pb-3 border-t border-border-subtle pt-3">
                    {/* Tier Buttons */}
                    <Text className="font-body-medium text-xs text-txt-muted mb-2">ADJUDICATION</Text>
                    <View className="flex-row flex-wrap gap-2 mb-4">
                      {DEFAULT_TIERS.map((tier) => {
                        const selected = award?.adjudication_tier === tier;
                        const colors = TIER_COLORS[tier] || { bg: "#27272A", text: "#A1A1AA" };
                        return (
                          <Pressable key={tier} onPress={() => setTier(item.id, tier)}>
                            <View
                              style={{
                                backgroundColor: selected ? colors.bg : "#1A1A1F",
                                borderWidth: 1,
                                borderColor: selected ? colors.text : "#3F3F46",
                                paddingHorizontal: 14,
                                paddingVertical: 8,
                                borderRadius: 999,
                              }}
                            >
                              <Text
                                style={{ color: selected ? colors.text : "#52525B" }}
                                className="font-body-medium text-sm"
                              >
                                {tier}
                              </Text>
                            </View>
                          </Pressable>
                        );
                      })}
                    </View>

                    {/* Placements */}
                    <Text className="font-body-medium text-xs text-txt-muted mb-2">PLACEMENT</Text>
                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <Text className="font-body text-xs text-txt-muted mb-1">Category</Text>
                        <TextInput
                          value={award?.category_placement?.toString() || ""}
                          onChangeText={(v) => setPlacement(item.id, "category_placement", v)}
                          placeholder="#"
                          placeholderTextColor="#52525B"
                          keyboardType="numeric"
                          className="bg-bg-input text-txt-primary font-mono text-base rounded-md px-3 py-2 border border-border text-center"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-body text-xs text-txt-muted mb-1">Overall</Text>
                        <TextInput
                          value={award?.overall_placement?.toString() || ""}
                          onChangeText={(v) => setPlacement(item.id, "overall_placement", v)}
                          placeholder="#"
                          placeholderTextColor="#52525B"
                          keyboardType="numeric"
                          className="bg-bg-input text-txt-primary font-mono text-base rounded-md px-3 py-2 border border-border text-center"
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

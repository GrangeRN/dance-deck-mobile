import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, CalendarDays } from "lucide-react-native";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Event } from "@/types/database";

export default function EventsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        setLoading(true);
        const { data } = await supabase
          .from("events")
          .select("*")
          .is("deleted_at", null)
          .order("start_date", { ascending: true });
        setEvents(data || []);
        setLoading(false);
      })();
    }, [user])
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-page-mobile pt-6 pb-4">
        <Text className="font-display text-2xl text-txt-primary flex-1">Events</Text>
        <Pressable onPress={() => router.push("/(tabs)/events/add")}>
          <Plus color="#C084FC" size={24} strokeWidth={1.5} />
        </Pressable>
      </View>

      {events.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center px-page-mobile">
          <CalendarDays color="#52525B" size={48} strokeWidth={1.5} />
          <Text className="font-body-medium text-lg text-txt-primary mt-4">No events yet</Text>
          <Text className="font-body text-base text-txt-secondary text-center mt-1 mb-6">
            Add a competition or upload a program to get started
          </Text>
          <Pressable
            onPress={() => router.push("/(tabs)/events/add")}
            className="flex-row items-center bg-bg-card border border-accent-violet rounded-md px-5 py-3"
          >
            <Plus color="#C084FC" size={20} strokeWidth={1.5} />
            <Text className="font-body-medium text-base text-accent-violet ml-2">Add Event</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/events/[eventId]",
                  params: { eventId: item.id },
                })
              }
              className="mb-3"
            >
              <Card>
                <Text className="font-body-medium text-base text-txt-primary">
                  {item.name}
                </Text>
                {item.organization_name && (
                  <Text className="font-body text-sm text-txt-secondary mt-0.5">
                    {item.organization_name}
                  </Text>
                )}
                <View className="flex-row items-center mt-2">
                  <Text className="font-mono text-sm text-txt-muted">
                    {formatDate(item.start_date)}
                    {item.start_date !== item.end_date && ` – ${formatDate(item.end_date)}`}
                  </Text>
                  {item.venue_city && (
                    <Text className="font-body text-sm text-txt-muted ml-2">
                      · {item.venue_city}{item.venue_state ? `, ${item.venue_state}` : ""}
                    </Text>
                  )}
                </View>
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

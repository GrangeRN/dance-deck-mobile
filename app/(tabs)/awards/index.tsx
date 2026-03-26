import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy } from "lucide-react-native";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Event } from "@/types/database";

export default function AwardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      (async () => {
        const { data } = await supabase
          .from("events")
          .select("*")
          .is("deleted_at", null)
          .order("start_date", { ascending: false });
        setEvents(data || []);
      })();
    }, [user])
  );

  const today = new Date().toISOString().split("T")[0];
  const current = events.filter((e) => e.end_date >= today);
  const past = events.filter((e) => e.end_date < today);

  const formatDate = (d: string) =>
    new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="px-page-mobile pt-6 pb-4">
        <Text className="font-display text-2xl text-txt-primary">Awards</Text>
      </View>

      {events.length === 0 ? (
        <View className="flex-1 items-center justify-center">
          <Trophy color="#52525B" size={48} strokeWidth={1.5} />
          <Text className="font-body-medium text-lg text-txt-primary mt-4">No competitions yet</Text>
          <Text className="font-body text-base text-txt-secondary mt-1">Add an event to start tracking awards</Text>
        </View>
      ) : (
        <FlatList
          data={[...current, ...past]}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          ListHeaderComponent={
            current.length > 0 ? (
              <Text className="font-body-medium text-sm text-txt-secondary mb-3">CURRENT & UPCOMING</Text>
            ) : null
          }
          renderItem={({ item, index }) => (
            <>
              {index === current.length && past.length > 0 && (
                <Text className="font-body-medium text-sm text-txt-secondary mb-3 mt-4">PAST</Text>
              )}
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/(tabs)/awards/[eventId]",
                    params: { eventId: item.id },
                  })
                }
                className="mb-3"
              >
                <Card>
                  <View className="flex-row items-center">
                    <Trophy color="#C084FC" size={20} strokeWidth={1.5} />
                    <Text className="font-body-medium text-base text-txt-primary ml-2 flex-1">
                      {item.name}
                    </Text>
                  </View>
                  <Text className="font-mono text-sm text-txt-muted mt-1 ml-7">
                    {formatDate(item.start_date)}
                  </Text>
                </Card>
              </Pressable>
            </>
          )}
        />
      )}
    </SafeAreaView>
  );
}

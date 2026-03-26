import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Upload, CalendarPlus, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";
import type { Event } from "@/types/database";

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;

      (async () => {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];

        // Get next upcoming event
        const { data } = await supabase
          .from("events")
          .select("*")
          .gte("end_date", today)
          .is("deleted_at", null)
          .order("start_date", { ascending: true })
          .limit(1);

        setNextEvent(data?.[0] || null);
        setLoading(false);
      })();
    }, [user])
  );

  const daysUntil = nextEvent
    ? Math.ceil(
        (new Date(nextEvent.start_date).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

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
          <Card>
            <Text className="font-body text-sm text-txt-secondary text-center">
              Go to Account → Dancer Profiles to add your dancers
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

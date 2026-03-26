import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Plus, Hash } from "lucide-react-native";
import { Card } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";

interface Channel {
  id: string;
  name: string;
  channel_type: string;
  group_id: string;
  groupName?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups } = useGroups();
  const [channels, setChannels] = useState<Channel[]>([]);

  useFocusEffect(
    useCallback(() => {
      if (!user || groups.length === 0) {
        setChannels([]);
        return;
      }

      (async () => {
        const groupIds = groups.filter((g) => g.myStatus === "approved").map((g) => g.id);
        if (groupIds.length === 0) { setChannels([]); return; }

        const { data } = await supabase
          .from("chat_channels")
          .select("*")
          .in("group_id", groupIds)
          .order("created_at");

        const enriched = (data || []).map((c) => ({
          ...c,
          groupName: groups.find((g) => g.id === c.group_id)?.name,
        }));
        setChannels(enriched);
      })();
    }, [user, groups])
  );

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-page-mobile pt-6 pb-4">
        <Text className="font-display text-2xl text-txt-primary flex-1">Chat</Text>
        {groups.length > 0 && (
          <Pressable onPress={() => router.push("/(tabs)/chat/create")}>
            <Plus color="#C084FC" size={24} strokeWidth={1.5} />
          </Pressable>
        )}
      </View>

      {groups.length === 0 ? (
        <View className="flex-1 items-center justify-center px-page-mobile">
          <MessageCircle color="#52525B" size={48} strokeWidth={1.5} />
          <Text className="font-body-medium text-lg text-txt-primary mt-4">No groups yet</Text>
          <Text className="font-body text-base text-txt-secondary text-center mt-1">
            Join or create a Dance Group to start chatting
          </Text>
        </View>
      ) : channels.length === 0 ? (
        <View className="flex-1 items-center justify-center px-page-mobile">
          <MessageCircle color="#52525B" size={48} strokeWidth={1.5} />
          <Text className="font-body-medium text-lg text-txt-primary mt-4">No channels yet</Text>
          <Text className="font-body text-base text-txt-secondary text-center mt-1">
            Create a channel to start a conversation
          </Text>
        </View>
      ) : (
        <FlatList
          data={channels}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/chat/[channelId]",
                  params: { channelId: item.id },
                })
              }
              className="mb-2"
            >
              <Card>
                <View className="flex-row items-center">
                  <Hash color="#C084FC" size={18} strokeWidth={1.5} />
                  <Text className="font-body-medium text-base text-txt-primary ml-2 flex-1">
                    {item.name}
                  </Text>
                </View>
                {item.groupName && (
                  <Text className="font-body text-xs text-txt-muted ml-6 mt-0.5">
                    {item.groupName}
                  </Text>
                )}
              </Card>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

import { useState } from "react";
import { View, Text, Pressable, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { useGroups } from "@/hooks/useGroups";
import { gradients } from "@/lib/theme";

export default function CreateChannelScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { groups } = useGroups();
  const approvedGroups = groups.filter((g) => g.myStatus === "approved");

  const [name, setName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState(approvedGroups[0]?.id || "");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !selectedGroupId || !user) return;

    setSaving(true);
    try {
      const { data: channel, error } = await supabase
        .from("chat_channels")
        .insert({
          group_id: selectedGroupId,
          name: name.trim(),
          channel_type: "custom",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as member
      await supabase.from("chat_channel_members").insert({
        channel_id: channel.id,
        user_id: user.id,
      });

      router.replace({
        pathname: "/(tabs)/chat/[channelId]",
        params: { channelId: channel.id },
      });
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <View className="flex-row items-center px-page-mobile pt-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-display text-xl text-txt-primary">New Channel</Text>
      </View>

      <View className="px-page-mobile gap-4">
        <View>
          <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">Channel Name</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Hotel Room Share, Carpool"
            placeholderTextColor="#52525B"
            className="bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border"
          />
        </View>

        {approvedGroups.length > 1 && (
          <View>
            <Text className="font-body-medium text-sm text-txt-secondary mb-2">Group</Text>
            {approvedGroups.map((g) => (
              <Pressable
                key={g.id}
                onPress={() => setSelectedGroupId(g.id)}
                className="mb-2"
              >
                <View
                  style={{
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: selectedGroupId === g.id ? "#C084FC" : "#27272A",
                    backgroundColor: selectedGroupId === g.id ? "#1E1040" : "#1A1A1F",
                    padding: 14,
                  }}
                >
                  <Text className={`font-body-medium text-base ${selectedGroupId === g.id ? "text-accent-violet" : "text-txt-primary"}`}>
                    {g.name}
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        <Pressable onPress={handleCreate} disabled={!name.trim() || saving} className="mt-2">
          <LinearGradient
            colors={!name.trim() || saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
          >
            <Text className={`font-body-medium text-base ${!name.trim() || saving ? "text-txt-muted" : "text-txt-primary"}`}>
              {saving ? "Creating..." : "Create Channel"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

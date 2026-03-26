import { useState } from "react";
import { View, Text, Pressable, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";

export default function CreateGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user) return;

    setSaving(true);
    try {
      // Generate join code
      const { data: codeData } = await supabase.rpc("generate_join_code");
      const joinCode = codeData || Math.random().toString(36).substring(2, 8).toUpperCase();

      // Create group
      const { data: group, error } = await supabase
        .from("groups")
        .insert({
          name: name.trim(),
          group_type: "dance_group",
          join_code: joinCode,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "owner",
          status: "approved",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        });

      if (memberError) throw memberError;

      Alert.alert(
        "Group Created!",
        `Share this join code with your dance friends:\n\n${joinCode}`,
        [{ text: "Got it", onPress: () => router.back() }]
      );
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
        <Text className="font-display text-2xl text-txt-primary">
          Create Dance Group
        </Text>
      </View>

      <View className="px-page-mobile">
        <Text className="font-body text-base text-txt-secondary mb-6">
          Create a group to share schedules, costumes, and competition info with other dance families.
        </Text>

        <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">
          Group Name
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g., Miss Kim's Competition Team"
          placeholderTextColor="#52525B"
          autoCapitalize="words"
          className="bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border mb-8"
        />

        <Pressable onPress={handleCreate} disabled={!name.trim() || saving}>
          <LinearGradient
            colors={!name.trim() || saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
          >
            <Text className={`font-body-medium text-base ${!name.trim() || saving ? "text-txt-muted" : "text-txt-primary"}`}>
              {saving ? "Creating..." : "Create Group"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

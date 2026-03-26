import { useState } from "react";
import { View, Text, Pressable, Alert, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";

export default function JoinGroupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [saving, setSaving] = useState(false);

  const handleJoin = async () => {
    if (!code.trim() || !user) return;

    setSaving(true);
    try {
      // Find group by join code
      const { data: group, error: findError } = await supabase
        .from("groups")
        .select("id, name")
        .eq("join_code", code.trim().toUpperCase())
        .is("absorbed_into", null)
        .single();

      if (findError || !group) {
        Alert.alert("Not Found", "No group found with that join code. Check the code and try again.");
        setSaving(false);
        return;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from("group_members")
        .select("id, status")
        .eq("group_id", group.id)
        .eq("user_id", user.id)
        .single();

      if (existing) {
        Alert.alert(
          "Already Joined",
          existing.status === "pending"
            ? "Your request is pending approval."
            : `You're already a member of ${group.name}.`
        );
        setSaving(false);
        return;
      }

      // Request to join (pending)
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: "parent",
          status: "pending",
        });

      if (error) throw error;

      Alert.alert(
        "Request Sent!",
        `Your request to join "${group.name}" has been sent. You'll get access once an admin approves you.`,
        [{ text: "OK", onPress: () => router.back() }]
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
          Join a Group
        </Text>
      </View>

      <View className="px-page-mobile">
        <Text className="font-body text-base text-txt-secondary mb-6">
          Enter the 6-character join code shared by your group admin.
        </Text>

        <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">
          Join Code
        </Text>
        <TextInput
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase())}
          placeholder="e.g., ABC123"
          placeholderTextColor="#52525B"
          autoCapitalize="characters"
          maxLength={6}
          className="bg-bg-input text-txt-primary font-mono text-2xl rounded-md px-4 py-4 border border-border mb-8 text-center tracking-widest"
        />

        <Pressable onPress={handleJoin} disabled={code.trim().length < 6 || saving}>
          <LinearGradient
            colors={code.trim().length < 6 || saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
          >
            <Text className={`font-body-medium text-base ${code.trim().length < 6 || saving ? "text-txt-muted" : "text-txt-primary"}`}>
              {saving ? "Joining..." : "Join Group"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

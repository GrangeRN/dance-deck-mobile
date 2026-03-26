import { useState } from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Building2 } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { gradients, colors } from "@/lib/theme";

type Role = "parent" | "studio_owner";

export default function OnboardingScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selectedRole) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({ role: selectedRole })
        .eq("id", user.id);

      if (error) throw error;

      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary">
      <View className="flex-1 px-page-mobile justify-center">
        <Text className="font-display text-3xl text-txt-primary text-center mb-2">
          Tell us about you
        </Text>
        <Text className="font-body text-base text-txt-secondary text-center mb-10">
          You can always change this later
        </Text>

        <View className="gap-4 mb-10">
          <Pressable onPress={() => setSelectedRole("parent")}>
            <View
              style={{
                borderRadius: 16,
                borderWidth: selectedRole === "parent" ? 2 : 1,
                borderColor: selectedRole === "parent" ? "#C084FC" : "#27272A",
                backgroundColor: selectedRole === "parent" ? "#1E1040" : "#1A1A1F",
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: selectedRole === "parent" ? "#4C1D95" : "#27272A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heart
                  color={selectedRole === "parent" ? "#C084FC" : "#52525B"}
                  size={24}
                  strokeWidth={1.5}
                />
              </View>
              <View className="flex-1">
                <Text className="font-body-medium text-lg text-txt-primary">
                  I'm a Dance Parent
                </Text>
                <Text className="font-body text-sm text-txt-secondary mt-1">
                  Track schedules, costumes, awards, and more
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable onPress={() => setSelectedRole("studio_owner")}>
            <View
              style={{
                borderRadius: 16,
                borderWidth: selectedRole === "studio_owner" ? 2 : 1,
                borderColor: selectedRole === "studio_owner" ? "#C084FC" : "#27272A",
                backgroundColor: selectedRole === "studio_owner" ? "#1E1040" : "#1A1A1F",
                padding: 20,
                flexDirection: "row",
                alignItems: "center",
                gap: 16,
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: selectedRole === "studio_owner" ? "#4C1D95" : "#27272A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Building2
                  color={selectedRole === "studio_owner" ? "#C084FC" : "#52525B"}
                  size={24}
                  strokeWidth={1.5}
                />
              </View>
              <View className="flex-1">
                <Text className="font-body-medium text-lg text-txt-primary">
                  I'm a Studio Owner
                </Text>
                <Text className="font-body text-sm text-txt-secondary mt-1">
                  Manage rosters, routines, and recitals
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        <Pressable
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        >
          <LinearGradient
            colors={!selectedRole || loading ? ["#27272A", "#27272A"] : [...gradients.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
          >
            <Text
              className={`font-body-medium text-base ${
                !selectedRole || loading ? "text-txt-muted" : "text-txt-primary"
              }`}
            >
              {loading ? "Setting up..." : "Continue"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

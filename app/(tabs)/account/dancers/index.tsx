import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus } from "lucide-react-native";
import { ColorDot } from "@/components/common/ColorDot";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { DancerProfile } from "@/types/database";

export default function DancersScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [dancers, setDancers] = useState<DancerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDancers = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("dancer_profiles")
      .select("*")
      .eq("parent_user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setDancers(data || []);
    }
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadDancers();
    }, [loadDancers])
  );

  const handleAddDancer = () => {
    router.push({
      pathname: "/(tabs)/account/dancers/[dancerId]",
      params: { dancerId: "new" },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-page-mobile pt-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-display text-2xl text-txt-primary flex-1">
          Dancer Profiles
        </Text>
        <Pressable onPress={handleAddDancer}>
          <Plus color="#C084FC" size={24} strokeWidth={1.5} />
        </Pressable>
      </View>

      {dancers.length === 0 && !loading ? (
        <View className="flex-1 items-center justify-center px-page-mobile">
          <Text className="font-body-medium text-lg text-txt-primary mb-2">
            No dancers yet
          </Text>
          <Text className="font-body text-base text-txt-secondary text-center mb-6">
            Add your dancers to start tracking routines, costumes, and more
          </Text>
          <Pressable
            onPress={handleAddDancer}
            className="flex-row items-center bg-bg-card border border-accent-violet rounded-md px-5 py-3"
          >
            <Plus color="#C084FC" size={20} strokeWidth={1.5} />
            <Text className="font-body-medium text-base text-accent-violet ml-2">
              Add Dancer
            </Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={dancers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/account/dancers/[dancerId]",
                  params: { dancerId: item.id },
                })
              }
              className="bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-3 flex-row items-center"
            >
              <ColorDot color={item.assigned_color} size={40} />
              <View className="ml-3 flex-1">
                <Text className="font-body-medium text-lg text-txt-primary">
                  {item.name}
                </Text>
              </View>
              <Text className="font-body text-sm text-txt-muted">›</Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

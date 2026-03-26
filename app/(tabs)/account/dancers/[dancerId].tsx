import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ColorDot } from "@/components/common/ColorDot";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";
import { DANCER_COLORS } from "@/constants/dancer-colors";
import type { DancerProfile, Routine } from "@/types/database";

export default function DancerDetailScreen() {
  const router = useRouter();
  const { dancerId } = useLocalSearchParams<{ dancerId: string }>();
  const { user } = useAuth();
  const isNew = dancerId === "new";

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(DANCER_COLORS[0].hex);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);
  const [dancer, setDancer] = useState<DancerProfile | null>(null);

  // Load dancer + routines
  useFocusEffect(
    useCallback(() => {
      if (isNew || !dancerId) return;

      (async () => {
        const { data } = await supabase
          .from("dancer_profiles")
          .select("*")
          .eq("id", dancerId)
          .single();

        if (data) {
          setDancer(data);
          setName(data.name);
          setSelectedColor(data.assigned_color);
        }

        // Load routines linked to this dancer
        const { data: rd } = await supabase
          .from("routine_dancers")
          .select("routine_id")
          .eq("dancer_profile_id", dancerId);

        if (rd && rd.length > 0) {
          const routineIds = rd.map((r) => r.routine_id);
          const { data: routineData } = await supabase
            .from("routines")
            .select("*")
            .in("id", routineIds)
            .is("deleted_at", null)
            .order("title");

          setRoutines(routineData || []);
        }
      })();
    }, [dancerId, isNew])
  );

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please enter the dancer's name.");
      return;
    }
    if (!user) return;

    setSaving(true);
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("dancer_profiles")
          .insert({
            parent_user_id: user.id,
            name: name.trim(),
            assigned_color: selectedColor,
          })
          .select()
          .single();

        if (error) throw error;
        // Navigate to the newly created dancer
        router.replace({
          pathname: "/(tabs)/account/dancers/[dancerId]",
          params: { dancerId: data.id },
        });
      } else {
        const { error } = await supabase
          .from("dancer_profiles")
          .update({
            name: name.trim(),
            assigned_color: selectedColor,
          })
          .eq("id", dancerId);

        if (error) throw error;
        Alert.alert("Saved", "Dancer profile updated.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Dancer",
      `Remove ${name || "this dancer"} from your profiles? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase
              .from("dancer_profiles")
              .delete()
              .eq("id", dancerId);

            if (error) {
              Alert.alert("Error", error.message);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleAddRoutine = () => {
    router.push({
      pathname: "/(tabs)/account/dancers/routine/[routineId]",
      params: { routineId: "new", dancerId: dancerId! },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View className="flex-row items-center px-page-mobile pt-4 pb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
          </Pressable>
          <Text className="font-display text-2xl text-txt-primary flex-1">
            {isNew ? "Add Dancer" : "Edit Dancer"}
          </Text>
          {!isNew && (
            <Pressable onPress={handleDelete}>
              <Trash2 color="#F87171" size={20} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>

        <View className="px-page-mobile">
          {/* Name */}
          <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">
            Name
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Dancer's name"
            placeholderTextColor="#52525B"
            autoCapitalize="words"
            className="bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border mb-6"
          />

          {/* Color Picker */}
          <Text className="font-body-medium text-sm text-txt-secondary mb-3">
            Color
          </Text>
          <View className="flex-row flex-wrap gap-3 mb-8">
            {DANCER_COLORS.map((c) => (
              <Pressable
                key={c.hex}
                onPress={() => setSelectedColor(c.hex)}
              >
                <ColorDot
                  color={c.hex}
                  size={40}
                  selected={selectedColor === c.hex}
                />
              </Pressable>
            ))}
          </View>

          {/* Save Button */}
          <Pressable onPress={handleSave} disabled={saving}>
            <LinearGradient
              colors={saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 32 }}
            >
              <Text className={`font-body-medium text-base ${saving ? "text-txt-muted" : "text-txt-primary"}`}>
                {saving ? "Saving..." : isNew ? "Add Dancer" : "Save Changes"}
              </Text>
            </LinearGradient>
          </Pressable>

          {/* Routines Section (only for existing dancers) */}
          {!isNew && (
            <>
              <View className="flex-row items-center mb-3">
                <Text className="font-body-medium text-lg text-txt-primary flex-1">
                  Routines
                </Text>
                <Pressable onPress={handleAddRoutine} className="flex-row items-center">
                  <Plus color="#C084FC" size={18} strokeWidth={1.5} />
                  <Text className="font-body-medium text-sm text-accent-violet ml-1">
                    Add
                  </Text>
                </Pressable>
              </View>

              {routines.length === 0 ? (
                <View className="bg-bg-card border border-border-subtle rounded-lg p-card-pad items-center">
                  <Text className="font-body text-sm text-txt-secondary text-center">
                    No routines yet. Add routines to track costumes, hair, and more.
                  </Text>
                </View>
              ) : (
                routines.map((routine) => (
                  <View
                    key={routine.id}
                    className="bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-3"
                  >
                    <Text className="font-body-medium text-base text-txt-primary">
                      {routine.title}
                    </Text>
                    {routine.dance_style && (
                      <Text className="font-body text-sm text-txt-secondary mt-1">
                        {routine.dance_style}
                      </Text>
                    )}
                    {routine.costume_description && (
                      <Text className="font-body text-sm text-txt-muted mt-1" numberOfLines={2}>
                        Costume: {routine.costume_description}
                      </Text>
                    )}
                  </View>
                ))
              )}
            </>
          )}
        </View>

        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
}

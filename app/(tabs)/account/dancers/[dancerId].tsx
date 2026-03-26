import { useState, useCallback } from "react";
import {
  View, Text, Pressable, ScrollView, Alert, TextInput, Platform,
} from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Plus, Trash2, Edit3, ChevronRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ColorDot } from "@/components/common/ColorDot";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";
import { DANCER_COLORS } from "@/constants/dancer-colors";
import type { DancerProfile, Routine } from "@/types/database";

function getCompetingAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob + "T00:00:00");
  const jan1 = new Date(new Date().getFullYear(), 0, 1);
  let age = jan1.getFullYear() - birth.getFullYear();
  const m = jan1.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && jan1.getDate() < birth.getDate())) age--;
  return age;
}

export default function DancerDetailScreen() {
  const router = useRouter();
  const { dancerId } = useLocalSearchParams<{ dancerId: string }>();
  const { user } = useAuth();
  const isNew = dancerId === "new";

  const [editing, setEditing] = useState(isNew);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState<string>(DANCER_COLORS[0].hex);
  const [dob, setDob] = useState("");
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [saving, setSaving] = useState(false);
  const [dancer, setDancer] = useState<DancerProfile | null>(null);
  const [saved, setSaved] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (isNew) { setEditing(true); return; }
      if (!dancerId) return;

      (async () => {
        const { data } = await supabase
          .from("dancer_profiles").select("*").eq("id", dancerId).single();
        if (data) {
          setDancer(data);
          setName(data.name);
          setSelectedColor(data.assigned_color);
          setDob((data as any).date_of_birth || "");
        }

        const { data: rd } = await supabase
          .from("routine_dancers").select("routine_id").eq("dancer_profile_id", dancerId);
        if (rd && rd.length > 0) {
          const ids = rd.map((r) => r.routine_id);
          const { data: routineData } = await supabase
            .from("routines").select("*").in("id", ids).is("deleted_at", null).order("title");
          setRoutines(routineData || []);
        } else {
          setRoutines([]);
        }
      })();
    }, [dancerId, isNew])
  );

  const handleSave = async () => {
    if (!name.trim() || !user || saving) return;

    setSaving(true);
    try {
      if (isNew) {
        const { data, error } = await supabase
          .from("dancer_profiles")
          .insert({
            parent_user_id: user.id,
            name: name.trim(),
            assigned_color: selectedColor,
            date_of_birth: dob || null,
          })
          .select().single();
        if (error) throw error;
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
            date_of_birth: dob || null,
          })
          .eq("id", dancerId);
        if (error) throw error;
        setDancer({ ...dancer!, name: name.trim(), assigned_color: selectedColor });
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err: any) {
      if (Platform.OS === "web") window.alert(err.message);
      else Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      await supabase.from("dancer_profiles").delete().eq("id", dancerId);
      router.back();
    };
    if (Platform.OS === "web") {
      if (window.confirm(`Remove ${name || "this dancer"}? This cannot be undone.`)) doDelete();
    } else {
      Alert.alert("Delete Dancer", `Remove ${name}?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const competingAge = getCompetingAge(dob || (dancer as any)?.date_of_birth);

  // ── EDIT MODE ──────────────────────────────────────────────
  if (editing) {
    return (
      <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="flex-row items-center px-page-mobile pt-4 pb-4">
            <Pressable onPress={() => isNew ? router.back() : setEditing(false)} className="mr-3">
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
            <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">Name</Text>
            <TextInput
              value={name} onChangeText={setName} placeholder="Dancer's name"
              placeholderTextColor="#52525B" autoCapitalize="words"
              className="bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border mb-4"
            />

            <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">Date of Birth</Text>
            <TextInput
              value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD"
              placeholderTextColor="#52525B"
              className="bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border mb-1"
            />
            {competingAge !== null && (
              <Text className="font-body text-sm text-accent-violet mb-4">
                Competing age: {competingAge} (as of Jan 1, {new Date().getFullYear()})
              </Text>
            )}
            {!competingAge && <View className="mb-4" />}

            <Text className="font-body-medium text-sm text-txt-secondary mb-3">Color</Text>
            <View className="flex-row flex-wrap gap-3 mb-8">
              {DANCER_COLORS.map((c) => (
                <Pressable key={c.hex} onPress={() => setSelectedColor(c.hex)}>
                  <ColorDot color={c.hex} size={40} selected={selectedColor === c.hex} />
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleSave} disabled={!name.trim() || saving}>
              <LinearGradient
                colors={!name.trim() || saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center", marginBottom: 32 }}
              >
                <Text className={`font-body-medium text-base ${!name.trim() || saving ? "text-txt-muted" : "text-txt-primary"}`}>
                  {saving ? "Saving..." : isNew ? "Add Dancer" : "Save Changes"}
                </Text>
              </LinearGradient>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── VIEW MODE ──────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View className="flex-row items-center px-page-mobile pt-4 pb-4">
          <Pressable onPress={() => router.back()} className="mr-3">
            <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
          </Pressable>
          <Text className="font-display text-2xl text-txt-primary flex-1">{dancer?.name || ""}</Text>
          <Pressable onPress={() => setEditing(true)}>
            <Edit3 color="#C084FC" size={20} strokeWidth={1.5} />
          </Pressable>
        </View>

        {/* Saved confirmation */}
        {saved && (
          <View className="mx-page-mobile mb-4 bg-accent-green/10 border border-accent-green/30 rounded-md px-4 py-3">
            <Text className="font-body text-sm text-accent-green text-center">Changes saved!</Text>
          </View>
        )}

        {/* Profile Card */}
        <View className="mx-page-mobile bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-6">
          <View className="flex-row items-center mb-3">
            <ColorDot color={dancer?.assigned_color || "#C084FC"} size={48} />
            <View className="ml-4">
              <Text className="font-body-medium text-xl text-txt-primary">{dancer?.name}</Text>
              {competingAge !== null && (
                <Text className="font-body text-sm text-txt-secondary">
                  Competing age: {competingAge}
                </Text>
              )}
              {dob && (
                <Text className="font-body text-xs text-txt-muted">
                  DOB: {new Date(dob + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Routines */}
        <View className="px-page-mobile">
          <View className="flex-row items-center mb-3">
            <Text className="font-body-medium text-sm text-txt-secondary flex-1">
              ROUTINES ({routines.length})
            </Text>
            <Pressable
              onPress={() => router.push({
                pathname: "/(tabs)/account/dancers/routine/[routineId]",
                params: { routineId: "new", dancerId: dancerId! },
              })}
              className="flex-row items-center"
            >
              <Plus color="#C084FC" size={18} strokeWidth={1.5} />
              <Text className="font-body-medium text-sm text-accent-violet ml-1">Add</Text>
            </Pressable>
          </View>

          {routines.length === 0 ? (
            <View className="bg-bg-card border border-border-subtle rounded-lg p-card-pad items-center">
              <Text className="font-body text-sm text-txt-secondary text-center">
                No routines yet. Tap + Add to start tracking costumes and details.
              </Text>
            </View>
          ) : (
            routines.map((routine) => (
              <Pressable
                key={routine.id}
                onPress={() => router.push({
                  pathname: "/(tabs)/account/dancers/routine/[routineId]",
                  params: { routineId: routine.id, dancerId: dancerId! },
                })}
              >
                <View className="bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-3 flex-row items-center">
                  <View className="flex-1">
                    <Text className="font-body-medium text-base text-txt-primary">{routine.title}</Text>
                    <View className="flex-row flex-wrap gap-1 mt-1">
                      {(routine as any).routine_type && (
                        <Text className="font-body text-xs text-accent-violet">{(routine as any).routine_type}</Text>
                      )}
                      {routine.dance_style && (
                        <Text className="font-body text-xs text-txt-muted">
                          {(routine as any).routine_type ? " · " : ""}{routine.dance_style}
                        </Text>
                      )}
                    </View>
                    {routine.costume_description && (
                      <Text className="font-body text-xs text-txt-muted mt-1" numberOfLines={1}>
                        Costume: {routine.costume_description}
                      </Text>
                    )}
                  </View>
                  <ChevronRight color="#52525B" size={18} strokeWidth={1.5} />
                </View>
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

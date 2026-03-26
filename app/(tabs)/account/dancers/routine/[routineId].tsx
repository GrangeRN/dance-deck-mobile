import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  Switch,
  Platform,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";

const DANCE_STYLES = [
  "Jazz", "Lyrical", "Contemporary", "Ballet", "Tap", "Hip Hop",
  "Musical Theater", "Acro", "Pointe", "Modern", "Clogging", "Open", "Other",
];

const ROUTINE_TYPES = [
  "Solo", "Duo", "Trio", "Small Group", "Large Group", "Line", "Production", "Other",
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="font-body-medium text-sm text-accent-violet mt-6 mb-3">
      {title}
    </Text>
  );
}

function Field({
  label, value, onChangeText, placeholder, multiline, keyboardType,
}: {
  label: string; value: string; onChangeText: (t: string) => void;
  placeholder?: string; multiline?: boolean; keyboardType?: "default" | "numeric";
}) {
  return (
    <View className="mb-4">
      <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">{label}</Text>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor="#52525B" multiline={multiline} keyboardType={keyboardType}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        className={`bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border ${multiline ? "min-h-[80px]" : ""}`}
      />
    </View>
  );
}

function ChipPicker({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
      <View className="flex-row gap-2">
        {options.map((opt) => (
          <Pressable key={opt} onPress={() => onSelect(selected === opt ? "" : opt)}>
            <View style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
              backgroundColor: selected === opt ? "#4C1D95" : "#1A1A1F",
              borderWidth: 1, borderColor: selected === opt ? "#C084FC" : "#27272A",
            }}>
              <Text className={`font-body text-sm ${selected === opt ? "text-accent-violet" : "text-txt-secondary"}`}>
                {opt}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

export default function RoutineFormScreen() {
  const router = useRouter();
  const { routineId, dancerId } = useLocalSearchParams<{ routineId: string; dancerId: string }>();
  const { user } = useAuth();
  const isNew = routineId === "new";

  const [title, setTitle] = useState("");
  const [routineType, setRoutineType] = useState("");
  const [danceStyle, setDanceStyle] = useState("");
  const [averageAge, setAverageAge] = useState("");
  const [costume, setCostume] = useState("");
  const [hair, setHair] = useState("");
  const [makeup, setMakeup] = useState("");
  const [tights, setTights] = useState("");
  const [tightsColor, setTightsColor] = useState("");
  const [shoes, setShoes] = useState("");
  const [shoesColor, setShoesColor] = useState("");
  const [accessories, setAccessories] = useState("");
  const [choreographer, setChoreographer] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [hasProps, setHasProps] = useState(false);
  const [propsDescription, setPropsDescription] = useState("");
  const [setupNeeded, setSetupNeeded] = useState(false);
  const [setupTime, setSetupTime] = useState("");
  const [takedownNeeded, setTakedownNeeded] = useState(false);
  const [takedownTime, setTakedownTime] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !routineId) return;
    (async () => {
      const { data } = await supabase.from("routines").select("*").eq("id", routineId).single();
      if (data) {
        setTitle(data.title || "");
        setRoutineType(data.routine_type || "");
        setDanceStyle(data.dance_style || "");
        setAverageAge(data.age_group || "");
        setCostume(data.costume_description || "");
        setHair(data.hair_instructions || "");
        setMakeup(data.makeup_instructions || "");
        setTights(data.tights_type || "");
        setTightsColor(data.tights_color || "");
        setShoes(data.shoes_type || "");
        setShoesColor(data.shoes_color || "");
        setAccessories(data.accessories || "");
        setChoreographer(data.choreographer_user_id || "");
        setDurationSeconds(data.song_duration_seconds?.toString() || "");
        setHasProps(data.has_props || false);
        setPropsDescription(data.props_description || "");
        setSetupNeeded(data.stage_setup_needed || false);
        setSetupTime(data.stage_setup_seconds?.toString() || "");
        setTakedownNeeded(data.stage_takedown_needed || false);
        setTakedownTime(data.stage_takedown_seconds?.toString() || "");
        setTeacherNotes(data.teacher_notes || "");
      }
    })();
  }, [routineId, isNew]);

  const handleSave = async () => {
    if (!title.trim() || !user || saving) return;

    setSaving(true);
    try {
      const routineData = {
        parent_user_id: user.id,
        contributed_by: user.id,
        source: "parent" as const,
        title: title.trim(),
        routine_type: routineType || null,
        dance_style: danceStyle || null,
        age_group: averageAge || null,
        costume_description: costume || null,
        hair_instructions: hair || null,
        makeup_instructions: makeup || null,
        tights_type: tights || null,
        tights_color: tightsColor || null,
        shoes_type: shoes || null,
        shoes_color: shoesColor || null,
        accessories: accessories || null,
        teacher_notes: teacherNotes || null,
        has_props: hasProps,
        props_description: hasProps ? propsDescription || null : null,
        song_duration_seconds: durationSeconds ? parseInt(durationSeconds) : null,
        stage_setup_needed: setupNeeded,
        stage_setup_seconds: setupNeeded && setupTime ? parseInt(setupTime) : null,
        stage_takedown_needed: takedownNeeded,
        stage_takedown_seconds: takedownNeeded && takedownTime ? parseInt(takedownTime) : null,
      };

      if (isNew) {
        const { data: routine, error } = await supabase
          .from("routines").insert(routineData).select().single();
        if (error) throw error;

        if (dancerId && dancerId !== "new") {
          await supabase.from("routine_dancers").insert({
            routine_id: routine.id,
            dancer_profile_id: dancerId,
          });
        }
      } else {
        const { error } = await supabase
          .from("routines")
          .update({ ...routineData, updated_at: new Date().toISOString() })
          .eq("id", routineId);
        if (error) throw error;
      }

      router.back();
    } catch (err: any) {
      if (Platform.OS === "web") {
        window.alert(err.message || "Error saving routine");
      } else {
        Alert.alert("Error", err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    const doDelete = async () => {
      await supabase.from("routines").update({ deleted_at: new Date().toISOString() }).eq("id", routineId);
      router.back();
    };
    if (Platform.OS === "web") {
      if (window.confirm("Delete this routine?")) doDelete();
    } else {
      Alert.alert("Delete Routine", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
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
            {isNew ? "Add Routine" : "Edit Routine"}
          </Text>
          {!isNew && (
            <Pressable onPress={handleDelete}>
              <Trash2 color="#F87171" size={20} strokeWidth={1.5} />
            </Pressable>
          )}
        </View>

        <View className="px-page-mobile">
          {/* Title */}
          <Field label="Routine Title *" value={title} onChangeText={setTitle} placeholder="e.g., Toxic" />

          {/* Routine Type */}
          <Text className="font-body-medium text-sm text-txt-secondary mb-2">Routine Type</Text>
          <ChipPicker options={ROUTINE_TYPES} selected={routineType} onSelect={setRoutineType} />

          {/* Dance Style */}
          <Text className="font-body-medium text-sm text-txt-secondary mb-2">Dance Style</Text>
          <ChipPicker options={DANCE_STYLES} selected={danceStyle} onSelect={setDanceStyle} />

          {/* Age + Duration */}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Average Age" value={averageAge} onChangeText={setAverageAge} placeholder="e.g., 12" />
            </View>
            <View className="flex-1">
              <Field label="Duration (seconds)" value={durationSeconds} onChangeText={setDurationSeconds} placeholder="e.g., 180" keyboardType="numeric" />
            </View>
          </View>

          {/* Choreographer */}
          <Field label="Choreographer(s)" value={choreographer} onChangeText={setChoreographer} placeholder="e.g., Miss Kim, Mr. David" />

          {/* Costume */}
          <SectionHeader title="COSTUME" />
          <Field label="Costume Description" value={costume} onChangeText={setCostume} placeholder="Describe the full costume" multiline />

          {/* Hair & Makeup */}
          <SectionHeader title="HAIR & MAKEUP" />
          <Field label="Hair" value={hair} onChangeText={setHair} placeholder="e.g., High bun, slicked back, glitter spray" />
          <Field label="Makeup" value={makeup} onChangeText={setMakeup} placeholder="e.g., Stage makeup, red lip, dramatic eyes" />

          {/* Tights & Shoes */}
          <SectionHeader title="TIGHTS & SHOES" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Tights" value={tights} onChangeText={setTights} placeholder="e.g., Convertible" />
            </View>
            <View className="flex-1">
              <Field label="Tights Color" value={tightsColor} onChangeText={setTightsColor} placeholder="e.g., Tan" />
            </View>
          </View>
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Shoes" value={shoes} onChangeText={setShoes} placeholder="e.g., Jazz shoes" />
            </View>
            <View className="flex-1">
              <Field label="Shoe Color" value={shoesColor} onChangeText={setShoesColor} placeholder="e.g., Tan" />
            </View>
          </View>

          {/* Accessories */}
          <SectionHeader title="ACCESSORIES" />
          <Field label="Accessories" value={accessories} onChangeText={setAccessories} placeholder="e.g., Crystal earrings, hair clip, gloves" multiline />

          {/* Props */}
          <SectionHeader title="PROPS" />
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-body text-base text-txt-primary">Has Props</Text>
            <Switch value={hasProps} onValueChange={setHasProps} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
          </View>
          {hasProps && (
            <Field label="Props Description" value={propsDescription} onChangeText={setPropsDescription} placeholder="Describe the props" multiline />
          )}

          {/* Stage Setup/Takedown */}
          <SectionHeader title="STAGE SETUP" />
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-body text-base text-txt-primary">Stage Setup Needed</Text>
            <Switch value={setupNeeded} onValueChange={setSetupNeeded} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
          </View>
          {setupNeeded && (
            <Field label="Setup Time (seconds)" value={setupTime} onChangeText={setSetupTime} placeholder="e.g., 30" keyboardType="numeric" />
          )}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="font-body text-base text-txt-primary">Stage Takedown Needed</Text>
            <Switch value={takedownNeeded} onValueChange={setTakedownNeeded} trackColor={{ false: "#3F3F46", true: "#C084FC" }} thumbColor="#FFF" />
          </View>
          {takedownNeeded && (
            <Field label="Takedown Time (seconds)" value={takedownTime} onChangeText={setTakedownTime} placeholder="e.g., 30" keyboardType="numeric" />
          )}

          {/* Notes */}
          <SectionHeader title="NOTES" />
          <Field label="Teacher / Choreographer Notes" value={teacherNotes} onChangeText={setTeacherNotes} placeholder="Any notes" multiline />

          {/* Save */}
          <Pressable onPress={handleSave} disabled={!title.trim() || saving} className="mt-4 mb-12">
            <LinearGradient
              colors={!title.trim() || saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
            >
              <Text className={`font-body-medium text-base ${!title.trim() || saving ? "text-txt-muted" : "text-txt-primary"}`}>
                {saving ? "Saving..." : isNew ? "Add Routine" : "Save Changes"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

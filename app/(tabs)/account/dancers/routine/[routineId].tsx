import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  Switch,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Trash2 } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients, colors } from "@/lib/theme";

const DANCE_STYLES = [
  "Jazz", "Lyrical", "Contemporary", "Ballet", "Tap", "Hip Hop",
  "Musical Theater", "Acro", "Pointe", "Modern", "Clogging", "Open", "Other",
];

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="font-body-medium text-sm text-accent-violet mt-6 mb-3">
      {title}
    </Text>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View className="mb-4">
      <Text className="font-body-medium text-sm text-txt-secondary mb-1.5">
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#52525B"
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        className={`bg-bg-input text-txt-primary font-body text-base rounded-md px-4 py-3 border border-border ${
          multiline ? "min-h-[80px]" : ""
        }`}
      />
    </View>
  );
}

export default function RoutineFormScreen() {
  const router = useRouter();
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const { user } = useAuth();
  const isNew = routineId === "new";

  // Get dancerId from search params
  const { dancerId } = useLocalSearchParams<{ dancerId: string }>();

  const [title, setTitle] = useState("");
  const [danceStyle, setDanceStyle] = useState("");
  const [division, setDivision] = useState("");
  const [ageGroup, setAgeGroup] = useState("");
  const [costume, setCostume] = useState("");
  const [hair, setHair] = useState("");
  const [makeup, setMakeup] = useState("");
  const [tights, setTights] = useState("");
  const [shoes, setShoes] = useState("");
  const [shoesColor, setShoesColor] = useState("");
  const [accessories, setAccessories] = useState("");
  const [hasProps, setHasProps] = useState(false);
  const [propsDescription, setPropsDescription] = useState("");
  const [teacherNotes, setTeacherNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isNew || !routineId) return;

    (async () => {
      const { data } = await supabase
        .from("routines")
        .select("*")
        .eq("id", routineId)
        .single();

      if (data) {
        setTitle(data.title || "");
        setDanceStyle(data.dance_style || "");
        setDivision(data.division || "");
        setAgeGroup(data.age_group || "");
        setCostume(data.costume_description || "");
        setHair(data.hair_instructions || "");
        setMakeup(data.makeup_instructions || "");
        setTights(data.tights_type || "");
        setShoes(data.shoes_type || "");
        setShoesColor(data.shoes_color || "");
        setAccessories(data.accessories || "");
        setHasProps(data.has_props || false);
        setPropsDescription(data.props_description || "");
        setTeacherNotes(data.teacher_notes || "");
      }
    })();
  }, [routineId, isNew]);

  const handleSave = async () => {
    if (!title.trim() || !user) {
      Alert.alert("Required", "Please enter a routine title.");
      return;
    }

    setSaving(true);
    try {
      const routineData = {
        parent_user_id: user.id,
        contributed_by: user.id,
        source: "parent" as const,
        title: title.trim(),
        dance_style: danceStyle || null,
        division: division || null,
        age_group: ageGroup || null,
        costume_description: costume || null,
        hair_instructions: hair || null,
        makeup_instructions: makeup || null,
        tights_type: tights || null,
        shoes_type: shoes || null,
        shoes_color: shoesColor || null,
        accessories: accessories || null,
        has_props: hasProps,
        props_description: hasProps ? propsDescription || null : null,
        teacher_notes: teacherNotes || null,
      };

      if (isNew) {
        const { data: routine, error } = await supabase
          .from("routines")
          .insert(routineData)
          .select()
          .single();

        if (error) throw error;

        // Link to dancer if dancerId provided
        if (dancerId && dancerId !== "new") {
          await supabase.from("routine_dancers").insert({
            routine_id: routine.id,
            dancer_profile_id: dancerId,
          });
        }

        Alert.alert("Routine Added!", "", [{ text: "OK", onPress: () => router.back() }]);
      } else {
        const { error } = await supabase
          .from("routines")
          .update({ ...routineData, updated_at: new Date().toISOString() })
          .eq("id", routineId);

        if (error) throw error;
        Alert.alert("Saved!", "", [{ text: "OK", onPress: () => router.back() }]);
      }
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Routine", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await supabase
            .from("routines")
            .update({ deleted_at: new Date().toISOString() })
            .eq("id", routineId);
          router.back();
        },
      },
    ]);
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
          {/* Basic Info */}
          <Field label="Routine Title *" value={title} onChangeText={setTitle} placeholder="e.g., Toxic" />

          <Text className="font-body-medium text-sm text-txt-secondary mb-2">Dance Style</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            <View className="flex-row gap-2">
              {DANCE_STYLES.map((style) => (
                <Pressable
                  key={style}
                  onPress={() => setDanceStyle(danceStyle === style ? "" : style)}
                >
                  <View
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 999,
                      backgroundColor: danceStyle === style ? "#4C1D95" : "#1A1A1F",
                      borderWidth: 1,
                      borderColor: danceStyle === style ? "#C084FC" : "#27272A",
                    }}
                  >
                    <Text
                      className={`font-body text-sm ${
                        danceStyle === style ? "text-accent-violet" : "text-txt-secondary"
                      }`}
                    >
                      {style}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Division" value={division} onChangeText={setDivision} placeholder="e.g., Competitive" />
            </View>
            <View className="flex-1">
              <Field label="Age Group" value={ageGroup} onChangeText={setAgeGroup} placeholder="e.g., Teen" />
            </View>
          </View>

          {/* Costume */}
          <SectionHeader title="COSTUME" />
          <Field label="Costume Description" value={costume} onChangeText={setCostume} placeholder="Describe the full costume" multiline />

          {/* Hair & Makeup */}
          <SectionHeader title="HAIR & MAKEUP" />
          <Field label="Hair" value={hair} onChangeText={setHair} placeholder="e.g., High bun, slicked back, glitter spray" />
          <Field label="Makeup" value={makeup} onChangeText={setMakeup} placeholder="e.g., Stage makeup, red lip, dramatic eyes" />

          {/* Tights & Shoes */}
          <SectionHeader title="TIGHTS & SHOES" />
          <Field label="Tights" value={tights} onChangeText={setTights} placeholder="e.g., Tan convertible tights" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Shoes" value={shoes} onChangeText={setShoes} placeholder="e.g., Tan jazz shoes" />
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
            <Switch
              value={hasProps}
              onValueChange={setHasProps}
              trackColor={{ false: "#3F3F46", true: "#C084FC" }}
              thumbColor="#FFFFFF"
            />
          </View>
          {hasProps && (
            <Field label="Props Description" value={propsDescription} onChangeText={setPropsDescription} placeholder="Describe the props and setup" multiline />
          )}

          {/* Teacher Notes */}
          <SectionHeader title="NOTES" />
          <Field label="Teacher / Choreographer Notes" value={teacherNotes} onChangeText={setTeacherNotes} placeholder="Any notes from the teacher or choreographer" multiline />

          {/* Save */}
          <Pressable onPress={handleSave} disabled={saving} className="mt-4 mb-12">
            <LinearGradient
              colors={saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
            >
              <Text className={`font-body-medium text-base ${saving ? "text-txt-muted" : "text-txt-primary"}`}>
                {saving ? "Saving..." : isNew ? "Add Routine" : "Save Changes"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { useState } from "react";
import { View, Text, Pressable, Alert, ScrollView, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Input } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { gradients } from "@/lib/theme";

export default function AddEventScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [venueName, setVenueName] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueState, setVenueState] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !startDate.trim() || !user) {
      Alert.alert("Required", "Please enter a name and start date.");
      return;
    }

    // Basic date validation (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate)) {
      Alert.alert("Invalid Date", "Start date must be YYYY-MM-DD format (e.g., 2026-04-15).");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from("events").insert({
        name: name.trim(),
        created_by: user.id,
        event_type: "competition",
        organization_name: orgName.trim() || null,
        start_date: startDate.trim(),
        end_date: endDate.trim() || startDate.trim(),
        venue_name: venueName.trim() || null,
        venue_city: venueCity.trim() || null,
        venue_state: venueState.trim() || null,
        status: "personal",
      });

      if (error) throw error;
      Alert.alert("Event Added!", "", [{ text: "OK", onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setSaving(false);
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
          <Text className="font-display text-2xl text-txt-primary">Add Event</Text>
        </View>

        <View className="px-page-mobile gap-4">
          <Input label="Competition Name *" placeholder="e.g., Spotlight Houston Regional" value={name} onChangeText={setName} autoCapitalize="words" />
          <Input label="Organization" placeholder="e.g., Spotlight Dance Cup" value={orgName} onChangeText={setOrgName} autoCapitalize="words" />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="Start Date *" placeholder="YYYY-MM-DD" value={startDate} onChangeText={setStartDate} />
            </View>
            <View className="flex-1">
              <Input label="End Date" placeholder="YYYY-MM-DD" value={endDate} onChangeText={setEndDate} />
            </View>
          </View>

          <Input label="Venue Name" placeholder="e.g., George R. Brown Convention Center" value={venueName} onChangeText={setVenueName} autoCapitalize="words" />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Input label="City" placeholder="Houston" value={venueCity} onChangeText={setVenueCity} autoCapitalize="words" />
            </View>
            <View className="flex-[0.4]">
              <Input label="State" placeholder="TX" value={venueState} onChangeText={setVenueState} autoCapitalize="characters" />
            </View>
          </View>

          <Pressable onPress={handleSave} disabled={saving} className="mt-4 mb-8">
            <LinearGradient
              colors={saving ? ["#27272A", "#27272A"] : [...gradients.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ borderRadius: 10, paddingVertical: 14, alignItems: "center" }}
            >
              <Text className={`font-body-medium text-base ${saving ? "text-txt-muted" : "text-txt-primary"}`}>
                {saving ? "Saving..." : "Add Event"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

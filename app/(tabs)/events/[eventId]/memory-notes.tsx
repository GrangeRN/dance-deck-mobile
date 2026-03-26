import { useState, useCallback } from "react";
import { View, Text, TextInput } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function MemoryNotesScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [memoryId, setMemoryId] = useState<string | null>(null);
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!eventId || !user) return;

      (async () => {
        const { data } = await supabase
          .from("season_memories")
          .select("*")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .single();

        if (data) {
          setMemoryId(data.id);
          setContent(data.content);
        }
      })();
    }, [eventId, user])
  );

  const handleChange = (text: string) => {
    setContent(text);

    // Auto-save after 1 second of no typing
    if (saveTimer) clearTimeout(saveTimer);
    const timer = setTimeout(async () => {
      if (!user || !eventId) return;

      if (memoryId) {
        await supabase
          .from("season_memories")
          .update({ content: text, updated_at: new Date().toISOString() })
          .eq("id", memoryId);
      } else if (text.trim()) {
        const { data } = await supabase
          .from("season_memories")
          .insert({
            user_id: user.id,
            event_id: eventId,
            content: text,
          })
          .select()
          .single();

        if (data) setMemoryId(data.id);
      }
    }, 1000);
    setSaveTimer(timer);
  };

  return (
    <View className="flex-1 bg-bg-primary px-page-mobile pt-4">
      <Text className="font-body-medium text-sm text-txt-secondary mb-3">
        MEMORY NOTES
      </Text>
      <Text className="font-body text-xs text-txt-muted mb-4">
        Private journal for this competition. Only you can see this.
      </Text>
      <TextInput
        value={content}
        onChangeText={handleChange}
        placeholder="Write your memories, thoughts, highlights from this competition..."
        placeholderTextColor="#52525B"
        multiline
        textAlignVertical="top"
        style={{ backgroundColor: "#1A1A1F", borderRadius: 12, padding: 16, minHeight: 300 }}
        className="text-txt-primary font-body text-base border border-border-subtle flex-1"
      />
      <Text className="font-body text-xs text-txt-muted mt-2 text-center">
        Auto-saves as you type
      </Text>
    </View>
  );
}

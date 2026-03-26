import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { Plus, Check } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface PackingItem {
  id: string;
  text: string;
  checked: boolean;
}

interface PackingSection {
  id: string;
  title: string;
  items: PackingItem[];
}

const DEFAULT_SECTIONS: PackingSection[] = [
  {
    id: "essentials",
    title: "Essentials",
    items: [
      { id: "e1", text: "Dance bag", checked: false },
      { id: "e2", text: "Water bottle", checked: false },
      { id: "e3", text: "Snacks", checked: false },
      { id: "e4", text: "Bobby pins", checked: false },
      { id: "e5", text: "Hair spray", checked: false },
      { id: "e6", text: "Makeup kit", checked: false },
      { id: "e7", text: "Safety pins", checked: false },
      { id: "e8", text: "Sewing kit", checked: false },
    ],
  },
];

export default function PackingListScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const { user } = useAuth();
  const [sections, setSections] = useState<PackingSection[]>(DEFAULT_SECTIONS);
  const [packingListId, setPackingListId] = useState<string | null>(null);
  const [newItemText, setNewItemText] = useState("");
  const [addingToSection, setAddingToSection] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!eventId || !user) return;

      (async () => {
        // Try to load existing packing list
        const { data } = await supabase
          .from("packing_lists")
          .select("*")
          .eq("event_id", eventId)
          .eq("user_id", user.id)
          .eq("is_template", false)
          .single();

        if (data) {
          setPackingListId(data.id);
          setSections(data.sections as PackingSection[]);
        } else {
          // Auto-create with defaults
          const { data: created } = await supabase
            .from("packing_lists")
            .insert({
              user_id: user.id,
              event_id: eventId,
              name: "Packing List",
              sections: DEFAULT_SECTIONS,
            })
            .select()
            .single();

          if (created) {
            setPackingListId(created.id);
          }
        }
      })();
    }, [eventId, user])
  );

  const save = async (updated: PackingSection[]) => {
    setSections(updated);
    if (packingListId) {
      await supabase
        .from("packing_lists")
        .update({ sections: updated, updated_at: new Date().toISOString() })
        .eq("id", packingListId);
    }
  };

  const toggleItem = (sectionId: string, itemId: string) => {
    const updated = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            items: s.items.map((i) =>
              i.id === itemId ? { ...i, checked: !i.checked } : i
            ),
          }
        : s
    );
    save(updated);
  };

  const addItem = (sectionId: string) => {
    if (!newItemText.trim()) return;

    const updated = sections.map((s) =>
      s.id === sectionId
        ? {
            ...s,
            items: [
              ...s.items,
              {
                id: `custom-${Date.now()}`,
                text: newItemText.trim(),
                checked: false,
              },
            ],
          }
        : s
    );
    save(updated);
    setNewItemText("");
    setAddingToSection(null);
  };

  const checkedCount = sections.reduce(
    (acc, s) => acc + s.items.filter((i) => i.checked).length,
    0
  );
  const totalCount = sections.reduce((acc, s) => acc + s.items.length, 0);

  return (
    <ScrollView className="flex-1 bg-bg-primary" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Progress */}
      <View className="px-page-mobile pt-4 pb-2">
        <Text className="font-body-medium text-sm text-txt-secondary">
          {checkedCount} of {totalCount} packed
        </Text>
        <View className="h-1 bg-bg-input rounded-pill mt-2 overflow-hidden">
          <View
            className="h-1 bg-accent-violet rounded-pill"
            style={{ width: totalCount > 0 ? `${(checkedCount / totalCount) * 100}%` : "0%" }}
          />
        </View>
      </View>

      {sections.map((section) => (
        <View key={section.id} className="px-page-mobile mt-4">
          <View className="flex-row items-center mb-2">
            <Text className="font-body-medium text-sm text-txt-secondary flex-1">
              {section.title.toUpperCase()}
            </Text>
            <Pressable onPress={() => setAddingToSection(addingToSection === section.id ? null : section.id)}>
              <Plus color="#C084FC" size={18} strokeWidth={1.5} />
            </Pressable>
          </View>

          {section.items.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => toggleItem(section.id, item.id)}
              className="flex-row items-center py-3 border-b border-border-subtle"
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  borderWidth: 1.5,
                  borderColor: item.checked ? "#C084FC" : "#3F3F46",
                  backgroundColor: item.checked ? "#4C1D95" : "transparent",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {item.checked && <Check color="#C084FC" size={14} strokeWidth={2} />}
              </View>
              <Text
                className={`font-body text-base flex-1 ${
                  item.checked ? "line-through text-txt-muted" : "text-txt-primary"
                }`}
              >
                {item.text}
              </Text>
            </Pressable>
          ))}

          {addingToSection === section.id && (
            <View className="flex-row items-center mt-2 gap-2">
              <TextInput
                value={newItemText}
                onChangeText={setNewItemText}
                placeholder="New item..."
                placeholderTextColor="#52525B"
                autoFocus
                onSubmitEditing={() => addItem(section.id)}
                className="flex-1 bg-bg-input text-txt-primary font-body text-base rounded-md px-3 py-2 border border-border"
              />
              <Pressable
                onPress={() => addItem(section.id)}
                className="bg-accent-violet/20 rounded-md px-3 py-2"
              >
                <Plus color="#C084FC" size={18} strokeWidth={1.5} />
              </Pressable>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

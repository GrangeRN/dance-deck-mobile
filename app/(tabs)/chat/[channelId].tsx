import { useState, useCallback, useRef, useEffect } from "react";
import { View, Text, Pressable, FlatList, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Send } from "lucide-react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  senderName?: string;
}

export default function ChannelScreen() {
  const router = useRouter();
  const { channelId } = useLocalSearchParams<{ channelId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [channelName, setChannelName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      if (!channelId || !user) return;

      (async () => {
        // Load channel name
        const { data: ch } = await supabase
          .from("chat_channels")
          .select("name")
          .eq("id", channelId)
          .single();
        setChannelName(ch?.name || "Channel");

        // Load messages
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("channel_id", channelId)
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(100);

        if (msgs && msgs.length > 0) {
          // Load sender names
          const senderIds = [...new Set(msgs.map((m) => m.sender_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", senderIds);

          const nameMap: Record<string, string> = {};
          profiles?.forEach((p) => {
            nameMap[p.id] = `${p.first_name} ${p.last_name}`.trim();
          });

          setMessages(msgs.map((m) => ({ ...m, senderName: nameMap[m.sender_id] })));
        }
      })();

      // Subscribe to new messages
      const subscription = supabase
        .channel(`messages:${channelId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "chat_messages", filter: `channel_id=eq.${channelId}` },
          (payload) => {
            const msg = payload.new as Message;
            setMessages((prev) => [...prev, { ...msg, senderName: undefined }]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }, [channelId, user])
  );

  const handleSend = async () => {
    if (!newMessage.trim() || !user || !channelId || sending) return;

    setSending(true);
    const text = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("chat_messages").insert({
      channel_id: channelId,
      sender_id: user.id,
      content: text,
    });

    if (error) setNewMessage(text); // Restore on error
    setSending(false);
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-page-mobile pt-4 pb-3 border-b border-border-subtle">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-body-medium text-lg text-txt-primary">#{channelName}</Text>
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12, flexGrow: 1 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center">
            <Text className="font-body text-base text-txt-muted">No messages yet</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isMe = item.sender_id === user?.id;
          return (
            <View className={`mb-3 ${isMe ? "items-end" : "items-start"}`}>
              {!isMe && item.senderName && (
                <Text className="font-body-medium text-xs text-accent-violet mb-1 ml-1">
                  {item.senderName}
                </Text>
              )}
              <View
                style={{
                  backgroundColor: isMe ? "#4C1D95" : "#1A1A1F",
                  borderRadius: 16,
                  borderTopRightRadius: isMe ? 4 : 16,
                  borderTopLeftRadius: isMe ? 16 : 4,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  maxWidth: "80%",
                }}
              >
                <Text className="font-body text-base text-txt-primary">{item.content}</Text>
                <Text className="font-body text-xs text-txt-muted mt-1">
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View className="flex-row items-center px-page-mobile py-3 border-t border-border-subtle">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Message..."
            placeholderTextColor="#52525B"
            onSubmitEditing={handleSend}
            className="flex-1 bg-bg-input text-txt-primary font-body text-base rounded-pill px-4 py-2.5 border border-border mr-2"
          />
          <Pressable
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: newMessage.trim() ? "#C084FC" : "#27272A",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Send color={newMessage.trim() ? "#0D0D0F" : "#52525B"} size={18} strokeWidth={1.5} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

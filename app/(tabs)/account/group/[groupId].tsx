import { useState, useCallback } from "react";
import { View, Text, Pressable, FlatList, Alert } from "react-native";
import { useRouter, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, Copy, Check, X } from "lucide-react-native";
import * as Clipboard from "expo-clipboard";
import { Badge } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import type { Group, GroupMember, Profile } from "@/types/database";

interface MemberWithProfile extends GroupMember {
  profile?: Profile;
}

export default function GroupDetailScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [copied, setCopied] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!groupId || !user) return;

      (async () => {
        // Load group
        const { data: g } = await supabase
          .from("groups")
          .select("*")
          .eq("id", groupId)
          .single();
        setGroup(g);

        // Load members
        const { data: m } = await supabase
          .from("group_members")
          .select("*")
          .eq("group_id", groupId)
          .order("status", { ascending: true });

        if (m) {
          // Check if current user is admin
          const myMembership = m.find((mem) => mem.user_id === user.id);
          setIsAdmin(myMembership?.role === "owner" || myMembership?.role === "admin");

          // Load profiles for members
          const userIds = m.map((mem) => mem.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("id", userIds);

          const enriched = m.map((mem) => ({
            ...mem,
            profile: profiles?.find((p) => p.id === mem.user_id),
          }));
          setMembers(enriched);
        }
      })();
    }, [groupId, user])
  );

  const copyCode = async () => {
    if (!group) return;
    await Clipboard.setStringAsync(group.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const approveMember = async (memberId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("group_members")
      .update({
        status: "approved",
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", memberId);

    if (error) Alert.alert("Error", error.message);
    else {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: "approved" } : m))
      );
    }
  };

  const denyMember = async (memberId: string) => {
    const { error } = await supabase
      .from("group_members")
      .delete()
      .eq("id", memberId);

    if (error) Alert.alert("Error", error.message);
    else setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const roleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner": return "owner" as const;
      case "admin": return "admin" as const;
      case "teacher": return "teacher" as const;
      default: return "approved" as const;
    }
  };

  const pending = members.filter((m) => m.status === "pending");
  const approved = members.filter((m) => m.status === "approved");

  return (
    <SafeAreaView className="flex-1 bg-bg-primary" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center px-page-mobile pt-4 pb-4">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ArrowLeft color="#F4F4F5" size={24} strokeWidth={1.5} />
        </Pressable>
        <Text className="font-display text-2xl text-txt-primary flex-1" numberOfLines={1}>
          {group?.name || "Group"}
        </Text>
      </View>

      <FlatList
        data={[]}
        renderItem={() => null}
        ListHeaderComponent={
          <View className="px-page-mobile">
            {/* Join Code Card */}
            {group && (
              <Pressable onPress={copyCode}>
                <View className="bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-6 flex-row items-center justify-between">
                  <View>
                    <Text className="font-body-medium text-sm text-txt-secondary">
                      JOIN CODE
                    </Text>
                    <Text className="font-mono text-2xl text-accent-violet tracking-widest mt-1">
                      {group.join_code}
                    </Text>
                  </View>
                  {copied ? (
                    <Check color="#34D399" size={20} strokeWidth={1.5} />
                  ) : (
                    <Copy color="#A1A1AA" size={20} strokeWidth={1.5} />
                  )}
                </View>
              </Pressable>
            )}

            {/* Pending Members */}
            {isAdmin && pending.length > 0 && (
              <>
                <Text className="font-body-medium text-sm text-status-warning mb-3">
                  PENDING APPROVAL ({pending.length})
                </Text>
                {pending.map((m) => (
                  <View
                    key={m.id}
                    className="bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-3 flex-row items-center"
                  >
                    <View className="flex-1">
                      <Text className="font-body-medium text-base text-txt-primary">
                        {m.profile?.first_name} {m.profile?.last_name}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => approveMember(m.id)}
                      className="bg-accent-green/20 rounded-md px-3 py-2 mr-2"
                    >
                      <Check color="#34D399" size={18} strokeWidth={2} />
                    </Pressable>
                    <Pressable
                      onPress={() => denyMember(m.id)}
                      className="bg-status-danger/20 rounded-md px-3 py-2"
                    >
                      <X color="#F87171" size={18} strokeWidth={2} />
                    </Pressable>
                  </View>
                ))}
              </>
            )}

            {/* Approved Members */}
            <Text className="font-body-medium text-sm text-txt-secondary mb-3 mt-2">
              MEMBERS ({approved.length})
            </Text>
            {approved.map((m) => (
              <View
                key={m.id}
                className="bg-bg-card border border-border-subtle rounded-lg p-card-pad mb-3 flex-row items-center"
              >
                <View className="flex-1">
                  <Text className="font-body-medium text-base text-txt-primary">
                    {m.profile?.first_name} {m.profile?.last_name}
                  </Text>
                </View>
                <Badge label={m.role} variant={roleBadgeVariant(m.role)} />
              </View>
            ))}
          </View>
        }
      />
    </SafeAreaView>
  );
}

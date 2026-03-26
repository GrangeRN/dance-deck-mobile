import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Group, GroupMember } from "@/types/database";

interface GroupWithRole extends Group {
  myRole: string;
  myStatus: string;
  memberCount: number;
}

export function useGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // Get user's memberships
    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, role, status")
      .eq("user_id", user.id);

    if (!memberships || memberships.length === 0) {
      setGroups([]);
      setLoading(false);
      return;
    }

    const groupIds = memberships.map((m) => m.group_id);

    // Get group details
    const { data: groupData } = await supabase
      .from("groups")
      .select("*")
      .in("id", groupIds)
      .is("absorbed_into", null);

    if (!groupData) {
      setGroups([]);
      setLoading(false);
      return;
    }

    // Get member counts
    const { data: counts } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds)
      .eq("status", "approved");

    const countMap: Record<string, number> = {};
    counts?.forEach((c) => {
      countMap[c.group_id] = (countMap[c.group_id] || 0) + 1;
    });

    const enriched = groupData.map((g) => {
      const membership = memberships.find((m) => m.group_id === g.id);
      return {
        ...g,
        myRole: membership?.role || "parent",
        myStatus: membership?.status || "pending",
        memberCount: countMap[g.id] || 0,
      };
    });

    setGroups(enriched);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  return { groups, loading, refresh: loadGroups };
}

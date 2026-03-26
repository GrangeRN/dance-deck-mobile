import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Group } from "@/types/database";

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
    if (!user) {
      setGroups([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Get user's memberships
      const { data: memberships, error: memError } = await supabase
        .from("group_members")
        .select("group_id, role, status")
        .eq("user_id", user.id);

      if (memError || !memberships || memberships.length === 0) {
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

      const enriched = groupData.map((g) => {
        const membership = memberships.find((m) => m.group_id === g.id);
        return {
          ...g,
          myRole: membership?.role || "parent",
          myStatus: membership?.status || "pending",
          memberCount: 0,
        };
      });

      setGroups(enriched);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadGroups();
    }, [loadGroups])
  );

  return { groups, loading, refresh: loadGroups };
}

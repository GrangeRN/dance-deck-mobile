// DanceDeck database types — mirrors Supabase schema

export type UserRole = "studio_owner" | "teacher" | "parent" | "dancer";
export type GroupType = "dance_group" | "studio";
export type MemberRole = "owner" | "admin" | "teacher" | "parent" | "dancer";
export type MemberStatus = "pending" | "approved" | "denied";
export type DataSource = "studio_owner" | "teacher" | "parent";
export type EventType = "competition" | "recital" | "convention" | "other";
export type EventStatus = "personal" | "pending_approval" | "approved";
export type EntryType = "routine" | "class" | "workshop" | "break" | "ceremony";

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  profile_photo_url: string | null;
  created_at: string;
}

export interface DancerProfile {
  id: string;
  parent_user_id: string;
  name: string;
  assigned_color: string;
  created_at: string;
}

export interface Routine {
  id: string;
  group_id: string | null;
  parent_user_id: string | null;
  contributed_by: string;
  source: DataSource;
  title: string;
  dance_style: string | null;
  division: string | null;
  age_group: string | null;
  song_duration_seconds: number | null;
  has_props: boolean;
  props_setup_seconds: number | null;
  props_description: string | null;
  costume_description: string | null;
  hair_instructions: string | null;
  makeup_instructions: string | null;
  tights_type: string | null;
  accessories: string | null;
  shoes_type: string | null;
  shoes_color: string | null;
  teacher_notes: string | null;
  choreographer_user_id: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoutineDancer {
  id: string;
  routine_id: string;
  roster_entry_id: string | null;
  dancer_profile_id: string | null;
}

export interface Group {
  id: string;
  name: string;
  group_type: GroupType;
  join_code: string;
  created_by: string;
  absorbed_into: string | null;
  absorbed_at: string | null;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: MemberRole;
  status: MemberStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface Event {
  id: string;
  group_id: string | null;
  created_by: string;
  event_type: EventType;
  name: string;
  organization_name: string | null;
  organization_profile_id: string | null;
  start_date: string;
  end_date: string;
  timezone: string | null;
  venue_name: string | null;
  venue_city: string | null;
  venue_state: string | null;
  status: EventStatus;
  deleted_at: string | null;
  created_at: string;
}

export interface ParentOverlayNote {
  id: string;
  user_id: string;
  routine_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

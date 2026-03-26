-- DanceDeck Row Level Security Policies
-- Hierarchy: solo parent → group member (approved) → group admin → studio owner

-- ============================================================
-- HELPER: Check if user is approved member of a group
-- ============================================================

create or replace function is_group_member(gid uuid)
returns boolean as $$
  select exists(
    select 1 from group_members
    where group_id = gid
      and user_id = auth.uid()
      and status = 'approved'
  );
$$ language sql security definer stable;

create or replace function is_group_admin(gid uuid)
returns boolean as $$
  select exists(
    select 1 from group_members
    where group_id = gid
      and user_id = auth.uid()
      and status = 'approved'
      and role in ('owner', 'admin')
  );
$$ language sql security definer stable;

create or replace function user_group_ids()
returns setof uuid as $$
  select group_id from group_members
  where user_id = auth.uid()
    and status = 'approved';
$$ language sql security definer stable;

-- ============================================================
-- PROFILES
-- ============================================================

alter table profiles enable row level security;

create policy "Users read own profile"
  on profiles for select using (id = auth.uid());

create policy "Users update own profile"
  on profiles for update using (id = auth.uid());

-- Allow reading profiles of fellow group members (for chat, member lists)
create policy "Read group member profiles"
  on profiles for select using (
    id in (
      select gm.user_id from group_members gm
      where gm.group_id in (select user_group_ids())
        and gm.status = 'approved'
    )
  );

-- ============================================================
-- GROUPS
-- ============================================================

alter table groups enable row level security;

-- Anyone can read a group's basic info (name, join code) to join
create policy "Read group basic info"
  on groups for select using (true);

create policy "Create group"
  on groups for insert with check (created_by = auth.uid());

create policy "Update group (admin only)"
  on groups for update using (is_group_admin(id));

-- ============================================================
-- GROUP MEMBERS
-- ============================================================

alter table group_members enable row level security;

-- Members see other members in their groups
create policy "Read group members"
  on group_members for select using (is_group_member(group_id));

-- Anyone can request to join (insert as pending)
create policy "Request to join group"
  on group_members for insert with check (user_id = auth.uid() and status = 'pending');

-- Admins can approve/deny
create policy "Admin manage members"
  on group_members for update using (is_group_admin(group_id));

-- Admins can remove members
create policy "Admin remove members"
  on group_members for delete using (is_group_admin(group_id));

-- Users can leave (delete own membership)
create policy "Leave group"
  on group_members for delete using (user_id = auth.uid());

-- ============================================================
-- DANCER PROFILES (parent-owned, always private to parent)
-- ============================================================

alter table dancer_profiles enable row level security;

create policy "Parent manages own dancers"
  on dancer_profiles for all using (parent_user_id = auth.uid());

-- ============================================================
-- ROSTER ENTRIES (group-owned)
-- ============================================================

alter table roster_entries enable row level security;

create policy "Group members read roster"
  on roster_entries for select using (is_group_member(group_id));

create policy "Admin manage roster"
  on roster_entries for insert with check (is_group_admin(group_id));

create policy "Admin update roster"
  on roster_entries for update using (is_group_admin(group_id));

create policy "Admin delete roster"
  on roster_entries for delete using (is_group_admin(group_id));

-- Parents can link their own profile to a roster entry
create policy "Parent link dancer"
  on roster_entries for update using (
    is_group_member(group_id)
  );

-- ============================================================
-- ROUTINES
-- ============================================================

alter table routines enable row level security;

-- Solo parent routines (no group)
create policy "Parent read own routines"
  on routines for select using (
    parent_user_id = auth.uid() and deleted_at is null
  );

create policy "Parent create solo routine"
  on routines for insert with check (
    parent_user_id = auth.uid() and group_id is null
  );

create policy "Parent update own routine"
  on routines for update using (parent_user_id = auth.uid());

-- Group routines
create policy "Group members read routines"
  on routines for select using (
    group_id in (select user_group_ids()) and deleted_at is null
  );

create policy "Group members create routines"
  on routines for insert with check (
    group_id in (select user_group_ids())
  );

create policy "Admin update group routines"
  on routines for update using (
    group_id is not null and is_group_admin(group_id)
  );

-- ============================================================
-- ROUTINE DANCERS
-- ============================================================

alter table routine_dancers enable row level security;

create policy "Read routine dancers via routine"
  on routine_dancers for select using (
    routine_id in (
      select id from routines
      where (parent_user_id = auth.uid() or group_id in (select user_group_ids()))
        and deleted_at is null
    )
  );

create policy "Manage routine dancers"
  on routine_dancers for all using (
    routine_id in (
      select id from routines
      where parent_user_id = auth.uid()
        or (group_id is not null and is_group_admin(group_id))
    )
  );

-- ============================================================
-- EVENTS
-- ============================================================

alter table events enable row level security;

-- Personal events (no group)
create policy "Read own personal events"
  on events for select using (
    created_by = auth.uid() and group_id is null and deleted_at is null
  );

create policy "Create personal event"
  on events for insert with check (
    created_by = auth.uid()
  );

-- Group events
create policy "Read group events"
  on events for select using (
    group_id in (select user_group_ids()) and deleted_at is null
  );

create policy "Update own events"
  on events for update using (created_by = auth.uid());

create policy "Admin update group events"
  on events for update using (
    group_id is not null and is_group_admin(group_id)
  );

-- ============================================================
-- SCHEDULE ENTRIES
-- ============================================================

alter table schedule_entries enable row level security;

create policy "Read schedule entries via event"
  on schedule_entries for select using (
    event_id in (
      select id from events
      where (created_by = auth.uid() or group_id in (select user_group_ids()))
        and deleted_at is null
    )
    and deleted_at is null
  );

create policy "Create schedule entries"
  on schedule_entries for insert with check (
    event_id in (
      select id from events where created_by = auth.uid()
        or group_id in (select user_group_ids())
    )
  );

create policy "Update schedule entries"
  on schedule_entries for update using (
    event_id in (
      select id from events where created_by = auth.uid()
        or (group_id is not null and is_group_admin(
          (select group_id from events where id = schedule_entries.event_id)
        ))
    )
  );

-- ============================================================
-- MY DAY SELECTIONS (always private to user)
-- ============================================================

alter table my_day_selections enable row level security;

create policy "User manages own my day"
  on my_day_selections for all using (user_id = auth.uid());

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

alter table announcements enable row level security;

create policy "Read group announcements"
  on announcements for select using (
    group_id in (select user_group_ids()) and deleted_at is null
  );

create policy "Admin post announcements"
  on announcements for insert with check (
    is_group_admin(group_id)
  );

create policy "Admin manage announcements"
  on announcements for update using (is_group_admin(group_id));

-- ============================================================
-- AWARD RESULTS
-- ============================================================

alter table award_results enable row level security;

create policy "Read awards for accessible events"
  on award_results for select using (
    event_id in (
      select id from events
      where created_by = auth.uid() or group_id in (select user_group_ids())
    )
  );

create policy "Create award results"
  on award_results for insert with check (created_by = auth.uid());

create policy "Update own award results"
  on award_results for update using (created_by = auth.uid());

-- ============================================================
-- PACKING LISTS (private to user)
-- ============================================================

alter table packing_lists enable row level security;

create policy "User manages own packing lists"
  on packing_lists for all using (user_id = auth.uid());

-- ============================================================
-- SEASON MEMORIES (strictly private)
-- ============================================================

alter table season_memories enable row level security;

create policy "User manages own memories"
  on season_memories for all using (user_id = auth.uid());

-- ============================================================
-- CHAT CHANNELS
-- ============================================================

alter table chat_channels enable row level security;

create policy "Read channels in my groups"
  on chat_channels for select using (
    group_id in (select user_group_ids())
  );

create policy "Create channel in my group"
  on chat_channels for insert with check (
    group_id in (select user_group_ids())
  );

-- ============================================================
-- CHAT CHANNEL MEMBERS
-- ============================================================

alter table chat_channel_members enable row level security;

create policy "Read channel members"
  on chat_channel_members for select using (
    channel_id in (
      select id from chat_channels
      where group_id in (select user_group_ids())
    )
  );

create policy "Manage channel members"
  on chat_channel_members for all using (
    channel_id in (
      select cc.id from chat_channels cc
      where cc.group_id in (select user_group_ids())
    )
  );

-- ============================================================
-- CHAT MESSAGES
-- ============================================================

alter table chat_messages enable row level security;

create policy "Read messages in my channels"
  on chat_messages for select using (
    channel_id in (
      select ccm.channel_id from chat_channel_members ccm
      where ccm.user_id = auth.uid()
    )
    and deleted_at is null
  );

create policy "Send message to my channels"
  on chat_messages for insert with check (
    sender_id = auth.uid()
    and channel_id in (
      select ccm.channel_id from chat_channel_members ccm
      where ccm.user_id = auth.uid()
    )
  );

-- Admin soft delete
create policy "Admin delete messages"
  on chat_messages for update using (
    channel_id in (
      select cc.id from chat_channels cc
      where is_group_admin(cc.group_id)
    )
  );

-- ============================================================
-- COMPETITION PROFILES (public read, admin create custom)
-- ============================================================

alter table competition_profiles enable row level security;

create policy "Read all competition profiles"
  on competition_profiles for select using (true);

create policy "Create custom profile"
  on competition_profiles for insert with check (
    created_by = auth.uid() and is_custom = true
  );

-- ============================================================
-- RECITAL PLANS
-- ============================================================

alter table recital_plans enable row level security;

create policy "Read recital plans"
  on recital_plans for select using (
    group_id in (select user_group_ids())
  );

create policy "Admin manage recital plans"
  on recital_plans for all using (is_group_admin(group_id));

-- ============================================================
-- PARENT OVERLAY NOTES (private to user)
-- ============================================================

alter table parent_overlay_notes enable row level security;

create policy "User manages own overlay notes"
  on parent_overlay_notes for all using (user_id = auth.uid());

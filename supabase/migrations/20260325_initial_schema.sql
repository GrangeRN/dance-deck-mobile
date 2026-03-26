-- DanceDeck Initial Schema
-- Bottom-up adoption model: solo parent → dance group → studio
-- All timestamps are timestamptz (UTC)

-- ============================================================
-- ENUMS
-- ============================================================

create type user_role as enum ('studio_owner', 'teacher', 'parent', 'dancer');
create type group_type as enum ('dance_group', 'studio');
create type member_role as enum ('owner', 'admin', 'teacher', 'parent', 'dancer');
create type member_status as enum ('pending', 'approved', 'denied');
create type data_source as enum ('studio_owner', 'teacher', 'parent');
create type event_type as enum ('competition', 'recital', 'convention', 'other');
create type event_status as enum ('personal', 'pending_approval', 'approved');
create type entry_type as enum ('routine', 'class', 'workshop', 'break', 'ceremony');
create type channel_type as enum ('general', 'team', 'competition', 'custom');
create type recital_status as enum ('draft', 'published');

-- ============================================================
-- USERS / PROFILES
-- ============================================================

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  first_name text not null,
  last_name text not null,
  role user_role not null default 'parent',
  profile_photo_url text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- GROUPS (replaces studios — supports dance_group + studio types)
-- ============================================================

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  group_type group_type not null default 'dance_group',
  join_code text unique not null,
  created_by uuid not null references profiles(id),
  absorbed_into uuid references groups(id),
  absorbed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_groups_join_code on groups(join_code);
create index idx_groups_created_by on groups(created_by);

-- ============================================================
-- GROUP MEMBERS
-- ============================================================

create table group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role member_role not null default 'parent',
  status member_status not null default 'pending',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  unique(group_id, user_id)
);

create index idx_group_members_user on group_members(user_id);
create index idx_group_members_group on group_members(group_id);
create index idx_group_members_status on group_members(status);

-- ============================================================
-- DANCER PROFILES (parent-owned, independent of any group)
-- ============================================================

create table dancer_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  assigned_color text not null default '#C084FC',
  created_at timestamptz not null default now()
);

create index idx_dancer_profiles_parent on dancer_profiles(parent_user_id);

-- ============================================================
-- ROSTER ENTRIES (group/studio-owned dancer records)
-- ============================================================

create table roster_entries (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  dancer_name text not null,
  linked_profile_id uuid references dancer_profiles(id),
  linked_at timestamptz,
  linked_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_roster_entries_group on roster_entries(group_id);
create index idx_roster_entries_linked on roster_entries(linked_profile_id);

-- ============================================================
-- ROUTINES
-- ============================================================

create table routines (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  parent_user_id uuid references profiles(id),
  contributed_by uuid not null references profiles(id),
  source data_source not null default 'parent',
  title text not null,
  dance_style text,
  division text,
  age_group text,
  song_duration_seconds integer,
  has_props boolean not null default false,
  props_setup_seconds integer,
  props_description text,
  costume_description text,
  hair_instructions text,
  makeup_instructions text,
  tights_type text,
  accessories text,
  shoes_type text,
  shoes_color text,
  teacher_notes text,
  choreographer_user_id uuid references profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_routines_group on routines(group_id);
create index idx_routines_parent on routines(parent_user_id);

-- ============================================================
-- ROUTINE DANCERS (junction table)
-- ============================================================

create table routine_dancers (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references routines(id) on delete cascade,
  roster_entry_id uuid references roster_entries(id) on delete cascade,
  dancer_profile_id uuid references dancer_profiles(id) on delete cascade
);

create index idx_routine_dancers_routine on routine_dancers(routine_id);

-- ============================================================
-- COMPETITION PROFILES (org templates)
-- ============================================================

create table competition_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_name text not null,
  adjudication_tiers jsonb not null default '{}',
  division_tier_overrides jsonb,
  is_custom boolean not null default false,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- EVENTS
-- ============================================================

create table events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups(id) on delete cascade,
  created_by uuid not null references profiles(id),
  event_type event_type not null default 'competition',
  name text not null,
  organization_name text,
  organization_profile_id uuid references competition_profiles(id),
  start_date date not null,
  end_date date not null,
  timezone text,
  venue_name text,
  venue_city text,
  venue_state text,
  parking_notes text,
  food_drink_info text,
  preferred_hotels text,
  website_url text,
  media_package_info text,
  media_included boolean,
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_meeting_point text,
  specialty_events_available jsonb,
  status event_status not null default 'personal',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_events_group on events(group_id);
create index idx_events_created_by on events(created_by);
create index idx_events_dates on events(start_date, end_date);

-- ============================================================
-- SCHEDULE ENTRIES
-- ============================================================

create table schedule_entries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  entry_type entry_type not null default 'routine',
  day_date date not null,
  stage_room text,
  heat_number integer,
  time_exact time,
  time_estimated time,
  time_is_estimated boolean not null default false,
  routine_title text not null,
  studio_name text,
  dance_style text,
  division text,
  age_group text,
  dancer_names text[],
  choreographer_name text,
  linked_routine_id uuid references routines(id),
  is_title_contestant boolean not null default false,
  is_section_header boolean not null default false,
  edited_by uuid references profiles(id),
  edited_at timestamptz,
  edit_history jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_schedule_entries_event on schedule_entries(event_id);
create index idx_schedule_entries_day on schedule_entries(day_date);

-- ============================================================
-- MY DAY SELECTIONS
-- ============================================================

create table my_day_selections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  schedule_entry_id uuid not null references schedule_entries(id) on delete cascade,
  is_starred boolean not null default false,
  created_at timestamptz not null default now(),
  unique(user_id, schedule_entry_id)
);

create index idx_my_day_user_event on my_day_selections(user_id, event_id);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

create table announcements (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  posted_by uuid not null references profiles(id),
  content text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_announcements_group on announcements(group_id);

-- ============================================================
-- AWARD RESULTS
-- ============================================================

create table award_results (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  schedule_entry_id uuid not null references schedule_entries(id) on delete cascade,
  adjudication_tier text,
  category_placement integer,
  overall_placement integer,
  specialty_awards jsonb,
  title_placement text,
  comment text,
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_award_results_event on award_results(event_id);

-- ============================================================
-- PACKING LISTS
-- ============================================================

create table packing_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_id uuid references events(id) on delete cascade,
  is_template boolean not null default false,
  name text not null,
  sections jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_packing_lists_user on packing_lists(user_id);

-- ============================================================
-- SEASON MEMORIES (private journal per competition)
-- ============================================================

create table season_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_season_memories_user on season_memories(user_id);

-- ============================================================
-- CHAT CHANNELS
-- ============================================================

create table chat_channels (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  name text not null,
  channel_type channel_type not null default 'general',
  event_id uuid references events(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create index idx_chat_channels_group on chat_channels(group_id);

-- ============================================================
-- CHAT CHANNEL MEMBERS
-- ============================================================

create table chat_channel_members (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references chat_channels(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(channel_id, user_id)
);

-- ============================================================
-- CHAT MESSAGES
-- ============================================================

create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references chat_channels(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  content text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_chat_messages_channel on chat_messages(channel_id);
create index idx_chat_messages_created on chat_messages(created_at);

-- ============================================================
-- RECITAL PLANS
-- ============================================================

create table recital_plans (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  group_id uuid not null references groups(id) on delete cascade,
  show_start_time time not null,
  default_buffer_seconds integer not null default 180,
  intermission_after_entry integer,
  intermission_duration_minutes integer,
  generated_order jsonb not null default '[]',
  status recital_status not null default 'draft',
  created_by uuid not null references profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- PARENT OVERLAY NOTES (personal notes on top of studio data)
-- ============================================================

create table parent_overlay_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  routine_id uuid not null references routines(id) on delete cascade,
  notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, routine_id)
);

-- ============================================================
-- FUNCTION: Auto-create profile on signup
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, first_name, last_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'parent')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FUNCTION: Generate 6-char join code
-- ============================================================

create or replace function generate_join_code()
returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text := '';
  i integer;
begin
  for i in 1..6 loop
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return code;
end;
$$ language plpgsql;

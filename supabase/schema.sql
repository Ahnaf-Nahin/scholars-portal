-- ============================================================================
-- SCHOLAR'S SCHOOL & COLLEGE (SSC)
-- COMPLETE SUPABASE SQL MIGRATION: TABLES, FOREIGN KEYS, RLS, REALTIME & CACHE
-- ============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard -> SQL Editor -> New query
-- 2. Paste this entire SQL script and click "Run"
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TEACHER SECTIONS DIRECTORY TABLE (Official Teachers & Subject Sequence)
-- ----------------------------------------------------------------------------
-- Sequence:
-- 1. Physics   — Saif Chowdhury            (18887) -> Class 9 — BS2
-- 2. Biology   — MD. MAHFUJUL HAQUE        (15539) -> Class 10 — BS2
-- 3. Chemistry — MD. RAISUL ISLAM          (18886) -> Class 9 — BS1
-- 4. Bangla    — MD. RONY KHAN             (10908) -> Class 7 — BS1
-- 5. English   — ANONNO IBNE RAZZAK        (16678) -> Class 8 — BS1
-- 6. ICT       — MUHAMMAD MOKHLESUR RAHMAN (17724) -> Class 6 — BS2
-- 7. BGS       — MD. AMIR HOSSAIN          (19940) -> Class 8 — BS2
-- 8. Religion  — FAYSAL AHMED              (12215) -> Class 6 — BS1
create table if not exists public.teacher_sections (
  subject_code text primary key,
  teacher_name text not null,
  email text unique not null,
  subject text not null,
  department text not null,
  class_name text not null,
  section text not null,
  section_label text not null,
  sequence_order int not null default 1,
  created_at timestamptz not null default now()
);

alter table public.teacher_sections add column if not exists sequence_order int not null default 1;

insert into public.teacher_sections (
  subject_code, teacher_name, email, subject, department, class_name, section, section_label, sequence_order
) values
  ('18887', 'Saif Chowdhury', 'teacher_18887@ssc.edu', 'Physics', 'Department of Physical Sciences', 'Class 9', 'BS2', 'Class 9 — BS2', 1),
  ('15539', 'MD. MAHFUJUL HAQUE', 'teacher_15539@ssc.edu', 'Biology', 'Department of Biological Sciences', 'Class 10', 'BS2', 'Class 10 — BS2', 2),
  ('18886', 'MD. RAISUL ISLAM', 'teacher_18886@ssc.edu', 'Chemistry', 'Department of Physical Sciences', 'Class 9', 'BS1', 'Class 9 — BS1', 3),
  ('10908', 'MD. RONY KHAN', 'teacher_10908@ssc.edu', 'Bangla', 'Department of Languages & Humanities', 'Class 7', 'BS1', 'Class 7 — BS1', 4),
  ('16678', 'ANONNO IBNE RAZZAK', 'teacher_16678@ssc.edu', 'English', 'Department of Languages & Humanities', 'Class 8', 'BS1', 'Class 8 — BS1', 5),
  ('17724', 'MUHAMMAD MOKHLESUR RAHMAN', 'teacher_17724@ssc.edu', 'ICT', 'Department of Computer & Information Technology', 'Class 6', 'BS2', 'Class 6 — BS2', 6),
  ('19940', 'MD. AMIR HOSSAIN', 'teacher_19940@ssc.edu', 'BGS', 'Department of Social Sciences', 'Class 8', 'BS2', 'Class 8 — BS2', 7),
  ('12215', 'FAYSAL AHMED', 'teacher_12215@ssc.edu', 'Religion', 'Department of Humanities & Ethics', 'Class 6', 'BS1', 'Class 6 — BS1', 8)
on conflict (subject_code) do update set
  teacher_name = excluded.teacher_name,
  email = excluded.email,
  subject = excluded.subject,
  department = excluded.department,
  class_name = excluded.class_name,
  section = excluded.section,
  section_label = excluded.section_label,
  sequence_order = excluded.sequence_order;

-- ----------------------------------------------------------------------------
-- 2. PROFILES TABLE (Linked to auth.users)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text not null,
  role text not null default 'student',
  class_name text,
  section text,
  student_id text,
  subject_code text,
  status text not null default 'pending',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists role text default 'student';
alter table public.profiles add column if not exists class_name text;
alter table public.profiles add column if not exists section text;
alter table public.profiles add column if not exists student_id text;
alter table public.profiles add column if not exists subject_code text;
alter table public.profiles add column if not exists status text default 'pending';
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student', 'teacher', 'class_teacher', 'admin'));

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists idx_profiles_email on public.profiles(lower(email));
create index if not exists idx_profiles_role_status on public.profiles(role, status);
create index if not exists idx_profiles_class_section on public.profiles(class_name, section);
create index if not exists idx_profiles_subject_code on public.profiles(subject_code);

-- ----------------------------------------------------------------------------
-- 3. VERIFICATION REQUESTS TABLE (Single Authoritative Verification Table)
-- ----------------------------------------------------------------------------
create table if not exists public.verification_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  student_code text not null default 'SSC-2026-0901',
  student_name text not null,
  student_email text not null,
  class_name text not null,
  section text not null,
  class_teacher_code text not null default '18887',
  status text not null default 'pending',
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id)
);

alter table public.verification_requests add column if not exists student_code text default 'SSC-2026-0901';
alter table public.verification_requests add column if not exists student_name text;
alter table public.verification_requests add column if not exists student_email text;
alter table public.verification_requests add column if not exists class_name text;
alter table public.verification_requests add column if not exists section text;
alter table public.verification_requests add column if not exists class_teacher_code text default '18887';
alter table public.verification_requests add column if not exists status text default 'pending';
alter table public.verification_requests add column if not exists reviewed_by uuid references public.profiles(id) on delete set null;
alter table public.verification_requests add column if not exists reviewed_at timestamptz;
alter table public.verification_requests add column if not exists created_at timestamptz default now();
alter table public.verification_requests add column if not exists updated_at timestamptz default now();

alter table public.verification_requests drop constraint if exists verification_requests_status_check;
alter table public.verification_requests add constraint verification_requests_status_check
  check (status in ('pending', 'approved', 'rejected'));

create unique index if not exists idx_verification_requests_student_id_unique
  on public.verification_requests(student_id);
create index if not exists idx_verification_requests_class_section_status
  on public.verification_requests(class_name, section, status);
create index if not exists idx_verification_requests_teacher_code
  on public.verification_requests(class_teacher_code, status);

-- ----------------------------------------------------------------------------
-- 4. NOTIFICATIONS TABLE
-- ----------------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  target_role text not null default 'both' check (target_role in ('student', 'teacher', 'both')),
  class_name text,
  section text,
  student_user_id text,
  title text not null,
  message text not null,
  category text not null default 'class',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications add column if not exists recipient_id uuid references public.profiles(id) on delete cascade;
alter table public.notifications add column if not exists target_role text default 'both';
alter table public.notifications add column if not exists class_name text;
alter table public.notifications add column if not exists section text;
alter table public.notifications add column if not exists student_user_id text;
alter table public.notifications add column if not exists title text;
alter table public.notifications add column if not exists message text;
alter table public.notifications add column if not exists category text default 'class';
alter table public.notifications add column if not exists read boolean default false;
alter table public.notifications add column if not exists created_at timestamptz default now();

create index if not exists idx_notifications_target_role_created
  on public.notifications(target_role, created_at desc);
create index if not exists idx_notifications_class_section
  on public.notifications(class_name, section);
create index if not exists idx_notifications_student_user_id
  on public.notifications(student_user_id);

-- ----------------------------------------------------------------------------
-- 5. SECURITY DEFINER HELPER FUNCTIONS (PREVENT RLS INFINITE RECURSION)
-- ----------------------------------------------------------------------------

-- Helper to resolve the assigned Class Teacher subject_code for any class_name + section
create or replace function public.resolve_class_teacher_code(
  p_class_name text,
  p_section text
)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code text;
  v_clean_class text := lower(trim(coalesce(p_class_name, 'Class 9')));
  v_clean_sec text := upper(trim(coalesce(p_section, 'BS2')));
begin
  select ts.subject_code
    into v_code
    from public.teacher_sections ts
   where lower(trim(ts.class_name)) = v_clean_class
     and upper(trim(ts.section)) = v_clean_sec
   limit 1;

  if v_code is null then
    select ts.subject_code
      into v_code
      from public.teacher_sections ts
     where lower(trim(ts.class_name)) = v_clean_class
     limit 1;
  end if;

  return coalesce(v_code, '18887');
end;
$$;

-- Check if a UUID corresponds to a real user in auth.users
create or replace function public.is_valid_auth_user(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from auth.users where id = target_user_id
  );
$$;

-- Non-recursive check whether the currently signed-in user is an authenticated teacher
create or replace function public.is_authenticated_teacher()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_meta_role text;
  v_prof_role text;
begin
  if auth.uid() is null then
    return false;
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  if v_email like 'teacher_%@ssc.edu' then
    return true;
  end if;

  v_meta_role := lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', ''));
  if v_meta_role in ('teacher', 'class_teacher', 'admin') then
    return true;
  end if;

  select lower(p.role)
    into v_prof_role
    from public.profiles p
   where p.id = auth.uid()
   limit 1;

  return coalesce(v_prof_role, '') in ('teacher', 'class_teacher', 'admin');
end;
$$;

-- Check whether the currently signed-in teacher is the authorized Class Teacher
-- for the given class_name / section / class_teacher_code
create or replace function public.is_authorized_class_teacher_for(
  target_class text,
  target_section text,
  target_teacher_code text default null
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_email text;
  v_prof_role text;
  v_prof_class text;
  v_prof_sec text;
  v_prof_code text;
  v_ts_class text;
  v_ts_sec text;
  v_ts_code text;
  v_meta_class text;
  v_meta_sec text;
  v_meta_code text;
  v_effective_class text;
  v_effective_sec text;
  v_effective_code text;
begin
  if not public.is_authenticated_teacher() then
    return false;
  end if;

  v_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_meta_class := trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'class_name', ''));
  v_meta_sec := upper(trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'section', '')));
  v_meta_code := trim(coalesce(auth.jwt() -> 'user_metadata' ->> 'subject_code', ''));

  select lower(p.role), trim(p.class_name), upper(trim(p.section)), trim(p.subject_code)
    into v_prof_role, v_prof_class, v_prof_sec, v_prof_code
    from public.profiles p
   where p.id = auth.uid()
   limit 1;

  if coalesce(v_prof_role, '') = 'admin' then
    return true;
  end if;

  if v_email <> '' then
    select trim(ts.class_name), upper(trim(ts.section)), trim(ts.subject_code)
      into v_ts_class, v_ts_sec, v_ts_code
      from public.teacher_sections ts
     where lower(ts.email) = v_email
     limit 1;
  end if;

  v_effective_code := coalesce(nullif(v_ts_code, ''), nullif(v_prof_code, ''), nullif(v_meta_code, ''), '');
  v_effective_class := coalesce(nullif(v_ts_class, ''), nullif(v_prof_class, ''), nullif(v_meta_class, ''), '');
  v_effective_sec := coalesce(nullif(v_ts_sec, ''), nullif(v_prof_sec, ''), nullif(v_meta_sec, ''), '');

  -- If teacher profile/metadata has not yet been bound to a specific section, allow access
  if v_effective_class = '' and v_effective_code = '' then
    return true;
  end if;

  -- Match by explicit class_teacher_code
  if nullif(trim(coalesce(target_teacher_code, '')), '') is not null
     and v_effective_code <> ''
     and trim(target_teacher_code) = v_effective_code then
    return true;
  end if;

  -- Match by assigned class_name + section
  if lower(trim(coalesce(target_class, ''))) = lower(v_effective_class)
     and upper(trim(coalesce(target_section, ''))) = upper(v_effective_sec) then
    return true;
  end if;

  -- Match single-teacher classes (Class 7 and Class 10)
  if lower(trim(coalesce(target_class, ''))) in ('class 7', 'class 10')
     and lower(trim(coalesce(target_class, ''))) = lower(v_effective_class) then
    return true;
  end if;

  return false;
end;
$$;

-- ----------------------------------------------------------------------------
-- 6. BACKFILL EXISTING AUTH USERS & STUDENT PROFILES INTO VERIFICATION_REQUESTS
-- ----------------------------------------------------------------------------
-- Step 6A: Ensure every user in auth.users has a corresponding row in public.profiles
insert into public.profiles (
  id, email, full_name, role, class_name, section, student_id, subject_code, status, created_at
)
select
  u.id,
  lower(u.email),
  coalesce(nullif(trim(u.raw_user_meta_data->>'full_name'), ''), split_part(u.email, '@', 1)),
  case
    when lower(u.email) like 'teacher_%@ssc.edu' then 'teacher'
    when coalesce(u.raw_user_meta_data->>'role', '') in ('student', 'teacher', 'class_teacher', 'admin')
      then u.raw_user_meta_data->>'role'
    else 'student'
  end as resolved_role,
  coalesce(nullif(trim(u.raw_user_meta_data->>'class_name'), ''), 'Class 9'),
  upper(coalesce(nullif(trim(u.raw_user_meta_data->>'section'), ''), 'BS2')),
  case
    when lower(u.email) like 'teacher_%@ssc.edu' then null
    else coalesce(nullif(trim(u.raw_user_meta_data->>'student_id'), ''), 'SSC-2026-0901')
  end,
  nullif(trim(coalesce(u.raw_user_meta_data->>'subject_code', '')), ''),
  case
    when lower(u.email) like 'teacher_%@ssc.edu' then 'approved'
    when coalesce(u.raw_user_meta_data->>'role', '') in ('teacher', 'class_teacher', 'admin') then 'approved'
    else 'pending'
  end,
  coalesce(u.created_at, now())
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- Step 6B: Ensure every student in public.profiles has a row in public.verification_requests
insert into public.verification_requests (
  student_id,
  student_code,
  student_name,
  student_email,
  class_name,
  section,
  class_teacher_code,
  status,
  created_at,
  updated_at
)
select
  p.id,
  coalesce(nullif(trim(p.student_id), ''), 'SSC-2026-0901'),
  coalesce(nullif(trim(p.full_name), ''), split_part(p.email, '@', 1)),
  lower(p.email),
  coalesce(nullif(trim(p.class_name), ''), 'Class 9'),
  upper(coalesce(nullif(trim(p.section), ''), 'BS2')),
  public.resolve_class_teacher_code(p.class_name, p.section),
  coalesce(p.status, 'pending'),
  coalesce(p.created_at, now()),
  now()
from public.profiles p
where p.role = 'student'
on conflict (student_id) do update set
  class_name = excluded.class_name,
  section = excluded.section,
  class_teacher_code = excluded.class_teacher_code,
  updated_at = now();

-- ----------------------------------------------------------------------------
-- 7. AUTH TRIGGERS & RPC FUNCTIONS
-- ----------------------------------------------------------------------------

-- Auto-confirm email in auth.users so Class Teacher approval (profiles.status)
-- is the sole gatekeeper for student access
create or replace function public.auto_confirm_auth_users()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.email_confirmed_at := coalesce(new.email_confirmed_at, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_auto_confirm on auth.users;
create trigger on_auth_user_auto_confirm
  before insert on auth.users
  for each row execute function public.auto_confirm_auth_users();

-- Confirm any previously unconfirmed users in auth.users so they can sign in and persist sessions
update auth.users
   set email_confirmed_at = coalesce(email_confirmed_at, now())
 where email_confirmed_at is null;

-- Automatically create profile + verification request on auth.users sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text;
  v_full_name text;
  v_class_name text;
  v_section text;
  v_student_code text;
  v_subject_code text;
  v_status text;
  v_teacher_code text;
begin
  v_role := coalesce(nullif(trim(new.raw_user_meta_data->>'role'), ''), 'student');
  if v_role not in ('student', 'teacher', 'class_teacher', 'admin') then
    v_role := 'student';
  end if;

  if lower(coalesce(new.email, '')) like 'teacher_%@ssc.edu' and v_role = 'student' then
    v_role := 'teacher';
  end if;

  v_full_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1));
  v_class_name := trim(coalesce(nullif(trim(new.raw_user_meta_data->>'class_name'), ''), 'Class 9'));
  v_section := upper(trim(coalesce(nullif(trim(new.raw_user_meta_data->>'section'), ''), 'BS2')));
  v_student_code := coalesce(
    nullif(trim(new.raw_user_meta_data->>'student_id'), ''),
    'SSC-2026-' || lpad((floor(random() * 900 + 100))::int::text, 4, '0')
  );
  v_subject_code := nullif(trim(coalesce(new.raw_user_meta_data->>'subject_code', '')), '');

  if v_role in ('teacher', 'class_teacher', 'admin') then
    v_status := 'approved';
  else
    v_status := 'pending';
  end if;

  -- Step A: Insert or update public.profiles
  begin
    insert into public.profiles (
      id, email, full_name, role, class_name, section, student_id, subject_code, status
    ) values (
      new.id,
      lower(new.email),
      v_full_name,
      v_role,
      v_class_name,
      v_section,
      case when v_role = 'student' then v_student_code else null end,
      v_subject_code,
      v_status
    )
    on conflict (id) do update set
      email = excluded.email,
      full_name = excluded.full_name,
      role = excluded.role,
      class_name = excluded.class_name,
      section = excluded.section,
      subject_code = coalesce(excluded.subject_code, public.profiles.subject_code);
  exception when others then
    null;
  end;

  -- Step B: Insert or update public.verification_requests for students
  if v_role = 'student' then
    v_teacher_code := coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data->>'class_teacher_code', '')), ''),
      public.resolve_class_teacher_code(v_class_name, v_section)
    );

    begin
      insert into public.verification_requests (
        student_id,
        student_code,
        student_name,
        student_email,
        class_name,
        section,
        class_teacher_code,
        status
      ) values (
        new.id,
        v_student_code,
        v_full_name,
        lower(new.email),
        v_class_name,
        v_section,
        v_teacher_code,
        'pending'
      )
      on conflict (student_id) do update set
        student_name = excluded.student_name,
        student_email = excluded.student_email,
        class_name = excluded.class_name,
        section = excluded.section,
        class_teacher_code = excluded.class_teacher_code,
        updated_at = now();
    exception when others then
      null;
    end;

    -- Step C: Insert teacher notification
    begin
      insert into public.notifications (
        target_role,
        class_name,
        section,
        student_user_id,
        title,
        message,
        category
      ) values (
        'teacher',
        v_class_name,
        v_section,
        new.id::text,
        'Student Sign-Up Approval Required (' || v_class_name || ' — ' || v_section || ')',
        v_full_name || ' (' || lower(new.email) || ') signed up for ' || v_class_name || ' — ' || v_section || ' and is waiting for Class Teacher verification.',
        'class'
      );
    exception when others then
      null;
    end;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RPC: Ensure student profile and verification request are stored
create or replace function public.ensure_student_registration(
  p_student_id uuid,
  p_email text,
  p_full_name text,
  p_class_name text,
  p_section text,
  p_student_code text,
  p_teacher_code text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exists boolean;
  v_req_id uuid;
  v_resolved_code text;
begin
  select exists(
    select 1 from auth.users
     where id = p_student_id
       and lower(email) = lower(trim(p_email))
  ) into v_exists;

  if not v_exists then
    return jsonb_build_object('ok', false, 'error', 'Auth user not found in auth.users.');
  end if;

  v_resolved_code := coalesce(
    nullif(trim(p_teacher_code), ''),
    public.resolve_class_teacher_code(p_class_name, p_section)
  );

  insert into public.profiles (
    id, email, full_name, role, class_name, section, student_id, status
  ) values (
    p_student_id,
    lower(trim(p_email)),
    trim(p_full_name),
    'student',
    trim(p_class_name),
    upper(trim(p_section)),
    trim(p_student_code),
    'pending'
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    class_name = excluded.class_name,
    section = excluded.section,
    student_id = coalesce(public.profiles.student_id, excluded.student_id);

  insert into public.verification_requests (
    student_id,
    student_code,
    student_name,
    student_email,
    class_name,
    section,
    class_teacher_code,
    status
  ) values (
    p_student_id,
    trim(p_student_code),
    trim(p_full_name),
    lower(trim(p_email)),
    trim(p_class_name),
    upper(trim(p_section)),
    v_resolved_code,
    'pending'
  )
  on conflict (student_id) do update set
    student_name = excluded.student_name,
    student_email = excluded.student_email,
    class_name = excluded.class_name,
    section = excluded.section,
    class_teacher_code = excluded.class_teacher_code,
    updated_at = now()
  returning id into v_req_id;

  return jsonb_build_object('ok', true, 'verification_request_id', v_req_id);
end;
$$;

-- RPC: Public section pending counts (returns only section label + count)
create or replace function public.get_pending_section_counts()
returns table(section_key text, pending_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select lower(class_name || ' — ' || section) as section_key,
         count(*)::bigint as pending_count
    from public.verification_requests
   where status = 'pending'
   group by lower(class_name || ' — ' || section);
$$;

-- RPC: Check student verification status by email
create or replace function public.check_student_status_by_email(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_prof public.profiles%rowtype;
  v_req public.verification_requests%rowtype;
  v_effective_status text;
begin
  select * into v_prof
    from public.profiles
   where lower(email) = lower(trim(p_email))
     and role = 'student'
   limit 1;

  select * into v_req
    from public.verification_requests
   where lower(student_email) = lower(trim(p_email))
   limit 1;

  if v_prof.id is null and v_req.id is null then
    return jsonb_build_object('found', false);
  end if;

  v_effective_status := coalesce(
    case when v_req.status in ('approved', 'rejected') then v_req.status else null end,
    case when v_prof.status in ('approved', 'rejected') then v_prof.status else null end,
    v_req.status,
    v_prof.status,
    'pending'
  );

  return jsonb_build_object(
    'found', true,
    'id', coalesce(v_prof.id, v_req.student_id),
    'email', coalesce(v_prof.email, v_req.student_email),
    'full_name', coalesce(v_prof.full_name, v_req.student_name),
    'class_name', coalesce(v_req.class_name, v_prof.class_name),
    'section', coalesce(v_req.section, v_prof.section),
    'student_id', coalesce(v_prof.student_id, v_req.student_code),
    'status', v_effective_status,
    'created_at', coalesce(v_req.created_at, v_prof.created_at)
  );
end;
$$;

-- RPC: Class Teacher Approves or Rejects a Student
create or replace function public.review_student_verification(
  p_student_id uuid,
  p_new_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student public.profiles%rowtype;
  v_req public.verification_requests%rowtype;
  v_target_class text;
  v_target_section text;
  v_target_code text;
begin
  if p_new_status not in ('approved', 'rejected') then
    raise exception 'Invalid status. Must be approved or rejected.';
  end if;

  select * into v_student
    from public.profiles
   where id = p_student_id;

  select * into v_req
    from public.verification_requests
   where student_id = p_student_id;

  if v_student.id is null and v_req.student_id is null then
    raise exception 'Student verification record not found.';
  end if;

  v_target_class := coalesce(v_req.class_name, v_student.class_name, 'Class 9');
  v_target_section := coalesce(v_req.section, v_student.section, 'BS2');
  v_target_code := coalesce(v_req.class_teacher_code, public.resolve_class_teacher_code(v_target_class, v_target_section));

  if not public.is_authorized_class_teacher_for(v_target_class, v_target_section, v_target_code) then
    raise exception 'Permission Denied: Only the authorized Class Teacher for % — % can review this student registration.', v_target_class, v_target_section;
  end if;

  update public.profiles
     set status = p_new_status,
         updated_at = now()
   where id = p_student_id;

  update public.verification_requests
     set status = p_new_status,
         reviewed_by = auth.uid(),
         reviewed_at = now(),
         updated_at = now()
   where student_id = p_student_id;

  update public.notifications
     set read = true
   where student_user_id = p_student_id::text
     and target_role = 'teacher';

  insert into public.notifications (
    recipient_id,
    target_role,
    class_name,
    section,
    student_user_id,
    title,
    message,
    category
  ) values (
    p_student_id,
    'student',
    v_target_class,
    v_target_section,
    p_student_id::text,
    case when p_new_status = 'approved'
      then 'Account Approved by Class Teacher'
      else 'Registration Rejected by Class Teacher'
    end,
    case when p_new_status = 'approved'
      then 'Welcome ' || coalesce(v_student.full_name, v_req.student_name, 'Student') || '! Your registration for ' || v_target_class || ' — ' || v_target_section || ' has been approved.'
      else 'Your registration for ' || v_target_class || ' — ' || v_target_section || ' was rejected by the Class Teacher.'
    end,
    'class'
  );

  return jsonb_build_object(
    'ok', true,
    'student_id', p_student_id,
    'status', p_new_status
  );
end;
$$;

-- ----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS) POLICIES (NON-RECURSIVE & STRICT)
-- ----------------------------------------------------------------------------
alter table public.teacher_sections enable row level security;
alter table public.profiles enable row level security;
alter table public.verification_requests enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "teacher_sections_select_all" on public.teacher_sections;
create policy "teacher_sections_select_all"
  on public.teacher_sections
  for select
  using (true);

-- profiles policies:
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles
  for select
  using (
    auth.uid() = id
    or (role = 'student' and public.is_valid_auth_user(id))
  );

drop policy if exists "profiles_select_class_teacher_section" on public.profiles;
drop policy if exists "profiles_select_teacher" on public.profiles;
create policy "profiles_select_teacher"
  on public.profiles
  for select
  using (
    public.is_authenticated_teacher()
    and (
      id = auth.uid()
      or (
        role = 'student'
        and public.is_authorized_class_teacher_for(class_name, section, null)
      )
    )
  );

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles
  for insert
  with check (
    auth.uid() = id
    or (role = 'student' and status = 'pending' and public.is_valid_auth_user(id))
  );

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "profiles_update_class_teacher" on public.profiles;
drop policy if exists "profiles_update_teacher" on public.profiles;
create policy "profiles_update_teacher"
  on public.profiles
  for update
  using (
    role = 'student'
    and public.is_authorized_class_teacher_for(class_name, section, null)
  )
  with check (
    role = 'student'
    and public.is_authorized_class_teacher_for(class_name, section, null)
  );

-- verification_requests policies:
-- 1. Students reading their own verification request
drop policy if exists "verification_requests_select_own" on public.verification_requests;
create policy "verification_requests_select_own"
  on public.verification_requests
  for select
  using (
    auth.uid() = student_id
    or public.is_valid_auth_user(student_id)
  );

-- 2. Students creating their own verification request
drop policy if exists "verification_requests_insert_own" on public.verification_requests;
create policy "verification_requests_insert_own"
  on public.verification_requests
  for insert
  with check (
    status = 'pending'
    and (auth.uid() = student_id or public.is_valid_auth_user(student_id))
  );

-- 3. Students updating their own pending verification request
drop policy if exists "verification_requests_update_own" on public.verification_requests;
create policy "verification_requests_update_own"
  on public.verification_requests
  for update
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id and status = 'pending');

-- 4. Authorized Class Teachers reading requests for their class/section
drop policy if exists "verification_requests_select_teacher" on public.verification_requests;
create policy "verification_requests_select_teacher"
  on public.verification_requests
  for select
  using (
    public.is_authorized_class_teacher_for(class_name, section, class_teacher_code)
  );

-- 5. Authorized Class Teachers approving/rejecting requests for their class/section
drop policy if exists "verification_requests_update_teacher" on public.verification_requests;
create policy "verification_requests_update_teacher"
  on public.verification_requests
  for update
  using (
    public.is_authorized_class_teacher_for(class_name, section, class_teacher_code)
  )
  with check (
    public.is_authorized_class_teacher_for(class_name, section, class_teacher_code)
    and status in ('pending', 'approved', 'rejected')
  );

-- notifications policies:
drop policy if exists "notifications_select_access" on public.notifications;
create policy "notifications_select_access"
  on public.notifications
  for select
  using (
    recipient_id = auth.uid()
    or student_user_id = auth.uid()::text
    or target_role = 'both'
    or (target_role = 'teacher' and public.is_authenticated_teacher())
  );

drop policy if exists "notifications_insert_authenticated" on public.notifications;
create policy "notifications_insert_authenticated"
  on public.notifications
  for insert
  with check (auth.role() = 'authenticated' or target_role = 'teacher');

drop policy if exists "notifications_update_authenticated" on public.notifications;
create policy "notifications_update_authenticated"
  on public.notifications
  for update
  using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- 9. POSTGREST GRANTS & SCHEMA CACHE RELOAD (FIXES PGRST205)
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on table public.teacher_sections to anon, authenticated, service_role;
grant select, insert, update, delete on table public.profiles to anon, authenticated, service_role;
grant select, insert, update, delete on table public.verification_requests to anon, authenticated, service_role;
grant select, insert, update, delete on table public.notifications to anon, authenticated, service_role;

grant execute on all functions in schema public to anon, authenticated, service_role;

-- ----------------------------------------------------------------------------
-- 10. ENABLE REALTIME SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
alter table public.profiles replica identity full;
alter table public.verification_requests replica identity full;
alter table public.notifications replica identity full;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.profiles;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.verification_requests;
    exception when duplicate_object then null;
    end;
    begin
      alter publication supabase_realtime add table public.notifications;
    exception when duplicate_object then null;
    end;
  end if;
end $$;

-- Force Supabase PostgREST to reload the schema cache immediately
notify pgrst, 'reload schema';

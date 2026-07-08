create extension if not exists pgcrypto;

create type public.user_role as enum ('student', 'admin');
create type public.user_status as enum ('active', 'archived');
create type public.invitation_status as enum ('pending', 'accepted', 'expired');
create type public.lesson_status as enum (
  'available',
  'booked',
  'cancelled_by_student',
  'cancelled_by_teacher'
);
create type public.lesson_exchange_status as enum (
  'pending',
  'accepted',
  'declined',
  'cancelled'
);
create type public.studio_class_status as enum (
  'upcoming',
  'completed',
  'cancelled'
);
create type public.studio_signup_status as enum (
  'signed_up',
  'withdrawn',
  'performed',
  'not_performed'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'student',
  status public.user_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_email_lowercase check (email = lower(email)),
  constraint profiles_iu_email check (email like '%@iu.edu')
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  role public.user_role not null default 'student',
  status public.invitation_status not null default 'pending',
  invited_by uuid references public.profiles(id) on delete set null,
  accepted_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  constraint invitations_email_lowercase check (email = lower(email)),
  constraint invitations_iu_email check (email like '%@iu.edu')
);

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  start_date date not null,
  end_date date not null,
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint semesters_date_order check (end_date >= start_date)
);

create unique index semesters_one_current_idx
on public.semesters ((is_current))
where is_current;

create table public.lesson_slots (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete restrict,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.lesson_status not null default 'available',
  booked_by uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_duration_positive check (end_time > start_time),
  constraint lesson_booked_has_student check (
    (status = 'booked' and booked_by is not null)
    or (status <> 'booked')
  )
);

create index lesson_slots_semester_start_idx on public.lesson_slots(semester_id, start_time);
create index lesson_slots_booked_by_idx on public.lesson_slots(booked_by);
create unique index lesson_slots_one_booking_idx on public.lesson_slots(id) where status = 'booked';

create table public.lesson_cancellations (
  id uuid primary key default gen_random_uuid(),
  lesson_slot_id uuid not null references public.lesson_slots(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  cancelled_by uuid not null references public.profiles(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now()
);

create index lesson_cancellations_student_idx on public.lesson_cancellations(student_id);

create table public.lesson_exchange_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null constraint lesson_exchange_requests_requester_id_fkey references public.profiles(id) on delete cascade,
  requested_from uuid not null constraint lesson_exchange_requests_requested_from_fkey references public.profiles(id) on delete cascade,
  requester_lesson_slot_id uuid not null constraint lesson_exchange_requests_requester_lesson_slot_id_fkey references public.lesson_slots(id) on delete cascade,
  target_lesson_slot_id uuid not null constraint lesson_exchange_requests_target_lesson_slot_id_fkey references public.lesson_slots(id) on delete cascade,
  status public.lesson_exchange_status not null default 'pending',
  message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint lesson_exchange_not_self check (requester_id <> requested_from),
  constraint lesson_exchange_distinct_slots check (requester_lesson_slot_id <> target_lesson_slot_id)
);

create index lesson_exchange_requests_requester_idx on public.lesson_exchange_requests(requester_id);
create index lesson_exchange_requests_requested_from_idx on public.lesson_exchange_requests(requested_from);
create unique index lesson_exchange_requests_pending_unique_idx
on public.lesson_exchange_requests(requester_id, requester_lesson_slot_id, target_lesson_slot_id)
where status = 'pending';

create table public.studio_classes (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id) on delete restrict,
  title text not null,
  start_time timestamptz not null,
  end_time timestamptz not null,
  location text,
  notes text,
  status public.studio_class_status not null default 'upcoming',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint studio_class_time_positive check (end_time > start_time)
);

create index studio_classes_semester_start_idx on public.studio_classes(semester_id, start_time);

create table public.studio_class_signups (
  id uuid primary key default gen_random_uuid(),
  studio_class_id uuid not null references public.studio_classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  piece_title text not null,
  composer text not null,
  movement_or_section text,
  estimated_duration_minutes integer,
  notes text,
  status public.studio_signup_status not null default 'signed_up',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint estimated_duration_positive check (
    estimated_duration_minutes is null or estimated_duration_minutes > 0
  ),
  constraint one_signup_per_student_per_class unique (studio_class_id, student_id)
);

create index studio_class_signups_student_idx on public.studio_class_signups(student_id);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger lesson_slots_touch_updated_at
before update on public.lesson_slots
for each row execute function public.touch_updated_at();

create trigger lesson_exchange_requests_touch_updated_at
before update on public.lesson_exchange_requests
for each row execute function public.touch_updated_at();

create trigger studio_classes_touch_updated_at
before update on public.studio_classes
for each row execute function public.touch_updated_at();

create trigger studio_class_signups_touch_updated_at
before update on public.studio_class_signups
for each row execute function public.touch_updated_at();

create or replace function public.accept_lesson_exchange_request(
  p_request_id uuid,
  p_actor_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  req public.lesson_exchange_requests%rowtype;
  requester_slot public.lesson_slots%rowtype;
  target_slot public.lesson_slots%rowtype;
begin
  select *
  into req
  from public.lesson_exchange_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Exchange request not found.';
  end if;

  if req.status <> 'pending' then
    raise exception 'Exchange request is no longer pending.';
  end if;

  if req.requested_from <> p_actor_id then
    raise exception 'Only the requested student can accept this exchange.';
  end if;

  select *
  into requester_slot
  from public.lesson_slots
  where id = req.requester_lesson_slot_id
    and status = 'booked'
    and booked_by = req.requester_id
    and start_time > now() + interval '24 hours'
  for update;

  if not found then
    raise exception 'The offered lesson is no longer exchangeable.';
  end if;

  select *
  into target_slot
  from public.lesson_slots
  where id = req.target_lesson_slot_id
    and status = 'booked'
    and booked_by = req.requested_from
    and start_time > now() + interval '24 hours'
  for update;

  if not found then
    raise exception 'The requested lesson is no longer exchangeable.';
  end if;

  update public.lesson_slots
  set booked_by = case
      when id = req.requester_lesson_slot_id then req.requested_from
      when id = req.target_lesson_slot_id then req.requester_id
      else booked_by
    end,
    updated_at = now()
  where id in (req.requester_lesson_slot_id, req.target_lesson_slot_id);

  update public.lesson_exchange_requests
  set status = 'accepted',
    updated_at = now()
  where id = req.id;

  update public.lesson_exchange_requests
  set status = 'cancelled',
    updated_at = now()
  where status = 'pending'
    and id <> req.id
    and (
      requester_lesson_slot_id in (req.requester_lesson_slot_id, req.target_lesson_slot_id)
      or target_lesson_slot_id in (req.requester_lesson_slot_id, req.target_lesson_slot_id)
    );
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

create or replace function public.is_admin_or_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin();
$$;

create or replace function public.is_active_student()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'student'
      and status = 'active'
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.current_semester_id()
returns uuid
language sql
stable
as $$
  select id
  from public.semesters
  where is_current = true
  limit 1;
$$;

create or replace view public.lesson_slots_with_display_status
with (security_invoker = true)
as
select
  lesson_slots.*,
  case
    when status = 'booked' and end_time < now() then 'completed'
    else status::text
  end as display_status
from public.lesson_slots;

create or replace view public.student_semester_stats
with (security_invoker = true)
as
select
  p.id as student_id,
  p.full_name,
  p.email,
  p.status,
  sem.id as semester_id,
  sem.name as semester_name,
  coalesce(lesson_stats.completed_lessons, 0)::integer as completed_lessons,
  coalesce(performance_stats.performances, 0)::integer as performances
from public.profiles p
cross join public.semesters sem
left join (
  select
    booked_by as student_id,
    semester_id,
    count(*) as completed_lessons
  from public.lesson_slots
  where status = 'booked'
    and end_time < now()
  group by booked_by, semester_id
) lesson_stats
  on lesson_stats.student_id = p.id
  and lesson_stats.semester_id = sem.id
left join (
  select
    s.student_id,
    c.semester_id,
    count(*) as performances
  from public.studio_class_signups s
  join public.studio_classes c
    on c.id = s.studio_class_id
  where s.status = 'performed'
  group by s.student_id, c.semester_id
) performance_stats
  on performance_stats.student_id = p.id
  and performance_stats.semester_id = sem.id
where p.role = 'student';

alter table public.profiles enable row level security;
alter table public.invitations enable row level security;
alter table public.semesters enable row level security;
alter table public.lesson_slots enable row level security;
alter table public.lesson_cancellations enable row level security;
alter table public.lesson_exchange_requests enable row level security;
alter table public.studio_classes enable row level security;
alter table public.studio_class_signups enable row level security;

create policy "Authenticated users read profiles"
on public.profiles for select
using (auth.role() = 'authenticated');

create policy "Users update own profile"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins manage invitations"
on public.invitations for all
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users read semesters"
on public.semesters for select
using (public.is_active_user());

create policy "Admins manage semesters"
on public.semesters for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students read visible lesson slots"
on public.lesson_slots for select
using (
  public.is_admin()
  or (
    public.is_active_student()
    and (
      status = 'available'
      or booked_by = auth.uid()
      or (
        status = 'booked'
        and start_time > now()
      )
    )
  )
);

create policy "Students book available future lesson slots"
on public.lesson_slots for update
using (
  public.is_active_student()
  and status = 'available'
  and start_time > now()
)
with check (
  public.is_active_student()
  and status = 'booked'
  and booked_by = auth.uid()
);

create policy "Students cancel own lessons before 24 hours"
on public.lesson_slots for update
using (
  public.is_active_student()
  and booked_by = auth.uid()
  and status = 'booked'
  and start_time > now() + interval '24 hours'
)
with check (
  public.is_active_student()
  and booked_by = auth.uid()
  and status = 'cancelled_by_student'
);

create policy "Admins manage lesson slots"
on public.lesson_slots for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students read own lesson cancellations"
on public.lesson_cancellations for select
using (student_id = auth.uid() or public.is_admin());

create policy "Students insert own lesson cancellations"
on public.lesson_cancellations for insert
with check (
  public.is_active_student()
  and student_id = auth.uid()
  and cancelled_by = auth.uid()
);

create policy "Admins manage lesson cancellations"
on public.lesson_cancellations for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students read own lesson exchange requests"
on public.lesson_exchange_requests for select
using (
  public.is_admin()
  or requester_id = auth.uid()
  or requested_from = auth.uid()
);

create policy "Students create lesson exchange requests"
on public.lesson_exchange_requests for insert
with check (
  public.is_active_student()
  and requester_id = auth.uid()
  and status = 'pending'
  and requester_id <> requested_from
  and requester_lesson_slot_id <> target_lesson_slot_id
  and exists (
    select 1
    from public.lesson_slots offered
    where offered.id = requester_lesson_slot_id
      and offered.status = 'booked'
      and offered.booked_by = auth.uid()
      and offered.start_time > now() + interval '24 hours'
  )
  and exists (
    select 1
    from public.lesson_slots target
    where target.id = target_lesson_slot_id
      and target.status = 'booked'
      and target.booked_by = requested_from
      and target.booked_by <> auth.uid()
      and target.start_time > now() + interval '24 hours'
  )
);

create policy "Students update received lesson exchange requests"
on public.lesson_exchange_requests for update
using (
  public.is_active_student()
  and requested_from = auth.uid()
  and status = 'pending'
)
with check (
  public.is_active_student()
  and requested_from = auth.uid()
  and status = 'declined'
);

create policy "Admins manage lesson exchange requests"
on public.lesson_exchange_requests for all
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users read studio classes"
on public.studio_classes for select
using (public.is_active_user());

create policy "Admins manage studio classes"
on public.studio_classes for all
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users read studio class signups"
on public.studio_class_signups for select
using (public.is_active_user());

create policy "Students create own studio class signup"
on public.studio_class_signups for insert
with check (
  public.is_active_student()
  and student_id = auth.uid()
  and status in ('signed_up', 'withdrawn')
  and exists (
    select 1
    from public.studio_classes c
    where c.id = studio_class_id
      and c.status = 'upcoming'
      and c.end_time > now()
  )
);

create policy "Students update own studio class signup before class ends"
on public.studio_class_signups for update
using (
  public.is_active_student()
  and student_id = auth.uid()
  and exists (
    select 1
    from public.studio_classes c
    where c.id = studio_class_id
      and c.end_time > now()
  )
)
with check (
  public.is_active_student()
  and student_id = auth.uid()
  and status in ('signed_up', 'withdrawn')
);

create policy "Admins manage studio class signups"
on public.studio_class_signups for all
using (public.is_admin())
with check (public.is_admin());

insert into public.invitations (email, full_name, role, status)
values
  ('chihan@iu.edu', 'Chi Ho Han', 'admin', 'pending'),
  ('zhouding@iu.edu', 'Ding Zhou', 'admin', 'pending')
on conflict (email) do nothing;

grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant select on public.lesson_slots_with_display_status to authenticated, service_role;
grant select on public.student_semester_stats to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_admin_or_teacher() to authenticated, service_role;
grant execute on function public.is_active_student() to authenticated, service_role;
grant execute on function public.current_semester_id() to authenticated, service_role;
revoke all on function public.accept_lesson_exchange_request(uuid, uuid) from public, anon, authenticated;
grant execute on function public.accept_lesson_exchange_request(uuid, uuid) to service_role;

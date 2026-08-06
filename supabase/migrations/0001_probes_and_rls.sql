-- 1. New probes table, with optional assignment to a system
create table if not exists probes (
  id uuid primary key default gen_random_uuid(),
  probe_serial text not null,
  probe_type text,
  cases integer,
  last_refurb_date date,
  system_id uuid references systems(id) on delete set null
);

grant select, insert, update, delete on probes to anon, authenticated;

-- 2. Lock down row-level security so only logged-in users can read/write
--    (previously anyone with the public anon key could read/write everything)
alter table systems enable row level security;
alter table pm_records enable row level security;
alter table probes enable row level security;

create policy "Authenticated users can do everything" on systems
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything" on pm_records
  for all to authenticated using (true) with check (true);

create policy "Authenticated users can do everything" on probes
  for all to authenticated using (true) with check (true);

-- 3. Make the system_pm_status view respect the querying user's RLS
--    instead of running with the view owner's (bypass) privileges
alter view system_pm_status set (security_invoker = on);

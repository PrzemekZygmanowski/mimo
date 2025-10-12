-- -- migration: create_app_tables
-- -- created at: 2025-10-09T12:30:45Z
-- -- cel migracji: utworzenie tabel check_ins, task_templates, user_tasks, user_events wraz z włączeniem row level security (rls) oraz ustanowieniem granularnych polityk dostępu dla ról supabase (anon i authenticated).

-- -------------------------------------------
-- -- Tabela: check_ins
-- -- Tworzy tabelę check_ins dla przechowywania danych o nastrojach, poziomach energii, daty i dodatkowych notatek użytkownika.
-- -------------------------------------------
-- create table if not exists check_ins (
--   id bigserial primary key,
--   user_id uuid not null references auth.users(id) on delete cascade,
--   mood_level smallint not null check (mood_level between 1 and 5),
--   energy_level smallint not null check (energy_level between 1 and 3),
--   at timestamptz not null default now(),
--   notes text null,
--   metadata jsonb null
-- );

-- -- włączamy row level security dla tabeli check_ins
-- alter table check_ins enable row level security;

-- -- polityki rls dla tabeli check_ins
-- -- polityka select
-- create policy check_ins_select_anon on check_ins for select
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid);
-- create policy check_ins_select_auth on check_ins for select
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka insert
-- create policy check_ins_insert_anon on check_ins for insert
--   to anon
--   with check (user_id = current_setting('app.current_user_id')::uuid);
-- create policy check_ins_insert_auth on check_ins for insert
--   to authenticated
--   with check (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka update
-- create policy check_ins_update_anon on check_ins for update
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid)
--   with check (user_id = current_setting('app.current_user_id')::uuid);
-- create policy check_ins_update_auth on check_ins for update
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid)
--   with check (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka delete
-- create policy check_ins_delete_anon on check_ins for delete
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid);
-- create policy check_ins_delete_auth on check_ins for delete
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid);


-- -------------------------------------------
-- -- Tabela: task_templates
-- -- Przechowuje szablony zadań z wymaganiami dotyczącymi nastroju i energii.
-- -------------------------------------------
-- create table if not exists task_templates (
--   id bigserial primary key,
--   title varchar(255) not null,
--   description text null,
--   required_mood_level smallint null check (required_mood_level between 1 and 5),
--   required_energy_level smallint null check (required_energy_level between 1 and 3),
--   metadata jsonb null,
--   created_at timestamptz default now(),
--   updated_at timestamptz default now()
-- );

-- -- włączamy rls dla task_templates
-- alter table task_templates enable row level security;

-- -- polityki rls dla task_templates
-- -- dla select: tabela publicznie dostępna, polityka zwraca true
-- create policy task_templates_select_anon on task_templates for select
--   to anon
--   using (true);
-- create policy task_templates_select_auth on task_templates for select
--   to authenticated
--   using (true);

-- -- dla insert
-- create policy task_templates_insert_anon on task_templates for insert
--   to anon
--   with check (true);
-- create policy task_templates_insert_auth on task_templates for insert
--   to authenticated
--   with check (true);

-- -- dla update
-- create policy task_templates_update_anon on task_templates for update
--   to anon
--   using (true)
--   with check (true);
-- create policy task_templates_update_auth on task_templates for update
--   to authenticated
--   using (true)
--   with check (true);

-- -- dla delete
-- create policy task_templates_delete_anon on task_templates for delete
--   to anon
--   using (true);
-- create policy task_templates_delete_auth on task_templates for delete
--   to authenticated
--   using (true);


-- -------------------------------------------
-- -- Tabela: user_tasks
-- -- Przechowuje zadania przypisane do użytkowników wraz z odniesieniami do szablonów i (opcjonalnie) check_ins.
-- -------------------------------------------
-- create table if not exists user_tasks (
--   id bigserial primary key,
--   user_id uuid not null references auth.users(id) on delete cascade,
--   template_id bigint not null references task_templates(id) on delete cascade,
--   check_in_id bigint null references check_ins(id) on delete set null,
--   task_date date not null,
--   status varchar(50) not null default 'pending',
--   metadata jsonb null,
--   created_at timestamptz default now(),
--   updated_at timestamptz default now(),
--   constraint unique_user_task_date unique (user_id, task_date)
-- );

-- -- włączamy rls dla user_tasks
-- alter table user_tasks enable row level security;

-- -- polityki rls dla user_tasks
-- -- polityka select
-- create policy user_tasks_select_anon on user_tasks for select
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_tasks_select_auth on user_tasks for select
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka insert
-- create policy user_tasks_insert_anon on user_tasks for insert
--   to anon
--   with check (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_tasks_insert_auth on user_tasks for insert
--   to authenticated
--   with check (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka update
-- create policy user_tasks_update_anon on user_tasks for update
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid)
--   with check (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_tasks_update_auth on user_tasks for update
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid)
--   with check (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka delete
-- create policy user_tasks_delete_anon on user_tasks for delete
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_tasks_delete_auth on user_tasks for delete
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid);


-- -------------------------------------------
-- -- Tabela: user_events
-- -- Przechowuje zdarzenia użytkowników, umożliwiając rejestrację operacji w systemie.
-- -------------------------------------------
-- create table if not exists user_events (
--   id bigserial primary key,
--   user_id uuid not null references auth.users(id) on delete cascade,
--   event_type varchar(100) not null,
--   entity_id bigint null,
--   occurred_at timestamptz not null default now(),
--   payload jsonb null
-- );

-- -- włączamy rls dla user_events
-- alter table user_events enable row level security;

-- -- polityki rls dla user_events
-- -- polityka select
-- create policy user_events_select_anon on user_events for select
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_events_select_auth on user_events for select
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka insert
-- create policy user_events_insert_anon on user_events for insert
--   to anon
--   with check (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_events_insert_auth on user_events for insert
--   to authenticated
--   with check (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka update
-- create policy user_events_update_anon on user_events for update
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid)
--   with check (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_events_update_auth on user_events for update
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid)
--   with check (user_id = current_setting('app.current_user_id')::uuid);

-- -- polityka delete
-- create policy user_events_delete_anon on user_events for delete
--   to anon
--   using (user_id = current_setting('app.current_user_id')::uuid);
-- create policy user_events_delete_auth on user_events for delete
--   to authenticated
--   using (user_id = current_setting('app.current_user_id')::uuid);


-- -------------------------------------------
-- -- INDEKSY DLA POPRAWY WYDAJNOŚCI
-- -------------------------------------------
-- create index if not exists idx_check_ins_user_id on check_ins(user_id);
-- create index if not exists idx_user_tasks_user_id on user_tasks(user_id);
-- create index if not exists idx_user_tasks_task_date on user_tasks(task_date);
-- create index if not exists idx_user_events_user_id on user_events(user_id);

-- -------------------------------------------
-- -- UWAGI DOTYCZĄCE DESTRUKCYJNYCH OPERACJI:
-- -- Operacje takie jak truncate, drop lub modyfikacje kolumn wymagają osobnej weryfikacji i zazwyczaj nie są częścią tej migracji.
-- -- Upewnij się, że przed wdrożeniem migracji wykonano kopię zapasową bazy danych.
-- -------------------------------------------

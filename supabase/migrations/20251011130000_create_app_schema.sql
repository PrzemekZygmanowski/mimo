-- migration: create tables for app schema
-- date: 2025-10-11 13:00:00 utc
-- purpose: utworzenie tabel check_ins, task_templates, user_tasks, user_events oraz user_plants_progress
-- dotyczy: tabel check_ins, task_templates, user_tasks, user_events, user_plants_progress
-- uwagi:
--  - wszystkie tabele mają włączoną row level security (rls)
--  - nie definiujemy polityk rls

-- utworzenie tabeli check_ins
create table check_ins (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    mood_level smallint not null check (mood_level between 1 and 5),
    energy_level smallint not null check (energy_level between 1 and 3),
    at timestamp with time zone not null default now(),
    notes text null,
    metadata jsonb null
);

-- włączenie rls dla tabeli check_ins
alter table check_ins enable row level security;

-- utworzenie tabeli task_templates
create table task_templates (
    id bigserial primary key,
    title varchar(255) not null,
    description text null,
    required_mood_level smallint check (required_mood_level between 1 and 5),
    required_energy_level smallint check (required_energy_level between 1 and 3),
    metadata jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- włączenie rls dla tabeli task_templates
alter table task_templates enable row level security;

-- utworzenie tabeli user_tasks
create table user_tasks (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    template_id bigint not null references task_templates(id) on delete cascade,
    check_in_id bigint references check_ins(id) on delete set null,
    task_date date not null,
    status varchar(50) not null default 'pending',
    expires_at timestamp with time zone not null,
    new_task_requests smallint not null default 0 check (new_task_requests <= 3),
    metadata jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- ograniczenie unikalności dla user_tasks (unikalność user_id oraz task_date)
create unique index idx_unique_user_date on user_tasks(user_id, task_date);

-- włączenie rls dla tabeli user_tasks
alter table user_tasks enable row level security;

-- utworzenie tabeli user_events
create table user_events (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    event_type varchar(100) not null,
    entity_id bigint,
    occurred_at timestamp with time zone not null default now(),
    payload jsonb
);

-- włączenie rls dla tabeli user_events
alter table user_events enable row level security;

-- utworzenie tabeli user_plants_progress
create table user_plants_progress (
    user_id uuid primary key references auth.users(id) on delete cascade,
    board_state jsonb not null,
    last_updated_at timestamp with time zone not null default now()
);

-- włączenie rls dla tabeli user_plants_progress
alter table user_plants_progress enable row level security;

-- koniec migracji

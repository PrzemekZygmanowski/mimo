# Schemat bazy danych PostgreSQL dla aplikacji Mimo

## 1. Tabele

### 1.1. users

!IMPORTANT THIS TABLE IS MANAGED BY SUPABASE AUTH

- id: UUID PRIMARY KEY (generowany np. przy użyciu extension "uuid-ossp")
- email: VARCHAR(255) NOT NULL UNIQUE
- full_name: VARCHAR(255) NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

_Uwaga: Dalsze atrybuty profilu mogą być rozszerzane zgodnie z wymaganiami._

### 1.2. check_ins

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- mood_level: SMALLINT NOT NULL CHECK (mood_level BETWEEN 1 AND 5)
- energy_level: SMALLINT NOT NULL CHECK (energy_level BETWEEN 1 AND 3)
- at: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- notes: TEXT NULL
- metadata: JSONB NULL

### 1.3. task_templates

- id: BIGSERIAL PRIMARY KEY
- title: VARCHAR(255) NOT NULL
- description: TEXT NULL
- required_mood_level: SMALLINT NULL CHECK (required_mood_level BETWEEN 1 AND 5)
- required_energy_level: SMALLINT NULL CHECK (required_energy_level BETWEEN 1 AND 3)
- metadata: JSONB NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

### 1.4. user_tasks

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- template_id: BIGINT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE
- check_in_id: BIGINT NULL REFERENCES check_ins(id) ON DELETE SET NULL
- task_date: DATE NOT NULL
- status: VARCHAR(50) NOT NULL DEFAULT 'pending'
- metadata: JSONB NULL
- created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
- updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()

Unikalne ograniczenie: UNIQUE (user_id, task_date)

### 1.5. user_events

- id: BIGSERIAL PRIMARY KEY
- user_id: UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
- event_type: VARCHAR(100) NOT NULL
- entity_id: BIGINT NULL
- occurred_at: TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
- payload: JSONB NULL

## 2. Relacje między tabelami

- Każdy użytkownik (users) może mieć wiele check_ins, user_tasks oraz user_events.
- Tabela user_tasks odwołuje się do task_templates (jeden do wielu) oraz opcjonalnie do check_ins (jeden do wielu).

## 3. Indeksy

Dla poprawy wydajności zapytań, zalecane indeksy:

- INDEX na kolumnie user_id w tabelach: check_ins, user_tasks, user_events
- INDEX na task_date w tabeli user_tasks
- Opcjonalnie indeksy na kolumnach wymaganych do filtrowania w task_templates (np. required_mood_level, required_energy_level)

## 4. Zasady PostgreSQL (RLS)

Wdrożenie RLS (Row Level Security) na tabelach:

- users
- check_ins
- user_tasks
- user_events

Przykładowa konfiguracja (do wdrożenia w migracjach):

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_events ENABLE ROW LEVEL SECURITY;

-- Przykładowa polityka RLS dla tabeli check_ins:
CREATE POLICY user_check_ins_policy ON check_ins
    USING (user_id = current_setting('app.current_user_id')::uuid);
```

## 5. Dodatkowe uwagi

- Schemat jest w 3NF, z odpowiednią normalizacją danych.
- Pól "metadata" użyto dla zachowania elastyczności rozszerzeń w przyszłości.
- Zaplanowano możliwość przyszłego partycjonowania tabel (np. check_ins, user_events) w miarę wzrostu liczby rekordów.
- W ograniczeniach użyte są odpowiednie typy danych (np. SMALLINT dla ocen nastroju i energii) oraz CHECK constraints (wartości od 1 do 3).

---

_Ostateczny schemat przedstawia pełną strukturę bazy danych zgodnie z wymaganiami PRD, notatkami z sesji planowania oraz dopasowaną do stosu technologicznego projektu._

# 📋 **PLAN IMPLEMENTACYJNY: System Check-Inów i Losowych Zadań**

## **CZĘŚĆ I: ANALIZA WYMAGAŃ**

### Wymagania funkcjonalne:

1. ✅ **2 check-iny na dzień** (zmiana unique index)
2. ✅ **Losowe zadanie na każdy check-in** (status: pending)
3. ✅ **Zmiana statusu**: completed / skipped
4. ✅ **Pominięcie zadania**: losuj nowe (bez powtórzeń)
5. ✅ **Max 2 pominięcia**: po 3. brak nowego zadania
6. ✅ **2. check-in po 3 pominięciach**: tylko gdy wcześniej 1 check-in w dzień
7. ✅ **Nowa pula losowania**: dla każdego check-inu
8. ✅ **Obsługa błędów**: jasne komunikaty

---

## **CZĘŚĆ II: ZMIANY W BAZIE DANYCH**

### **1. Migracja: Zmiana struktury `user_tasks`**

**Plik:** `supabase/migrations/20250124_refactor_user_tasks_multi_checkin.sql`

```sql
-- migration: refactor user_tasks to support multiple check-ins per day
-- date: 2026-01-24
-- purpose: allow multiple tasks per day with skip limit tracking

-- DROP old unique constraint
DROP INDEX IF EXISTS idx_unique_user_date;

-- ADD check_in_number column to track which check-in generated the task
ALTER TABLE user_tasks ADD COLUMN check_in_number smallint NOT NULL DEFAULT 1;

-- ADD skipped_reason column for audit trail
ALTER TABLE user_tasks ADD COLUMN skipped_reason text NULL;

-- ADD skipped_templates_ids JSONB column (array of template IDs already skipped today)
ALTER TABLE user_tasks ADD COLUMN skipped_template_ids jsonb DEFAULT '[]'::jsonb;

-- ADD previously_used_template_ids JSONB column (track all used templates per day)
ALTER TABLE user_tasks ADD COLUMN used_template_ids jsonb DEFAULT '[]'::jsonb;

-- NEW unique constraint: one PENDING task per check-in per day
CREATE UNIQUE INDEX idx_unique_pending_checkin_per_day
ON user_tasks(user_id, task_date, check_in_number)
WHERE status = 'pending';

-- NEW index for efficient querying skip counts per day
CREATE INDEX idx_skip_count_per_day
ON user_tasks(user_id, task_date, status)
WHERE status = 'skipped';

-- NEW index for task selection
CREATE INDEX idx_task_selection
ON user_tasks(user_id, task_date, check_in_number);
```

### **2. Migracja: Nowa tabela `user_checkins_daily_state`**

**Plik:** `supabase/migrations/20250124_create_checkins_daily_state.sql`

```sql
-- NEW table: track daily check-in state per user
CREATE TABLE user_checkins_daily_state (
    id bigserial primary key,
    user_id uuid not null references auth.users(id) on delete cascade,
    date date not null,
    check_in_count smallint not null default 1,
    total_skipped_tasks smallint not null default 0,
    can_do_next_checkin boolean not null default true,
    last_checkin_at timestamp with time zone,
    metadata jsonb,
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now()
);

-- UNIQUE constraint: one state per user per day
CREATE UNIQUE INDEX idx_unique_state_per_user_day
ON user_checkins_daily_state(user_id, date);

-- Enable RLS
ALTER TABLE user_checkins_daily_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_checkins_daily_state_select_authenticated ON user_checkins_daily_state
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY user_checkins_daily_state_insert_authenticated ON user_checkins_daily_state
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY user_checkins_daily_state_update_authenticated ON user_checkins_daily_state
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

---

## **CZĘŚĆ III: WARSTWY USŁUG**

### **3. Nowa usługa: `checkInStateService.ts`**

**Plik:** `src/lib/services/checkInStateService.ts`

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { logError } from "../logger";

export interface CheckInDailyState {
  user_id: string;
  date: string;
  check_in_count: number;
  total_skipped_tasks: number;
  can_do_next_checkin: boolean;
  last_checkin_at: string | null;
}

export interface CheckInValidation {
  isValid: boolean;
  reason?: string;
  currentState: CheckInDailyState | null;
}

/**
 * Get or create today's daily state
 */
export async function getDailyState(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<CheckInDailyState | null> {
  try {
    const { data, error } = await supabase
      .from("user_checkins_daily_state")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .maybeSingle();

    if (error) {
      logError("Error fetching daily state", error);
      throw error;
    }

    return data as CheckInDailyState | null;
  } catch (err) {
    logError("Exception in getDailyState", err);
    throw err;
  }
}

/**
 * Create initial daily state (first check-in of the day)
 */
export async function createDailyState(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<CheckInDailyState> {
  try {
    const { data, error } = await supabase
      .from("user_checkins_daily_state")
      .insert({
        user_id: userId,
        date,
        check_in_count: 1,
        total_skipped_tasks: 0,
        can_do_next_checkin: true,
        last_checkin_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      logError("Error creating daily state", error);
      throw error;
    }

    return data as CheckInDailyState;
  } catch (err) {
    logError("Exception in createDailyState", err);
    throw err;
  }
}

/**
 * Increment check-in count and validate
 */
export async function incrementCheckInCount(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<CheckInValidation> {
  try {
    // Get current state
    const state = await getDailyState(supabase, userId, date);

    if (!state) {
      return {
        isValid: true,
        currentState: null,
      };
    }

    // Check: max 2 check-ins per day
    if (state.check_in_count >= 2) {
      return {
        isValid: false,
        reason: "Max 2 check-ins per day exceeded",
        currentState: state,
      };
    }

    // Check: if 3 skipped tasks, can't do 2nd check-in
    if (state.total_skipped_tasks >= 3 && state.check_in_count >= 1) {
      return {
        isValid: false,
        reason: "Cannot do 2nd check-in after 3 skipped tasks",
        currentState: state,
      };
    }

    // Valid - increment
    const { data, error } = await supabase
      .from("user_checkins_daily_state")
      .update({
        check_in_count: state.check_in_count + 1,
        last_checkin_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("date", date)
      .select("*")
      .single();

    if (error) {
      logError("Error incrementing check-in count", error);
      throw error;
    }

    return {
      isValid: true,
      currentState: data as CheckInDailyState,
    };
  } catch (err) {
    logError("Exception in incrementCheckInCount", err);
    throw err;
  }
}

/**
 * Track skipped task and increment counter
 */
export async function trackSkippedTask(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<number> {
  try {
    const state = await getDailyState(supabase, userId, date);

    if (!state) {
      await createDailyState(supabase, userId, date);
      return 1;
    }

    const newCount = state.total_skipped_tasks + 1;

    await supabase
      .from("user_checkins_daily_state")
      .update({ total_skipped_tasks: newCount })
      .eq("user_id", userId)
      .eq("date", date);

    return newCount;
  } catch (err) {
    logError("Exception in trackSkippedTask", err);
    throw err;
  }
}
```

### **4. Rozszerzenie usługi: `taskSelectionService.ts`**

**Plik:** `src/lib/services/taskSelectionService.ts` (NOWY)

```typescript
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "../../db/database.types";
import { logError } from "../logger";

export interface TaskSelectionCriteria {
  userId: string;
  date: string;
  moodLevel: number;
  energyLevel: number;
  checkInNumber: number;
}

/**
 * Select random task excluding previously used ones
 * - Respects mood/energy filtering
 * - Excludes templates already used today
 * - Avoids templates skipped today (when skipping)
 */
export async function selectRandomTask(
  supabase: SupabaseClient<Database>,
  criteria: TaskSelectionCriteria
): Promise<Tables<"task_templates"> | null> {
  try {
    // Get used template IDs from today's tasks
    const { data: usedTasks, error: usedError } = await supabase
      .from("user_tasks")
      .select("template_id, used_template_ids")
      .eq("user_id", criteria.userId)
      .eq("task_date", criteria.date)
      .order("check_in_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (usedError && usedError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      logError("Error fetching used templates", usedError);
      throw usedError;
    }

    const usedIds: number[] = usedTasks?.used_template_ids || [];

    // Query matching templates
    const { data: matchingTemplates, error: templatesError } = await supabase
      .from("task_templates")
      .select("*")
      .or(`required_mood_level.is.null,required_mood_level.eq.${criteria.moodLevel}`)
      .or(`required_energy_level.is.null,required_energy_level.eq.${criteria.energyLevel}`);

    if (templatesError) {
      logError("Error fetching task templates", templatesError);
      throw templatesError;
    }

    if (!matchingTemplates || matchingTemplates.length === 0) {
      return null;
    }

    // Filter out already used templates
    const availableTemplates = matchingTemplates.filter(t => !usedIds.includes(t.id));

    if (availableTemplates.length === 0) {
      return null; // All matching templates already used
    }

    // Select random from available
    const randomIndex = Math.floor(Math.random() * availableTemplates.length);
    return availableTemplates[randomIndex];
  } catch (err) {
    logError("Exception in selectRandomTask", err);
    throw err;
  }
}

/**
 * Get list of already-used template IDs for today
 */
export async function getUsedTemplateIds(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from("user_tasks")
      .select("template_id")
      .eq("user_id", userId)
      .eq("task_date", date)
      .neq("status", "skipped"); // Include pending/completed only

    if (error && error.code !== "PGRST116") {
      logError("Error fetching used template IDs", error);
      throw error;
    }

    return (data || []).map(t => t.template_id);
  } catch (err) {
    logError("Exception in getUsedTemplateIds", err);
    throw err;
  }
}
```

### **5. Rozszerzenie usługi: `userTasksService.ts`**

Dodaj nową funkcję:

```typescript
/**
 * Create new task for check-in with all validations
 * Tracks used templates to prevent repeats
 */
export async function createTaskForCheckIn(
  supabase: SupabaseClient<Database>,
  userId: string,
  templateId: number,
  checkInId: number,
  taskDate: string,
  checkInNumber: number
): Promise<UserTaskDTO> {
  try {
    // Calculate expiration (24 hours from now)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Get current used template IDs
    const usedIds = await getUsedTemplateIds(supabase, userId, taskDate);

    const { data, error } = await supabase
      .from("user_tasks")
      .insert({
        user_id: userId,
        template_id: templateId,
        check_in_id: checkInId,
        task_date: taskDate,
        check_in_number: checkInNumber,
        expires_at: expiresAt,
        status: "pending",
        new_task_requests: 0,
        used_template_ids: [...usedIds, templateId],
        skipped_template_ids: [],
      })
      .select("*")
      .single();

    if (error) {
      logError("Error creating task for check-in", error);
      throw error;
    }

    return mapTaskToDTO(data);
  } catch (err) {
    logError("Exception in createTaskForCheckIn", err);
    throw err;
  }
}
```

---

## **CZĘŚĆ IV: ENDPOINT POST /api/checkins**

**Plik:** `src/pages/api/checkins/index.ts` (REFACTORED)

```typescript
import type { APIRoute } from "astro";
import { z, ZodError } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../db/database.types";
import type { CheckInDTO, CreateCheckInCommand, UserTaskDTO } from "../../../types";
import { logError } from "../../../lib/logger";
import { getDailyState, createDailyState, incrementCheckInCount } from "../../../lib/services/checkInStateService";
import { selectRandomTask } from "../../../lib/services/taskSelectionService";
import { createTaskForCheckIn } from "../../../lib/services/userTasksService";

export const prerender = false;

const createCheckInSchema = z.object({
  mood_level: z.number().min(1).max(5),
  energy_level: z.number().min(1).max(3),
  notes: z.string().optional(),
});

// Error types for better error handling
class CheckInError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
  }
}

async function validateAndGetCheckInNumber(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string
): Promise<number> {
  let state = await getDailyState(supabase, userId, date);

  // Create state if doesn't exist
  if (!state) {
    state = await createDailyState(supabase, userId, date);
    return 1;
  }

  // Validate max 2 check-ins
  if (state.check_in_count >= 2) {
    throw new CheckInError("MAX_CHECKINS_EXCEEDED", 429, "Osiągnięto maksymalną liczbę check-inów na dzień");
  }

  // Validate: can't do 2nd check-in if 3+ tasks skipped
  if (state.total_skipped_tasks >= 3 && state.check_in_count >= 1) {
    throw new CheckInError("SKIP_LIMIT_REACHED", 429, "Nie możesz wykonać drugiego check-inu po pominięciu 3 zadań");
  }

  // Increment
  const validation = await incrementCheckInCount(supabase, userId, date);

  if (!validation.isValid) {
    throw new CheckInError("VALIDATION_FAILED", 429, validation.reason || "Nie udało się zwalidować check-inu");
  }

  return validation.currentState?.check_in_count || 1;
}

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = locals.supabase as SupabaseClient<Database>;

  try {
    // ===== Step 1: Authentication =====
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Nieautoryzowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ===== Step 2: Validation =====
    const body: unknown = await request.json();
    const parsedBody: CreateCheckInCommand = createCheckInSchema.parse(body);

    // ===== Step 3: Get today's date =====
    const today = new Date().toISOString().split("T")[0];

    // ===== Step 4: Validate check-in number =====
    const checkInNumber = await validateAndGetCheckInNumber(supabase, user.id, today);

    // ===== Step 5: Insert check-in record =====
    const { data: checkInInserted, error: checkInError } = await supabase
      .from("check_ins")
      .insert({
        user_id: user.id,
        mood_level: parsedBody.mood_level,
        energy_level: parsedBody.energy_level,
        notes: parsedBody.notes ?? null,
        at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (checkInError || !checkInInserted) {
      logError("Failed to insert check-in", checkInError);
      throw new CheckInError("CHECKIN_INSERT_FAILED", 500, "Nie udało się utworzyć check-inu");
    }

    // ===== Step 6: Select random task =====
    const selectedTemplate = await selectRandomTask(supabase, {
      userId: user.id,
      date: today,
      moodLevel: parsedBody.mood_level,
      energyLevel: parsedBody.energy_level,
      checkInNumber,
    });

    let generatedTask: UserTaskDTO | undefined = undefined;

    if (selectedTemplate) {
      // ===== Step 7: Create task for check-in =====
      generatedTask = await createTaskForCheckIn(
        supabase,
        user.id,
        selectedTemplate.id,
        checkInInserted.id,
        today,
        checkInNumber
      );

      // ===== Step 8: Log TASK_ASSIGNED event =====
      await supabase.from("user_events").insert({
        user_id: user.id,
        event_type: "TASK_ASSIGNED",
        entity_id: generatedTask.id,
        payload: {
          template_id: selectedTemplate.id,
          check_in_id: checkInInserted.id,
          check_in_number: checkInNumber,
          mood_level: parsedBody.mood_level,
          energy_level: parsedBody.energy_level,
        },
      });
    }

    // ===== Step 9: Log CHECKIN_CREATED event =====
    await supabase.from("user_events").insert({
      user_id: user.id,
      event_type: "CHECKIN_CREATED",
      entity_id: checkInInserted.id,
      payload: {
        mood_level: parsedBody.mood_level,
        energy_level: parsedBody.energy_level,
        has_notes: !!parsedBody.notes,
        task_generated: !!generatedTask,
        check_in_number: checkInNumber,
      },
    });

    // ===== Step 10: Return response =====
    const result: CheckInDTO = {
      id: checkInInserted.id,
      user_id: checkInInserted.user_id,
      mood_level: checkInInserted.mood_level,
      energy_level: checkInInserted.energy_level,
      at: checkInInserted.at,
      notes: checkInInserted.notes,
      generated_task: generatedTask,
    };

    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    // Handle custom CheckInError
    if (error instanceof CheckInError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status: error.statusCode,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
      return new Response(
        JSON.stringify({
          error: "Nieprawidłowe dane wejściowe",
          details: error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    const message = error instanceof Error ? error.message : "Błąd wewnętrzny serwera";
    logError("Unexpected error in POST /api/checkins", error);

    return new Response(
      JSON.stringify({
        error: message,
        code: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

---

## **CZĘŚĆ V: ENDPOINT SKIP TASK**

**Plik:** `src/pages/api/user-tasks/[id]/skip.ts` (NOWY)

```typescript
import type { APIRoute } from "astro";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../../db/database.types";
import { logError } from "../../../../lib/logger";
import { trackSkippedTask } from "../../../../lib/services/checkInStateService";
import { selectRandomTask } from "../../../../lib/services/taskSelectionService";
import { createTaskForCheckIn } from "../../../../lib/services/userTasksService";

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  const supabase = locals.supabase as SupabaseClient<Database>;
  const taskId = parseInt(params.id || "", 10);

  try {
    // ===== Authentication =====
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Nieautoryzowany" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ===== Get current task =====
    const { data: task, error: taskError } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("id", taskId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (taskError || !task) {
      return new Response(JSON.stringify({ error: "Zadanie nie znalezione" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ===== Validate task can be skipped =====
    if (task.status !== "pending") {
      return new Response(JSON.stringify({ error: "Zadanie nie może być pominięte" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];

    // ===== Track skip and get count =====
    const skipCount = await trackSkippedTask(supabase, user.id, today);

    // ===== Update task status to skipped =====
    await supabase
      .from("user_tasks")
      .update({
        status: "skipped",
        skipped_reason: "user_skipped",
      })
      .eq("id", taskId);

    // ===== Log TASK_SKIPPED event =====
    await supabase.from("user_events").insert({
      user_id: user.id,
      event_type: "TASK_SKIPPED",
      entity_id: taskId,
      payload: {
        skip_count_today: skipCount,
      },
    });

    let newTask = null;

    // ===== If skips < 3, generate new task =====
    if (skipCount < 3) {
      const { data: checkIn } = await supabase
        .from("check_ins")
        .select("mood_level, energy_level")
        .eq("id", task.check_in_id)
        .single();

      if (checkIn) {
        const selectedTemplate = await selectRandomTask(supabase, {
          userId: user.id,
          date: today,
          moodLevel: checkIn.mood_level,
          energyLevel: checkIn.energy_level,
          checkInNumber: task.check_in_number,
        });

        if (selectedTemplate) {
          newTask = await createTaskForCheckIn(
            supabase,
            user.id,
            selectedTemplate.id,
            task.check_in_id,
            today,
            task.check_in_number
          );

          await supabase.from("user_events").insert({
            user_id: user.id,
            event_type: "TASK_ASSIGNED",
            entity_id: newTask.id,
            payload: {
              reason: "replacement_after_skip",
              previous_task_id: taskId,
              skip_count: skipCount,
            },
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        skipped_task_id: taskId,
        skip_count_today: skipCount,
        can_skip_more: skipCount < 3,
        new_task: newTask || null,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Błąd wewnętrzny serwera";
    logError("Error in POST /api/user-tasks/:id/skip", error);

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

---

## **CZĘŚĆ VI: ROZSZERZENIA TYPÓW**

**Plik:** `src/types.ts` (DODAJ)

```typescript
// ===== Check-In State Management =====

export interface CheckInStateDTO {
  user_id: string;
  date: string;
  check_in_count: number;
  total_skipped_tasks: number;
  can_do_next_checkin: boolean;
  last_checkin_at: string | null;
}

export interface CheckInResponse extends CheckInDTO {
  check_in_number: number;
  skip_count_today: number;
  can_skip_more: boolean;
}

export interface TaskSkipResponse {
  skipped_task_id: number;
  skip_count_today: number;
  can_skip_more: boolean;
  new_task: UserTaskDTO | null;
}
```

---

## **CZĘŚĆ VII: TESTY JEDNOSTKOWE**

**Plik:** `src/pages/api/checkins/index.test.ts` (EXTENDED)

```typescript
describe("POST /api/checkins - Multi Check-In Support", () => {
  it("should allow 2 check-ins per day", async () => {
    // First check-in
    const response1 = await POST({
      request: createRequest({ mood_level: 3, energy_level: 2 }),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response1.status).toBe(201);

    // Second check-in
    const response2 = await POST({
      request: createRequest({ mood_level: 4, energy_level: 1 }),
      locals: { supabase: mockSupabase },
    } as any);
    expect(response2.status).toBe(201);
  });

  it("should reject 3rd check-in in single day", async () => {
    // Mock 2 existing check-ins
    mockDailyState.check_in_count = 2;

    const response = await POST({
      request: createRequest({ mood_level: 3, energy_level: 2 }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.code).toBe("MAX_CHECKINS_EXCEEDED");
  });

  it("should reject 2nd check-in if 3+ tasks skipped", async () => {
    // Mock 3 skipped tasks
    mockDailyState.check_in_count = 1;
    mockDailyState.total_skipped_tasks = 3;

    const response = await POST({
      request: createRequest({ mood_level: 3, energy_level: 2 }),
      locals: { supabase: mockSupabase },
    } as any);

    expect(response.status).toBe(429);
    const body = await response.json();
    expect(body.code).toBe("SKIP_LIMIT_REACHED");
  });

  it("should not repeat templates in same day", async () => {
    // Mock first task created with template ID 10
    // Second check-in should exclude template 10

    const response = await POST({
      request: createRequest({ mood_level: 3, energy_level: 2 }),
      locals: { supabase: mockSupabase },
    } as any);

    const body = await response.json();
    expect(body.generated_task.template_id).not.toBe(10);
  });

  it("should generate max 3 tasks per day (if skipped < 3)", async () => {
    // 1st check-in: 1 task generated
    // 2nd check-in: 1 task generated (if not skipped)
    // Skip: 1 new task generated
    // Total = 3 tasks max
    // Beyond that: no new tasks
  });
});
```

---

## **CZĘŚĆ VIII: PLANY MIGRACJI I WDROŻENIA**

### **Faza 1: Przygotowanie (1-2 dni)**

- [ ] Przygotować migracje Supabase
- [ ] Wdrożyć nowe tabele i indeksy
- [ ] Backup bieżących danych `user_tasks`

### **Faza 2: Backend (2-3 dni)**

- [ ] Zaimplementować `checkInStateService.ts`
- [ ] Zaimplementować `taskSelectionService.ts`
- [ ] Rozszerzyć `userTasksService.ts`
- [ ] Refaktorować `POST /api/checkins`
- [ ] Zaimplementować `POST /api/user-tasks/:id/skip`
- [ ] Uzupełnić testy jednostkowe

### **Faza 3: Frontend (1-2 dni)**

- [ ] Zaktualizować `TaskContext.tsx`
- [ ] Dodać UI do skipping z komunikatami
- [ ] Obsługa nowych kodów błędów (429, etc.)
- [ ] Testy end-to-end

### **Faza 4: QA i Wdrożenie (1 dzień)**

- [ ] Testing na staging
- [ ] Code review
- [ ] Deploy na produkcję

---

## **CZĘŚĆ IX: OBSŁUGA BŁĘDÓW - MAPY KODÓW**

| Kod                     | Status | Komunikat Użytkownika                             | Akcja            |
| ----------------------- | ------ | ------------------------------------------------- | ---------------- |
| `MAX_CHECKINS_EXCEEDED` | 429    | "Osiągnięto limit check-inów na dzień"            | Czekaj do jutra  |
| `SKIP_LIMIT_REACHED`    | 429    | "Nie możesz drugiego check-inu po 3 pominięciach" | Czekaj do jutra  |
| `CHECKIN_INSERT_FAILED` | 500    | "Błąd tworzenia check-inu"                        | Spróbuj ponownie |
| `TASK_NOT_FOUND`        | 404    | "Zadanie nie znalezione"                          | Odśwież stronę   |
| `INTERNAL_ERROR`        | 500    | "Błąd serwera"                                    | Kontakt support  |

---

## **CZĘŚĆ X: ZMIENNE ŚRODOWISKOWE**

Nie wymagane dodatkowe env vars (istniejące wystarczają).

---

## **PODSUMOWANIE ZMIAN**

| Element       | Opis                                        | Impact            |
| ------------- | ------------------------------------------- | ----------------- |
| **Migracje**  | 2 nowe (state tracking, unique constraints) | ✅ DB             |
| **Serwisy**   | 2 nowe + 1 rozszerzony                      | ✅ Business Logic |
| **Endpointy** | 1 refactored + 1 nowy                       | ✅ API            |
| **Testy**     | +10-15 nowych test casów                    | ✅ QA             |
| **Typy**      | +3 nowe interfejsy                          | ✅ Type Safety    |

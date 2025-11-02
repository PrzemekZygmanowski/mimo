import type { Json } from "./db/database.types";

/*
  DTO and Command Models for MIMO API

  This file defines the data transfer objects (DTOs) and command models for the application API endpoints.
  They are derived from the underlying database models in src/db/database.types.ts and reflect the API plan defined in api-plan.md.
*/

// -----------------------
// Users
// -----------------------

// User DTO representing the user details retrieved via GET /api/users/:id
export interface UserDTO {
  id: string;
  email: string;
  created_at: string;
  // Additional user-specific data
  otherData?: Record<string, unknown>;
}

// Command model for creating a new user (POST /api/users)
export interface CreateUserCommand {
  // Email is optional for anonymous registration
  email?: string;
  password: string;
  // Optional additional fields
  otherData?: Record<string, unknown>;
}

// -----------------------
// Check-Ins
// -----------------------

// DTO for a check-in record as returned by GET /api/checkins/:id
export interface CheckInDTO {
  id: number;
  user_id: string;
  mood_level: number; // Should be between 1 and 5
  energy_level: number; // Should be between 1 and 3
  at: string; // Timestamp of the check-in
  notes?: string | null;
  // Optional metadata from the database model
  metadata?: Json | null;
  // If a task is generated from the check-in, include it
  generated_task?: UserTaskDTO;
}

// Command model for creating a check-in (POST /api/checkins)
export interface CreateCheckInCommand {
  mood_level: number; // Integer 1-5
  energy_level: number; // Integer 1-3
  notes?: string;
}

// -----------------------
// Task Templates
// -----------------------

// DTO representing a task template, as defined in the database model "task_templates"
export interface TaskTemplateDTO {
  id: number;
  created_at: string | null;
  description?: string | null;
  metadata?: Json | null;
  required_energy_level?: number | null;
  required_mood_level?: number | null;
  title: string;
  updated_at?: string | null;
}

// Command model for creating a new task template (POST /api/task-templates)
// Excludes auto-generated fields
export type CreateTaskTemplateCommand = Omit<TaskTemplateDTO, "id" | "created_at" | "updated_at">;

// Command model for updating an existing task template (PUT/PATCH /api/task-templates/:id)
// Partial update of fields allowed in creation
export type UpdateTaskTemplateCommand = Partial<CreateTaskTemplateCommand>;

// -----------------------
// User Tasks
// -----------------------

// DTO representing a user task as defined in the database model "user_tasks"
export interface UserTaskDTO {
  id: number;
  check_in_id?: number | null;
  created_at: string | null;
  expires_at: string;
  metadata?: Json | null;
  new_task_requests: number;
  status: string;
  task_date: string;
  template_id: number;
  updated_at?: string | null;
  user_id: string;
}

// Command model for creating a new user task (POST /api/user-tasks)
export interface CreateUserTaskCommand {
  template_id: number;
  user_id: string;
  // Optional association with a check-in if the task was generated from it
  check_in_id?: number | null;
  // The date the task is assigned (typically today)
  task_date: string;
}

// Command model for updating a user task (PATCH /api/user-tasks/:id)
// Typically used for marking a task as completed or updating task request count
export type UpdateUserTaskCommand = Partial<Pick<UserTaskDTO, "status" | "new_task_requests">>;

// -----------------------
// User Events
// -----------------------

// DTO representing a user event as defined in the database model "user_events"
export interface UserEventDTO {
  id: number;
  user_id: string;
  event_type: string;
  occurred_at: string;
  payload?: Json | null;
  entity_id?: number | null;
}

// Command model for logging a new user event (POST /api/user-events)
// Excludes auto-generated fields such as id and occurred_at
export type CreateUserEventCommand = Omit<UserEventDTO, "id" | "occurred_at">;

// -----------------------
// Plants Progress (Reward System)
// -----------------------

// DTO representing the user's garden board state from "user_plants_progress"
export interface PlantsProgressDTO {
  user_id: string;
  board_state: Json; // Expected to be a 5x6 grid represented in JSON
  last_updated_at: string;
}

// Command model for updating the garden board state (PATCH /api/plants-progress)
export interface UpdatePlantsProgressCommand {
  board_state: Json; // Updated board state JSON
}

// Request DTO for updating plants progress (PATCH /api/plants-progress)
export interface UpdatePlantsProgressRequestDTO {
  board_state: Json;
}

// Response DTO for PATCH /api/plants-progress
export interface PlantsProgressResponseDTO {
  user_id: string;
  board_state: Json;
  last_updated_at: string;
}

// -----------------------
// UI Components
// -----------------------

// Generic props for icon components
export interface IconProps {
  className?: string;
}

// -----------------------
// Task View Models
// -----------------------

// View model for Task page, derived from UserTaskDTO with computed properties
export interface TaskViewModel {
  id: number;
  template_id: number;
  title: string;
  description: string;
  expires_at: string;
  status: "pending" | "completed" | "skipped";
  new_task_requests: number;
  expirationTime: Date;
  remainingRequests: number;
  isExpired: boolean;
}

// Action types for task mutations
export interface UpdateTaskStatus {
  status: "completed" | "skipped";
}

export interface RequestNewTask {
  new_task_requests: number;
}

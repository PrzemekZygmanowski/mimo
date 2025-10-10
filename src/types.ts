// src/types.ts

import type { Database } from "./db/database.types";

// =============================
// DTO Definitions
// =============================

// 1. User DTOs

/**
 * DTO for registering a new user
 */
export interface RegisterUserDto {
  email?: string; // Optional for anonymous users
  password: string;
  isAnonymous: boolean;
}

/**
 * Response DTO after user registration
 */
export interface RegisterUserResponseDto {
  userId: string;
  message: string;
}

/**
 * DTO for logging in a user
 */
export interface LoginUserDto {
  email: string;
  password: string;
}

/**
 * Response DTO after successful login
 */
export interface LoginUserResponseDto {
  userId: string;
  token: string;
  message: string;
}

// =============================
// Check-In DTOs
// =============================

/**
 * DTO for creating a daily check-in.
 * Based on the database model for check_ins.
 */
export type CreateCheckInDto = Omit<Database["public"]["Tables"]["check_ins"]["Insert"], "id">;

/**
 * Response DTO for creating a daily check-in, includes assigned task.
 */
export interface CreateCheckInResponseDto {
  checkInId: number;
  assignedTask: {
    taskId: number;
    taskDetails: string;
    message: string;
  };
}

// =============================
// Task Template DTO
// =============================

/**
 * DTO for a task template, directly derived from the database model.
 */
export type TaskTemplateDto = Database["public"]["Tables"]["task_templates"]["Row"];

// =============================
// User Task DTOs
// =============================

/**
 * DTO for a user task, representing a task assigned to a user.
 */
export type UserTaskDto = Database["public"]["Tables"]["user_tasks"]["Row"];

/**
 * DTO/Command for updating a user task status (e.g., completed or skipped).
 */
export interface UpdateUserTaskDto {
  status: "completed" | "skipped";
}

// =============================
// User Event DTO
// =============================

/**
 * DTO for logging a user event (internal use).
 */
export interface CreateUserEventDto {
  userId: string;
  event_type: string;
  entity_id?: number | string | null;
  payload?: Database["public"]["Tables"]["user_events"]["Row"]["payload"];
}

// =============================
// Command Models
// =============================

// For endpoints that modify state, we define Command Models. In many cases, these are identical to the DTOs above,
// but are separated here to clearly distinguish between data transfer objects and internal command models.

export type RegisterUserCommand = RegisterUserDto;
export type LoginUserCommand = LoginUserDto;
export type CreateCheckInCommand = CreateCheckInDto;
export type UpdateUserTaskCommand = UpdateUserTaskDto;
export type CreateUserEventCommand = CreateUserEventDto;

// =============================
// List and Response Models
// =============================

// These types represent the responses for GET endpoints that return lists of items.

export type CheckInListResponse = Database["public"]["Tables"]["check_ins"]["Row"][];
export type TaskTemplateListResponse = TaskTemplateDto[];
export type UserTaskListResponse = UserTaskDto[];
export type UserEventListResponse = Database["public"]["Tables"]["user_events"]["Row"][];

// End of DTO and Command Model definitions

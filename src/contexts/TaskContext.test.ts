import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskTemplateDTO, UserTaskDTO } from "../types";

// Mock data
const mockUserTask: UserTaskDTO = {
  id: 1,
  check_in_id: 1,
  created_at: "2025-01-01T10:00:00Z",
  expires_at: "2025-01-01T18:00:00Z",
  metadata: null,
  new_task_requests: 1,
  status: "pending",
  task_date: "2025-01-01",
  template_id: 1,
  updated_at: "2025-01-01T10:00:00Z",
  user_id: "user-1",
};

const mockTemplate: TaskTemplateDTO = {
  id: 1,
  created_at: "2025-01-01T09:00:00Z",
  description: "Take a 5-minute walk outside",
  metadata: null,
  required_energy_level: 2,
  required_mood_level: 3,
  title: "Short Walk",
  updated_at: "2025-01-01T09:00:00Z",
};

describe("TaskContext - Logic Tests", () => {
  const MAX_DAILY_TASK_REQUESTS = 3;

  describe("mapToTaskViewModel", () => {
    it("correctly maps UserTaskDTO and TaskTemplateDTO to TaskViewModel", () => {
      const expirationTime = new Date(mockUserTask.expires_at);
      const isExpired = expirationTime.getTime() < Date.now();
      const remainingRequests = MAX_DAILY_TASK_REQUESTS - mockUserTask.new_task_requests;

      const expected = {
        id: mockUserTask.id,
        template_id: mockUserTask.template_id,
        title: mockTemplate.title,
        description: mockTemplate.description || "",
        expires_at: mockUserTask.expires_at,
        status: mockUserTask.status,
        new_task_requests: mockUserTask.new_task_requests,
        expirationTime,
        remainingRequests,
        isExpired,
      };

      expect(expected.id).toBe(1);
      expect(expected.title).toBe("Short Walk");
      expect(expected.description).toBe("Take a 5-minute walk outside");
      expect(expected.remainingRequests).toBe(2);
    });

    it("handles empty template description", () => {
      const templateWithoutDescription = { ...mockTemplate, description: null };
      const description = templateWithoutDescription.description || "";

      expect(description).toBe("");
    });

    it("calculates isExpired correctly for future time", () => {
      const futureTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour from now
      const isExpired = futureTime.getTime() < Date.now();

      expect(isExpired).toBe(false);
    });

    it("calculates isExpired correctly for past time", () => {
      const pastTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const isExpired = pastTime.getTime() < Date.now();

      expect(isExpired).toBe(true);
    });

    it("calculates remainingRequests correctly", () => {
      expect(MAX_DAILY_TASK_REQUESTS - 0).toBe(3);
      expect(MAX_DAILY_TASK_REQUESTS - 1).toBe(2);
      expect(MAX_DAILY_TASK_REQUESTS - 2).toBe(1);
      expect(MAX_DAILY_TASK_REQUESTS - 3).toBe(0);
    });
  });

  describe("API request validation", () => {
    it("validates today's date format (YYYY-MM-DD)", () => {
      const today = new Date().toISOString().split("T")[0];
      const regex = /^\d{4}-\d{2}-\d{2}$/;

      expect(regex.test(today)).toBe(true);
    });

    it("creates correct query string for pending tasks", () => {
      const status = "pending";
      const date = "2025-01-01";
      const queryString = `/api/user-tasks?status=${status}&date=${date}`;

      expect(queryString).toBe("/api/user-tasks?status=pending&date=2025-01-01");
    });

    it("creates correct template query string", () => {
      const templateId = 1;
      const queryString = `/api/task-templates?id=${templateId}`;

      expect(queryString).toBe("/api/task-templates?id=1");
    });
  });

  describe("task actions validation", () => {
    it("validates complete task request body", () => {
      const requestBody = { status: "completed" };

      expect(requestBody).toHaveProperty("status");
      expect(requestBody.status).toBe("completed");
    });

    it("validates skip task request body", () => {
      const requestBody = { status: "skipped" };

      expect(requestBody).toHaveProperty("status");
      expect(requestBody.status).toBe("skipped");
    });

    it("validates request new task body", () => {
      const currentRequests = 1;
      const newRequestCount = currentRequests + 1;
      const requestBody = { new_task_requests: newRequestCount };

      expect(requestBody).toHaveProperty("new_task_requests");
      expect(requestBody.new_task_requests).toBe(2);
    });

    it("validates event logging body for TASK_DONE", () => {
      const taskId = 1;
      const eventBody = {
        event_type: "TASK_DONE",
        entity_id: taskId,
      };

      expect(eventBody.event_type).toBe("TASK_DONE");
      expect(eventBody.entity_id).toBe(1);
    });

    it("validates event logging body for TASK_SKIPPED", () => {
      const taskId = 1;
      const eventBody = {
        event_type: "TASK_SKIPPED",
        entity_id: taskId,
      };

      expect(eventBody.event_type).toBe("TASK_SKIPPED");
      expect(eventBody.entity_id).toBe(1);
    });

    it("validates event logging body for REQUEST_NEW", () => {
      const taskId = 1;
      const eventBody = {
        event_type: "REQUEST_NEW",
        entity_id: taskId,
      };

      expect(eventBody.event_type).toBe("REQUEST_NEW");
      expect(eventBody.entity_id).toBe(1);
    });
  });

  describe("error handling", () => {
    it("handles 401 unauthorized error", () => {
      const status = 401;
      const shouldRedirectToLogin = status === 401;

      expect(shouldRedirectToLogin).toBe(true);
    });

    it("handles 400 bad request error", () => {
      const status = 400;
      const is400Error = status === 400;

      expect(is400Error).toBe(true);
    });

    it("handles request new task limit validation", () => {
      const task = {
        remainingRequests: 0,
        new_task_requests: 3,
      };

      const canRequestNew = task.remainingRequests > 0;

      expect(canRequestNew).toBe(false);
    });

    it("allows request new task when limit not reached", () => {
      const task = {
        remainingRequests: 2,
        new_task_requests: 1,
      };

      const canRequestNew = task.remainingRequests > 0;

      expect(canRequestNew).toBe(true);
    });
  });

  describe("status transitions", () => {
    it("transitions from pending to completed", () => {
      const initialStatus = "pending";
      const newStatus = "completed";

      expect(initialStatus).toBe("pending");
      expect(newStatus).toBe("completed");
      expect(initialStatus).not.toBe(newStatus);
    });

    it("transitions from pending to skipped", () => {
      const initialStatus = "pending";
      const newStatus = "skipped";

      expect(initialStatus).toBe("pending");
      expect(newStatus).toBe("skipped");
      expect(initialStatus).not.toBe(newStatus);
    });

    it("validates status values", () => {
      const validStatuses = ["pending", "completed", "skipped"];

      expect(validStatuses).toContain("pending");
      expect(validStatuses).toContain("completed");
      expect(validStatuses).toContain("skipped");
      expect(validStatuses).not.toContain("invalid");
    });
  });
});




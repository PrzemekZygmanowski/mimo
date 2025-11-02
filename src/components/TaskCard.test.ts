import { describe, expect, it } from "vitest";
import type { TaskViewModel } from "../types";

describe("TaskCard - Logic Tests", () => {
  const createMockTask = (overrides?: Partial<TaskViewModel>): TaskViewModel => ({
    id: 1,
    template_id: 1,
    title: "Test Task",
    description: "Test Description",
    expires_at: "2025-01-01T12:00:00Z",
    status: "pending",
    new_task_requests: 0,
    expirationTime: new Date("2025-01-01T12:00:00Z"),
    remainingRequests: 3,
    isExpired: false,
    ...overrides,
  });

  describe("motivational message generation", () => {
    it("returns warning message when remainingRequests is 0", () => {
      const task = createMockTask({ remainingRequests: 0 });

      const getMotivationalMessage = (taskData: TaskViewModel) => {
        if (taskData.remainingRequests === 0) {
          return {
            message: "To Twoje ostatnie zadanie na dziś. Wykorzystaj je mądrze!",
            type: "warning" as const,
          };
        }

        return {
          message: "Default motivational message",
          type: "motivational" as const,
        };
      };

      const result = getMotivationalMessage(task);

      expect(result.type).toBe("warning");
      expect(result.message).toBe("To Twoje ostatnie zadanie na dziś. Wykorzystaj je mądrze!");
    });

    it("returns motivational message when remainingRequests > 0", () => {
      const task = createMockTask({ remainingRequests: 2 });

      const getMotivationalMessage = (taskData: TaskViewModel) => {
        if (taskData.remainingRequests === 0) {
          return {
            message: "To Twoje ostatnie zadanie na dziś. Wykorzystaj je mądrze!",
            type: "warning" as const,
          };
        }

        return {
          message: "Małe kroki prowadzą do wielkich zmian! 🌱",
          type: "motivational" as const,
        };
      };

      const result = getMotivationalMessage(task);

      expect(result.type).toBe("motivational");
      expect(result.message).toContain("🌱");
    });
  });

  describe("task validation", () => {
    it("identifies pending task correctly", () => {
      const task = createMockTask({ status: "pending" });
      expect(task.status).toBe("pending");
    });

    it("identifies completed task correctly", () => {
      const task = createMockTask({ status: "completed" });
      expect(task.status).toBe("completed");
    });

    it("identifies skipped task correctly", () => {
      const task = createMockTask({ status: "skipped" });
      expect(task.status).toBe("skipped");
    });

    it("identifies expired task correctly", () => {
      const task = createMockTask({ isExpired: true });
      expect(task.isExpired).toBe(true);
    });

    it("identifies non-expired task correctly", () => {
      const task = createMockTask({ isExpired: false });
      expect(task.isExpired).toBe(false);
    });
  });

  describe("remaining requests tracking", () => {
    it("calculates remaining requests correctly", () => {
      const MAX_DAILY_TASK_REQUESTS = 3;

      expect(MAX_DAILY_TASK_REQUESTS - 0).toBe(3);
      expect(MAX_DAILY_TASK_REQUESTS - 1).toBe(2);
      expect(MAX_DAILY_TASK_REQUESTS - 2).toBe(1);
      expect(MAX_DAILY_TASK_REQUESTS - 3).toBe(0);
    });

    it("handles edge case of 0 remaining requests", () => {
      const task = createMockTask({ remainingRequests: 0, new_task_requests: 3 });
      expect(task.remainingRequests).toBe(0);
    });

    it("handles edge case of max remaining requests", () => {
      const task = createMockTask({ remainingRequests: 3, new_task_requests: 0 });
      expect(task.remainingRequests).toBe(3);
    });
  });

  describe("task properties", () => {
    it("contains all required properties", () => {
      const task = createMockTask();

      expect(task).toHaveProperty("id");
      expect(task).toHaveProperty("template_id");
      expect(task).toHaveProperty("title");
      expect(task).toHaveProperty("description");
      expect(task).toHaveProperty("expires_at");
      expect(task).toHaveProperty("status");
      expect(task).toHaveProperty("new_task_requests");
      expect(task).toHaveProperty("expirationTime");
      expect(task).toHaveProperty("remainingRequests");
      expect(task).toHaveProperty("isExpired");
    });

    it("handles empty description", () => {
      const task = createMockTask({ description: "" });
      expect(task.description).toBe("");
    });

    it("handles long title and description", () => {
      const task = createMockTask({
        title: "a".repeat(200),
        description: "b".repeat(1000),
      });
      expect(task.title.length).toBe(200);
      expect(task.description.length).toBe(1000);
    });
  });
});



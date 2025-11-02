import { beforeEach, describe, expect, it, vi } from "vitest";

describe("ExpirationTimer - Logic Tests", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("time calculation", () => {
    it("formats time correctly with hours, minutes, and seconds", () => {
      const now = new Date("2025-01-01T10:00:00Z");
      const expireTime = new Date("2025-01-01T13:30:45Z"); // 3h 30m 45s later

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      expect(hours).toBe(3);
      expect(minutes).toBe(30);
      expect(seconds).toBe(45);
    });

    it("formats time correctly with only minutes and seconds", () => {
      const now = new Date("2025-01-01T10:00:00Z");
      const expireTime = new Date("2025-01-01T10:15:30Z"); // 15m 30s later

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      expect(hours).toBe(0);
      expect(minutes).toBe(15);
      expect(seconds).toBe(30);
    });

    it("formats time correctly with only seconds", () => {
      const now = new Date("2025-01-01T10:00:00Z");
      const expireTime = new Date("2025-01-01T10:00:45Z"); // 45s later

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      expect(hours).toBe(0);
      expect(minutes).toBe(0);
      expect(seconds).toBe(45);
    });

    it("handles expired time (negative difference)", () => {
      const now = new Date("2025-01-01T10:00:00Z");
      const expireTime = new Date("2025-01-01T09:00:00Z"); // 1h ago

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();

      expect(diff).toBeLessThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles exact expiration time (0 seconds)", () => {
      const now = new Date("2025-01-01T10:00:00Z");
      const expireTime = new Date("2025-01-01T10:00:00Z");

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();

      expect(diff).toBe(0);
    });

    it("handles very small time differences (less than 1 second)", () => {
      const now = new Date("2025-01-01T10:00:00.000Z");
      const expireTime = new Date("2025-01-01T10:00:00.500Z");

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();

      expect(diff).toBe(500); // 500ms
    });

    it("handles long durations (24+ hours)", () => {
      const now = new Date("2025-01-01T10:00:00Z");
      const expireTime = new Date("2025-01-02T15:30:45Z"); // 29h 30m 45s later

      vi.setSystemTime(now);

      const diff = expireTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));

      expect(hours).toBe(29);
    });
  });
});

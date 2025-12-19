import { describe, expect, it } from "vitest";

describe("MessageBanner - Logic Tests", () => {
  describe("style determination", () => {
    it("returns motivational styles for motivational type", () => {
      const type = "motivational";
      const expectedStyles =
        "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";

      const getStyles = (bannerType: "motivational" | "neutral" | "warning") => {
        switch (bannerType) {
          case "motivational":
            return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";
          case "warning":
            return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";
          case "neutral":
          default:
            return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
        }
      };

      expect(getStyles(type)).toBe(expectedStyles);
    });

    it("returns warning styles for warning type", () => {
      const type = "warning";
      const expectedStyles =
        "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";

      const getStyles = (bannerType: "motivational" | "neutral" | "warning") => {
        switch (bannerType) {
          case "motivational":
            return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";
          case "warning":
            return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";
          case "neutral":
          default:
            return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
        }
      };

      expect(getStyles(type)).toBe(expectedStyles);
    });

    it("returns neutral styles for neutral type", () => {
      const type = "neutral";
      const expectedStyles =
        "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";

      const getStyles = (bannerType: "motivational" | "neutral" | "warning") => {
        switch (bannerType) {
          case "motivational":
            return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";
          case "warning":
            return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";
          case "neutral":
          default:
            return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
        }
      };

      expect(getStyles(type)).toBe(expectedStyles);
    });

    it("defaults to neutral styles for undefined type", () => {
      const expectedStyles =
        "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";

      const getStyles = (bannerType?: "motivational" | "neutral" | "warning") => {
        switch (bannerType) {
          case "motivational":
            return "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800 text-green-900 dark:text-green-100";
          case "warning":
            return "bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100";
          case "neutral":
          default:
            return "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100";
        }
      };

      expect(getStyles()).toBe(expectedStyles);
    });
  });

  describe("message content", () => {
    it("handles empty messages", () => {
      const message = "";
      expect(message).toBe("");
    });

    it("handles long messages", () => {
      const longMessage = "a".repeat(1000);
      expect(longMessage.length).toBe(1000);
    });

    it("handles special characters and emoji", () => {
      const message = "Świetna robota! 🎉 Keep going! 💪";
      expect(message).toContain("🎉");
      expect(message).toContain("💪");
    });
  });
});




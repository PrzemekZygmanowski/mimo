import { describe, expect, it } from "vitest";
import { z } from "zod";

// Replikujemy schemat walidacji z CheckInForm do testowania
const checkInSchema = z.object({
  mood_level: z.number({ required_error: "Wybierz poziom nastroju" }).int().min(1).max(5),
  energy_level: z.number({ required_error: "Wybierz poziom energii" }).int().min(1).max(3),
  notes: z.string().max(500, "Notatki mogą mieć maksymalnie 500 znaków").optional().or(z.literal("")),
});

describe("CheckInForm - Walidacja Zod Schema", () => {
  describe("mood_level", () => {
    it("akceptuje wartości od 1 do 5", () => {
      expect(() => checkInSchema.parse({ mood_level: 1, energy_level: 1 })).not.toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2 })).not.toThrow();
      expect(() => checkInSchema.parse({ mood_level: 5, energy_level: 3 })).not.toThrow();
    });

    it("odrzuca wartości poza zakresem 1-5", () => {
      expect(() => checkInSchema.parse({ mood_level: 0, energy_level: 1 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: 6, energy_level: 1 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: -1, energy_level: 1 })).toThrow();
    });

    it("wymaga wartości (nie może być undefined)", () => {
      expect(() => checkInSchema.parse({ energy_level: 1 })).toThrow("Wybierz poziom nastroju");
    });

    it("odrzuca wartości niecałkowite", () => {
      expect(() => checkInSchema.parse({ mood_level: 2.5, energy_level: 1 })).toThrow();
    });
  });

  describe("energy_level", () => {
    it("akceptuje wartości od 1 do 3", () => {
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 1 })).not.toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2 })).not.toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 3 })).not.toThrow();
    });

    it("odrzuca wartości poza zakresem 1-3", () => {
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 0 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 4 })).toThrow();
    });

    it("wymaga wartości (nie może być undefined)", () => {
      expect(() => checkInSchema.parse({ mood_level: 3 })).toThrow("Wybierz poziom energii");
    });

    it("odrzuca wartości niecałkowite", () => {
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 1.5 })).toThrow();
    });
  });

  describe("notes", () => {
    it("akceptuje puste notatki", () => {
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2, notes: "" })).not.toThrow();
    });

    it("akceptuje brak notatek (undefined)", () => {
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2 })).not.toThrow();
    });

    it("akceptuje notatki do 500 znaków", () => {
      const validNotes = "a".repeat(500);
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2, notes: validNotes })).not.toThrow();
    });

    it("odrzuca notatki dłuższe niż 500 znaków", () => {
      const tooLongNotes = "a".repeat(501);
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2, notes: tooLongNotes })).toThrow(
        "Notatki mogą mieć maksymalnie 500 znaków"
      );
    });

    it("akceptuje notatki ze znakami specjalnymi i emoji", () => {
      const specialNotes = "Test 123 !@# €$% 😊🎉";
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 2, notes: specialNotes })).not.toThrow();
    });
  });

  describe("pełna walidacja formularza", () => {
    it("akceptuje kompletny i poprawny formularz", () => {
      const validData = {
        mood_level: 4,
        energy_level: 2,
        notes: "Czuję się dobrze dzisiaj",
      };
      expect(() => checkInSchema.parse(validData)).not.toThrow();
    });

    it("akceptuje formularz bez notatek", () => {
      const validData = {
        mood_level: 3,
        energy_level: 1,
      };
      expect(() => checkInSchema.parse(validData)).not.toThrow();
    });

    it("zwraca przetworzone dane z pustymi notatkami jako ''", () => {
      const result = checkInSchema.parse({ mood_level: 3, energy_level: 2, notes: "" });
      expect(result.notes).toBe("");
    });

    it("zachowuje wartości notatek jeśli są podane", () => {
      const notes = "Moje notatki";
      const result = checkInSchema.parse({ mood_level: 3, energy_level: 2, notes });
      expect(result.notes).toBe(notes);
    });
  });

  describe("przypadki brzegowe", () => {
    it("odrzuca ujemne wartości", () => {
      expect(() => checkInSchema.parse({ mood_level: -1, energy_level: 1 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: -1 })).toThrow();
    });

    it("odrzuca wartości tekstowe zamiast liczbowych", () => {
      expect(() => checkInSchema.parse({ mood_level: "3", energy_level: 2 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: "2" })).toThrow();
    });

    it("odrzuca null jako wartości", () => {
      expect(() => checkInSchema.parse({ mood_level: null, energy_level: 2 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: null })).toThrow();
    });

    it("odrzuca bardzo duże liczby", () => {
      expect(() => checkInSchema.parse({ mood_level: 1000, energy_level: 2 })).toThrow();
      expect(() => checkInSchema.parse({ mood_level: 3, energy_level: 100 })).toThrow();
    });
  });
});

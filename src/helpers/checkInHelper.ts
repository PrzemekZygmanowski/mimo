import type { Database } from "../db/database.types";

// Typy dla odpowiedzi API
export interface DailyCheckInResponse {
  checkInId: string;
  assignedTask: {
    taskId: string;
    taskDetails: string;
    message: string;
  };
}

// Przykładowa logika generowania wiadomości na podstawie poziomu energii
function generateTaskMessage(energyLevel: number): string {
  // Logika może być bardziej rozbudowana – tutaj przykład prostego warunku
  return energyLevel < 2
    ? "Based on your energy, we suggest a light activity."
    : "Based on your energy, we suggest a light activity.";
}

// Funkcja agregująca dane i przekształcająca pola
export function transformDailyCheckinResponse(
  checkIn: Database["public"]["Tables"]["check_ins"]["Row"],
  userTask: Database["public"]["Tables"]["user_tasks"]["Row"],
  taskTemplate: Database["public"]["Tables"]["task_templates"]["Row"]
): DailyCheckInResponse {
  return {
    checkInId: checkIn.id.toString(),
    assignedTask: {
      taskId: userTask.id.toString(),
      // Używamy tytułu lub opisu z task_templates jako szczegóły zadania
      taskDetails: taskTemplate.title || taskTemplate.description || "",
      message: generateTaskMessage(checkIn.energy_level),
    },
  };
}

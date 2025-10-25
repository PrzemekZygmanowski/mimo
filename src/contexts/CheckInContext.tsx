import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { UserTaskDTO } from "../types";

export interface CheckInContextValue {
  activeTask: UserTaskDTO | null;
  isLoading: boolean;
  error: string | null;
  refreshActiveTask: () => Promise<void>;
}

const CheckInContext = createContext<CheckInContextValue | undefined>(undefined);

interface CheckInProviderProps {
  children: ReactNode;
}

export function CheckInProvider({ children }: CheckInProviderProps) {
  const [activeTask, setActiveTask] = useState<UserTaskDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshActiveTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Fetch active tasks for today
      const response = await fetch(`/api/user-tasks?status=active&date=${today}`);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Unauthorized");
        }
        throw new Error("Failed to fetch active task");
      }

      const tasks: UserTaskDTO[] = await response.json();

      // Set the first active task for today, or null if none exists
      setActiveTask(tasks.length > 0 ? tasks[0] : null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      setActiveTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshActiveTask();
  }, []);

  const value: CheckInContextValue = {
    activeTask,
    isLoading,
    error,
    refreshActiveTask,
  };

  return <CheckInContext.Provider value={value}>{children}</CheckInContext.Provider>;
}

export function useCheckIn() {
  const context = useContext(CheckInContext);

  if (context === undefined) {
    throw new Error("useCheckIn must be used within a CheckInProvider");
  }

  return context;
}

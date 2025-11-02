import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { TaskTemplateDTO, TaskViewModel, UserTaskDTO } from "../types";

const MAX_DAILY_TASK_REQUESTS = 3;

export interface TaskContextValue {
  task: TaskViewModel | null;
  isLoading: boolean;
  error: string | null;
  refreshTask: () => Promise<void>;
  completeTask: (taskId: number) => Promise<void>;
  skipTask: (taskId: number) => Promise<void>;
  requestNewTask: (taskId: number) => Promise<void>;
}

const TaskContext = createContext<TaskContextValue | undefined>(undefined);

interface TaskProviderProps {
  children: ReactNode;
}

// Helper function to map UserTaskDTO + TaskTemplateDTO to TaskViewModel
function mapToTaskViewModel(userTask: UserTaskDTO, template: TaskTemplateDTO): TaskViewModel {
  const expirationTime = new Date(userTask.expires_at);
  const isExpired = expirationTime.getTime() < Date.now();
  const remainingRequests = MAX_DAILY_TASK_REQUESTS - userTask.new_task_requests;

  return {
    id: userTask.id,
    template_id: userTask.template_id,
    title: template.title,
    description: template.description || "",
    expires_at: userTask.expires_at,
    status: userTask.status as "pending" | "completed" | "skipped",
    new_task_requests: userTask.new_task_requests,
    expirationTime,
    remainingRequests,
    isExpired,
  };
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [task, setTask] = useState<TaskViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Get today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Fetch active task for today
      const tasksResponse = await fetch(`/api/user-tasks?status=pending&date=${today}`);

      if (!tasksResponse.ok) {
        if (tasksResponse.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Nie udało się pobrać zadania");
      }

      const tasks: UserTaskDTO[] = await tasksResponse.json();

      if (tasks.length === 0) {
        setTask(null);
        return;
      }

      const userTask = tasks[0];

      // Fetch template details for the task
      const templateResponse = await fetch(`/api/task-templates?id=${userTask.template_id}`);

      if (!templateResponse.ok) {
        throw new Error("Nie udało się pobrać szczegółów zadania");
      }

      const templates: TaskTemplateDTO[] = await templateResponse.json();
      const template = templates[0];

      if (!template) {
        throw new Error("Nie znaleziono szablonu zadania");
      }

      // Map to view model
      const viewModel = mapToTaskViewModel(userTask, template);
      setTask(viewModel);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setError(errorMessage);
      setTask(null);
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (taskId: number) => {
    try {
      // Update task status
      const response = await fetch(`/api/user-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Nie udało się ukończyć zadania");
      }

      // Log event
      await fetch("/api/user-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "TASK_DONE",
          entity_id: taskId,
        }),
      });

      // Update plants progress (reward)
      // This should be handled by the backend, but if needed client-side:
      // await fetch("/api/plants-progress", { method: "PATCH", ... });

      // Refresh task to get updated state
      await refreshTask();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setError(errorMessage);
      throw err;
    }
  };

  const skipTask = async (taskId: number) => {
    try {
      // Update task status
      const response = await fetch(`/api/user-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "skipped" }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Nie udało się pominąć zadania");
      }

      // Log event
      await fetch("/api/user-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "TASK_SKIPPED",
          entity_id: taskId,
        }),
      });

      // Refresh task to get updated state
      await refreshTask();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setError(errorMessage);
      throw err;
    }
  };

  const requestNewTask = async (taskId: number) => {
    try {
      if (!task) {
        throw new Error("Brak aktywnego zadania");
      }

      if (task.remainingRequests <= 0) {
        throw new Error("Osiągnięto limit 3 nowych zadań dziennie");
      }

      // Increment new_task_requests counter
      const newRequestCount = task.new_task_requests + 1;

      const response = await fetch(`/api/user-tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ new_task_requests: newRequestCount }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Osiągnięto limit nowych zadań");
        }
        throw new Error("Nie udało się pobrać nowego zadania");
      }

      // Log event
      await fetch("/api/user-events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          event_type: "REQUEST_NEW",
          entity_id: taskId,
        }),
      });

      // Refresh task to get new task
      await refreshTask();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setError(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    refreshTask();
  }, []);

  const value: TaskContextValue = {
    task,
    isLoading,
    error,
    refreshTask,
    completeTask,
    skipTask,
    requestNewTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTask() {
  const context = useContext(TaskContext);

  if (context === undefined) {
    throw new Error("useTask must be used within a TaskProvider");
  }

  return context;
}

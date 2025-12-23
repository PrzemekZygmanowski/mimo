import { TaskProvider } from "../contexts/TaskContext";
import TaskPage from "./TaskPage";

/**
 * Wrapper component that provides TaskContext to TaskPage
 * This is necessary because Astro hydrates each component with client:* directive
 * as a separate React island, so context can't be shared across separate islands.
 */
export default function TaskPageWrapper() {
  return (
    <TaskProvider>
      <TaskPage />
    </TaskProvider>
  );
}


import { useState } from "react";
import { useTask } from "../contexts/TaskContext";
import type { TaskViewModel } from "../types";
import ExpirationTimer from "./ExpirationTimer";
import MessageBanner from "./MessageBanner";
import TaskActions from "./TaskActions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

interface TaskCardProps {
  task: TaskViewModel;
  onError: (error: string | null) => void;
}

export default function TaskCard({ task, onError }: TaskCardProps) {
  const { completeTask, skipTask, requestNewTask } = useTask();
  const [isExecuting, setIsExecuting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isRequestingNew, setIsRequestingNew] = useState(false);
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  const handleExecute = async () => {
    setIsExecuting(true);
    onError(null);

    try {
      await completeTask(task.id);
      // Success is handled by context refresh
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się ukończyć zadania";
      onError(message);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleSkipConfirm = async () => {
    setIsSkipping(true);
    onError(null);
    setShowSkipConfirmation(false);

    try {
      await skipTask(task.id);
      // Success is handled by context refresh
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się pominąć zadania";
      onError(message);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleRequestNew = async () => {
    setIsRequestingNew(true);
    onError(null);

    try {
      await requestNewTask(task.id);
      // Success is handled by context refresh
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nie udało się pobrać nowego zadania";
      onError(message);
    } finally {
      setIsRequestingNew(false);
    }
  };

  const getMotivationalMessage = () => {
    if (task.remainingRequests === 0) {
      return {
        message: "To Twoje ostatnie zadanie na dziś. Wykorzystaj je mądrze!",
        type: "warning" as const,
      };
    }

    const messages = [
      "Małe kroki prowadzą do wielkich zmian! 🌱",
      "Każde zadanie to krok ku lepszej wersji siebie! ✨",
      "Jesteś na dobrej drodze! Kontynuuj! 💪",
      "Pamiętaj - postęp jest ważniejszy niż perfekcja! 🎯",
    ];

    return {
      message: messages[Math.floor(Math.random() * messages.length)],
      type: "motivational" as const,
    };
  };

  const motivationalMessage = getMotivationalMessage();

  return (
    <Card className='w-full'>
      <CardHeader>
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1'>
            <CardTitle className='text-2xl mb-2'>{task.title}</CardTitle>
            <CardDescription>{task.description}</CardDescription>
          </div>
        </div>
        <div className='mt-4'>
          <ExpirationTimer expirationTime={task.expirationTime} />
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        <MessageBanner message={motivationalMessage.message} type={motivationalMessage.type} />

        <TaskActions
          taskId={task.id}
          remainingRequests={task.remainingRequests}
          isExpired={task.isExpired}
          isExecuting={isExecuting}
          isSkipping={isSkipping}
          isRequestingNew={isRequestingNew}
          showSkipConfirmation={showSkipConfirmation}
          onExecute={handleExecute}
          onSkip={() => setShowSkipConfirmation(true)}
          onSkipConfirm={handleSkipConfirm}
          onSkipCancel={() => setShowSkipConfirmation(false)}
          onRequestNew={handleRequestNew}
        />

        {task.remainingRequests > 0 && (
          <div className='text-xs text-muted-foreground text-center'>
            Pozostałe żądania nowych zadań: {task.remainingRequests}/3
          </div>
        )}
      </CardContent>
    </Card>
  );
}

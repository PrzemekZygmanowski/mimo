import { useState } from "react";
import { useTask } from "../contexts/TaskContext";
import TaskCard from "./TaskCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function TaskPage() {
  const { task, isLoading, error, refreshTask } = useTask();
  const [actionError, setActionError] = useState<string | null>(null);

  const handleRefresh = () => {
    setActionError(null);
    refreshTask();
  };

  const renderContent = () => {
    const states = {
      loading: (
        <Card className='w-full max-w-2xl'>
          <CardContent className='pt-6'>
            <p className='text-center text-muted-foreground'>Ładowanie zadania...</p>
          </CardContent>
        </Card>
      ),

      error: (
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle className='text-destructive'>Błąd</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleRefresh}>Spróbuj ponownie</Button>
          </CardContent>
        </Card>
      ),

      noTask: (
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle>Brak aktywnego zadania</CardTitle>
            <CardDescription>Nie masz obecnie przypisanego żadnego zadania na dziś.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p className='text-sm text-muted-foreground'>
              Wykonaj check-in, aby otrzymać spersonalizowane zadanie dopasowane do Twojego nastroju i energii.
            </p>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button onClick={() => (window.location.href = "/checkin")}>Wykonaj Check-In</Button>
              <Button onClick={() => (window.location.href = "/")} variant='outline'>
                Wróć do strony głównej
              </Button>
            </div>
          </CardContent>
        </Card>
      ),

      taskExpired: task && (
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle>Zadanie wygasło</CardTitle>
            <CardDescription>To zadanie już wygasło.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='p-4 bg-muted rounded-md'>
              <h3 className='font-semibold mb-1'>{task.title}</h3>
              <p className='text-sm text-muted-foreground'>{task.description}</p>
              <p className='text-xs text-muted-foreground mt-2'>
                Wygasło: {task.expirationTime.toLocaleString("pl-PL")}
              </p>
            </div>
            <p className='text-sm text-muted-foreground'>Wykonaj nowy check-in, aby otrzymać kolejne zadanie.</p>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button onClick={() => (window.location.href = "/checkin")}>Wykonaj Check-In</Button>
              <Button onClick={() => (window.location.href = "/")} variant='outline'>
                Wróć do strony głównej
              </Button>
            </div>
          </CardContent>
        </Card>
      ),

      taskCompleted: task && (
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle className='text-green-600'>Zadanie ukończone! 🎉</CardTitle>
            <CardDescription>Gratulacje! Wykonałeś dzisiejsze zadanie.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='p-4 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800'>
              <h3 className='font-semibold mb-1'>{task.title}</h3>
              <p className='text-sm text-muted-foreground'>{task.description}</p>
            </div>
            <p className='text-sm text-muted-foreground'>Wróć jutro, aby otrzymać kolejne zadanie!</p>
            <Button onClick={() => (window.location.href = "/")} variant='outline'>
              Wróć do strony głównej
            </Button>
          </CardContent>
        </Card>
      ),

      taskSkipped: task && (
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle>Zadanie pominięte</CardTitle>
            <CardDescription>To zadanie zostało pominięte.</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='p-4 bg-muted rounded-md'>
              <h3 className='font-semibold mb-1'>{task.title}</h3>
              <p className='text-sm text-muted-foreground'>{task.description}</p>
            </div>
            <p className='text-sm text-muted-foreground'>Wykonaj nowy check-in, aby otrzymać inne zadanie.</p>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Button onClick={() => (window.location.href = "/checkin")}>Wykonaj Check-In</Button>
              <Button onClick={() => (window.location.href = "/")} variant='outline'>
                Wróć do strony głównej
              </Button>
            </div>
          </CardContent>
        </Card>
      ),

      activeTask: task && (
        <div className='w-full max-w-2xl'>
          {actionError && (
            <div className='mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm' role='alert'>
              {actionError}
            </div>
          )}
          <TaskCard task={task} onError={setActionError} />
        </div>
      ),
    };

    if (isLoading) return states.loading;
    if (error) return states.error;
    if (!task) return states.noTask;

    // Check task status
    if (task.status === "completed") return states.taskCompleted;
    if (task.status === "skipped") return states.taskSkipped;
    if (task.isExpired) return states.taskExpired;

    // Active pending task
    return states.activeTask;
  };

  return <div className='flex items-center justify-center min-h-screen p-4'>{renderContent()}</div>;
}

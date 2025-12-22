import { useState } from "react";
import { useCheckIn } from "../contexts/CheckInContext";
import type { CreateCheckInCommand } from "../types";
import { CheckInForm } from "./CheckInForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function CheckInPage() {
  const { activeTask, isLoading, error, refreshActiveTask } = useCheckIn();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCheckInSubmit = async (data: CreateCheckInCommand) => {
    setSubmitError(null);

    try {
      const response = await fetch("/api/checkins", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Musisz być zalogowany aby wykonać check-in");
        }
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Nieprawidłowe dane");
        }
        throw new Error("Nie udało się wykonać check-inu");
      }

      // Success - przekierowanie do strony głównej lub odświeżenie
      await refreshActiveTask();
      window.location.href = "/";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Wystąpił nieznany błąd";
      setSubmitError(message);
      throw err; // Re-throw aby CheckInForm mógł też obsłużyć błąd
    }
  };

  const renderContent = () => {
    const states = {
      loading: (
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <p className='text-center text-muted-foreground'>Ładowanie...</p>
          </CardContent>
        </Card>
      ),

      error: (
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-destructive'>Błąd</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()}>Spróbuj ponownie</Button>
          </CardContent>
        </Card>
      ),

      activeTask: (
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle>Masz już aktywne zadanie</CardTitle>
            <CardDescription>Nie możesz wykonać check-inu, gdy masz aktywne zadanie.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground mb-4'>
              Zadanie wygasa: {activeTask?.expires_at ? new Date(activeTask.expires_at).toLocaleString("pl-PL") : ""}
            </p>
            <Button onClick={() => (window.location.href = "/")} variant='outline'>
              Wróć do strony głównej
            </Button>
          </CardContent>
        </Card>
      ),

      default: (
        <Card className='w-full max-w-2xl'>
          <CardHeader>
            <CardTitle className='text-3xl'>Check-In</CardTitle>
            <CardDescription>Powiedz nam, jak się czujesz, aby otrzymać spersonalizowane zadanie</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-col items-center'>
            {submitError && (
              <div className='mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm w-full max-w-md'>
                {submitError}
              </div>
            )}
            <CheckInForm onSubmit={handleCheckInSubmit} />
          </CardContent>
        </Card>
      ),
    };

    if (isLoading) return states.loading;
    if (error) return states.error;
    if (activeTask) return states.activeTask;
    return states.default;
  };

  return <div className='flex items-center justify-center min-h-screen p-4'>{renderContent()}</div>;
}

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

interface TaskActionsProps {
  taskId: number;
  remainingRequests: number;
  isExpired: boolean;
  isExecuting: boolean;
  isSkipping: boolean;
  isRequestingNew: boolean;
  showSkipConfirmation: boolean;
  onExecute: () => void;
  onSkip: () => void;
  onSkipConfirm: () => void;
  onSkipCancel: () => void;
  onRequestNew: () => void;
}

export default function TaskActions({
  remainingRequests,
  isExpired,
  isExecuting,
  isSkipping,
  isRequestingNew,
  showSkipConfirmation,
  onExecute,
  onSkip,
  onSkipConfirm,
  onSkipCancel,
  onRequestNew,
}: TaskActionsProps) {
  const isAnyActionInProgress = isExecuting || isSkipping || isRequestingNew;
  const canRequestNew = remainingRequests > 0;

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Execute Button */}
        <Button
          onClick={onExecute}
          disabled={isExpired || isAnyActionInProgress}
          className="flex-1"
          aria-label="Wykonaj zadanie"
        >
          {isExecuting ? "Wykonywanie..." : "Wykonaj zadanie"}
        </Button>

        {/* Skip Button */}
        <Button
          onClick={onSkip}
          disabled={isExpired || isAnyActionInProgress}
          variant="outline"
          className="flex-1"
          aria-label="Pomiń zadanie"
        >
          {isSkipping ? "Pomijanie..." : "Pomiń"}
        </Button>

        {/* Request New Button */}
        <Button
          onClick={onRequestNew}
          disabled={!canRequestNew || isExpired || isAnyActionInProgress}
          variant="secondary"
          className="flex-1"
          aria-label={
            canRequestNew ? `Pobierz nowe zadanie (${remainingRequests} pozostałych)` : "Osiągnięto limit nowych zadań"
          }
          title={!canRequestNew ? "Osiągnięto dzienny limit 3 nowych zadań" : undefined}
        >
          {isRequestingNew ? "Pobieranie..." : "Nowe zadanie"}
        </Button>
      </div>

      {/* Skip Confirmation Modal */}
      <AlertDialog open={showSkipConfirmation} onOpenChange={(open) => !open && onSkipCancel()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pominąć zadanie?</AlertDialogTitle>
            <AlertDialogDescription>
              Czy na pewno chcesz pominąć to zadanie? Będziesz musiał wykonać nowy check-in, aby otrzymać kolejne
              zadanie.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onSkipCancel}>Nie, wróć</AlertDialogCancel>
            <AlertDialogAction
              onClick={onSkipConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Tak, pomiń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limit Reached Information Modal */}
      {!canRequestNew && (
        <div className="text-center text-sm text-muted-foreground mt-2">Osiągnąłeś dzienny limit 3 nowych zadań</div>
      )}
    </>
  );
}

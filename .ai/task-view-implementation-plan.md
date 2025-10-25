# Plan implementacji widoku Task

## 1. Przegląd

Widok `/task` służy do prezentacji aktualnie przypisanego zadania użytkownika, umożliwiając jego wykonanie, pominięcie lub pobranie nowego zadania, z zachowaniem limitu 3 nowych żądań dziennie.

## 2. Routing widoku

Ścieżka: `/task`

## 3. Struktura komponentów

- TaskPage
  - TaskCard
    - ExpirationTimer
    - MessageBanner
    - TaskActions
  - ConfirmationModal
  - ToastContainer

## 4. Szczegóły komponentów

### TaskPage

- Opis: Strona główna widoku z logiką fetch i zarządzania stanem.
- Główne elementy:
  • `<TaskCard />`
  • `<ConfirmationModal />`
  • `<ToastContainer />`
- Obsługiwane interakcje: inicjalne pobranie zadania, odświeżanie po mutacjach.
- Walidacja: sprawdzenie 401 → redirect, 400/500 → toast.

### TaskCard

- Opis: Wyświetla treść, instrukcje, czas do wygaśnięcia i komunikat.
- Główne elementy:
  • `<h1>` tytuł zadania
  • `<p>` opis/instrukcje
  • `<ExpirationTimer />`
  • `<MessageBanner />`
- Obsługiwane zdarzenia: brak (logika w TaskActions).
- Walidacja: jeśli zadanie wygasło lub status≠pending, ukryj przyciski.
- Typy: `TaskViewModel`
- Propsy: `task: TaskViewModel`

### ExpirationTimer

- Opis: Odlicza czas pozostały do wygaśnięcia.
- Elementy: `<time>` z ARIA live region.
- Walidacja: wywołanie callback po wygaśnięciu.

### MessageBanner

- Opis: Wyświetla motywacyjny lub neutralny tekst.
- Elementy: `<div role="status">`
- Propsy: `message: string; type: 'motivational' | 'neutral'`

### TaskActions

- Opis: Przyciski Execute, Skip, New.
- Elementy: trzy `<button>` z ARIA labels.
- Obsługiwane zdarzenia:
  • onExecute()
  • onSkip() → otwarcie modalu
  • onRequestNew()
- Walidacja:
  • Execute/Skip disabled gdy isExpired lub mutacja w toku
  • New disabled gdy remainingRequests==0
- Propsy:
  • `taskId: number`
  • `remainingRequests: number`
  • callbacki: `onExecute()`, `onSkip()`, `onRequestNew()`

### ConfirmationModal

- Opis: Modal potwierdzający skip lub informujący o limicie.
- Elementy: `<Dialog>` z trapFocus, dwa przyciski (Confirm, Cancel).
- Propsy: `isOpen: boolean; title: string; message: string; onConfirm(); onCancel()`

### ToastContainer

- Opis: Wyświetla toasty z feedbackiem.
- Elementy: lista `<Toast>` z automatycznym ukrywaniem.
- Obsługiwane interakcje: zamykanie toastu.

## 5. Typy

```ts
interface TaskViewModel {
  id: number;
  template_id: number;
  expires_at: string;
  status: "pending" | "completed" | "skipped";
  new_task_requests: number;
  expirationTime: Date;
  remainingRequests: number;
  isExpired: boolean;
}
```

Typy akcji:

```ts
type UpdateTaskStatus = { status: "completed" | "skipped" };
type RequestNewTask = { new_task_requests: number };
```

## 6. Zarządzanie stanem

- useTask(): React-Query GET `/api/user-tasks` → TaskViewModel
- useTaskActions(): React-Query mutations:
  • completeTask
  • skipTask
  • requestNewTask
  – każdy łączy PATCH `/api/user-tasks`, POST `/api/user-events`, opcjonalnie PATCH `/api/plants-progress`

## 7. Integracja API

- GET `/api/user-tasks` → `TaskViewModel`
- PATCH `/api/user-tasks/:id`
  • Body: `{ status }` lub `{ new_task_requests }`
- POST `/api/user-events` → logowanie: `TASK_DONE`, `TASK_SKIPPED`, `REQUEST_NEW`
- PATCH `/api/plants-progress` po complete → body: `{ board_state }`

## 8. Interakcje użytkownika

1. Klik „Wykonaj” → mutation complete → toast „Zadanie ukończone” → update ogród
2. Klik „Pomiń” → otwórz modal → potwierdź → mutation skip → toast „Zadanie pominięte”
3. Klik „Nowe zadanie” → jeśli requests>0 → mutation new → toast „Pobrano nowe zadanie”
4. Klik „Nowe zadanie” przy limicie=0 → modal „Osiągnięto limit 3 nowych zadań”

## 9. Warunki i walidacja

- Blokada akcji: isExpired || status≠pending
- Blokada new: remainingRequests===0
- Obsługa 400 limit: świadomy modal
- ARIA: role, aria-live, labels

## 10. Obsługa błędów

- 401: redirect do `/login`
- 400: modal informujący lub toast
- 500: toast „Błąd serwera, spróbuj ponownie”

## 11. Kroki implementacji

1. Utworzyć plik `src/pages/task.astro` z routingu i ramką React.
2. Zaimplementować hooki `useTask` i `useTaskActions`.
3. Stworzyć komponenty: TaskCard, ExpirationTimer, MessageBanner, TaskActions, ConfirmationModal, ToastContainer.
4. Zdefiniować typ `TaskViewModel` i mapper z DTO.
5. Dodać integrację z API (React-Query).
6. Stylować komponenty za pomocą Tailwind + Shadcn/ui.
7. Zapewnić dostępność (ARIA, focus trap).
8. Napisać testy jednostkowe i integracyjne dla widoku.
9. Przeprowadzić code review i wdrożyć.

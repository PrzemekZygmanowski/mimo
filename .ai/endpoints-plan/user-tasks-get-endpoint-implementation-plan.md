# API Endpoint Implementation Plan: GET /api/user-tasks/:id

## 1. Przegląd punktu końcowego

Endpoint umożliwia pobranie szczegółów zadania użytkownika na podstawie jego identyfikatora. Jego głównym celem jest zwrócenie danych zadania, w tym informacji o użytkowniku, szablonie zadania, statusie, terminie wygaśnięcia i liczbie nowych żądań zadania.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** /api/user-tasks/:id
- **Parametry:**
  - **Wymagane:**
    - `id` (parametr ścieżki): identyfikator zadania, typu liczbowego (BIGSERIAL)
  - **Opcjonalne:** brak
- **Request Body:** Brak

## 3. Wykorzystywane typy

- **UserTaskDTO:**
  ```typescript
  export interface UserTaskDTO {
    id: number;
    check_in_id?: number | null;
    created_at: string | null;
    expires_at: string;
    metadata?: Json | null;
    new_task_requests: number;
    status: string;
    task_date: string;
    template_id: number;
    updated_at?: string | null;
    user_id: string;
  }
  ```

## 4. Szczegóły odpowiedzi

- **Status 200 OK:** Zwrot szczegółów zadania w formacie JSON, przykładowa struktura:
  ```json
  {
    "id": 123,
    "user_id": "user-id",
    "template_id": 456,
    "expires_at": "2025-10-13T12:05:00Z",
    "status": "pending",
    "new_task_requests": 0
  }
  ```
- Inne kody statusu:
  - **400 Bad Request:** Gdy parametr `id` jest nieprawidłowy.
  - **401 Unauthorized:** Gdy użytkownik nie jest uwierzytelniony.
  - **404 Not Found:** Gdy zadanie o podanym `id` nie zostało znalezione.
  - **500 Internal Server Error:** W przypadku błędów po stronie serwera.

## 5. Przepływ danych

1. Odebranie żądania GET z parametrem `id`.
2. Walidacja parametru `id` (czy jest poprawnym numerem).
3. Uwierzytelnienie użytkownika (sprawdzenie kontekstu Supabase lub innego mechanizmu autoryzacji).
4. Zapytanie do bazy danych o zadanie o podanym `id`, powiązane z zalogowanym użytkownikiem.
5. Jeżeli zadanie zostanie znalezione, zwrócenie danych w formacie JSON; w przeciwnym razie zwrócenie błędu 404.

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Sprawdzenie, czy użytkownik jest zalogowany i ma uprawnienia do przeglądania zadania.
- **Autoryzacja:** Upewnienie się, że pobierane zadanie należy do uwierzytelnionego użytkownika (porównanie `user_id`).
- **Walidacja danych:** Sprawdzenie poprawności formatu `id` oraz sanityzacja danych wejściowych.

## 7. Obsługa błędów

- **400 Bad Request:** Kiedy parametr `id` nie jest poprawnym numerem.
- **401 Unauthorized:** W przypadku braku prawidłowej autoryzacji użytkownika.
- **404 Not Found:** Gdy zadanie o podanym `id` nie istnieje lub nie należy do aktualnego użytkownika.
- **500 Internal Server Error:** Obsługa nieprzewidzianych błędów, zapisywanie szczegółowych logów błędów dla dalszej analizy.

## 8. Rozważania dotyczące wydajności

- Użycie indeksów w tabeli `user_tasks` (głównie po kolumnie `id`) zapewnia szybkie wyszukiwanie.
- Optymalizacja zapytań SQL oraz wykorzystywanie warstwy cache, jeśli to konieczne.
- Monitorowanie przeciążeń bazy danych w przypadku dużej liczby żądań.

## 9. Etapy wdrożenia

1. **Stworzenie handlera endpointu:** Utworzenie pliku w `src/pages/api/user-tasks/[id].ts` lub odpowiedniego dla Astro endpointu.
2. **Walidacja parametrów:** Implementacja walidacji parametru `id` jako liczby.
3. **Uwierzytelnienie użytkownika:** Integracja z mechanizmem autoryzacji (np. Supabase) w celu weryfikacji tożsamości użytkownika.
4. **Implementacja logiki biznesowej:** Wyodrębnienie zapytań do nowej lub istniejącej warstwy serwisowej, która dokonuje pobrania danych z bazy.
5. **Obsługa błędów:** Dodanie mechanizmów przechwytywania i logowania błędów, zgodnie z zasadami implementacji.
6. **Testy:** Przeprowadzenie testów jednostkowych i integracyjnych, aby upewnić się, że endpoint działa zgodnie z oczekiwaniami.
7. **Dokumentacja:** Uaktualnienie dokumentacji API oraz komentarzy w kodzie.
8. **Code Review i wdrożenie:** Przegląd przez zespół oraz wdrożenie zmian do środowiska produkcyjnego.

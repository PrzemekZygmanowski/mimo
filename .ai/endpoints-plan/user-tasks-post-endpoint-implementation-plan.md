# API Endpoint Implementation Plan: POST /api/user-tasks

## 1. Przegląd punktu końcowego

Endpoint służy do przypisywania nowego zadania użytkownikowi, wywoływanego po check-inie lub na żądanie ręczne. Jego celem jest utworzenie nowego rekordu w tabeli `user_tasks` oraz powiązanie go z odpowiednim zadaniem szablonowym (`task_templates`).

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** /api/user-tasks
- **Parametry:**
  - **Wymagane:**
    - `template_id` - identyfikator szablonu zadania (BIGINT)
    - `user_id` - identyfikator użytkownika (UUID)
  - **Opcjonalne:**
    - `check_in_id` - identyfikator check-inu (BIGINT), jeśli zadanie jest generowane w wyniku check-inu
- **Request Body:**
  ```json
  {
    "template_id": "template-id",
    "user_id": "user-id",
    "check_in_id": "checkin-id" // Opcjonalny
  }
  ```

## 3. Wykorzystywane typy

- **DTO:** `UserTaskDTO` – reprezentuje dane zadania, w tym pola: `id`, `user_id`, `template_id`, `expires_at`, `status`, `new_task_requests` oraz opcjonalnie `check_in_id` i `metadata`.
- **Command Model:** `CreateUserTaskCommand` – model dla tworzenia zadania, zawiera pola: `template_id`, `user_id`, opcjonalnie `check_in_id` oraz `task_date` (data zadania, zwykle dzisiejsza).

## 4. Szczegóły odpowiedzi

- **Kod sukcesu:** 201 Created
- **Body (przykład):**
  ```json
  {
    "id": "task-id",
    "user_id": "user-id",
    "template_id": "template-id",
    "expires_at": "2025-10-13T12:05:00Z",
    "status": "pending",
    "new_task_requests": 0
  }
  ```
- **Możliwe kody błędów:**
  - 400 Bad Request – dla nieprawidłowych danych wejściowych
  - 401 Unauthorized – dla nieautoryzowanego dostępu
  - 404 Not Found – gdy powiązane zasoby (np. użytkownik, szablon) nie zostaną znalezione
  - 500 Internal Server Error – w przypadku błędów po stronie serwera

## 5. Przepływ danych

1. Klient wysyła żądanie POST z danymi w formacie JSON.
2. Warstwa walidacji (najlepiej za pomocą Zod) sprawdza poprawność danych wejściowych zgodnie z regułami:
   - Sprawdzenie istnienia wymaganych pól (`template_id`, `user_id`)
   - Walidacja formatu UUID dla `user_id` oraz typu liczbowego dla `template_id` i opcjonalnie `check_in_id`
3. Usługa przetwarzająca żądanie (np. w `src/lib/services/userTasksService.ts`) wykonuje logikę:
   - Sprawdzenie, czy zasoby (użytkownik, szablon) istnieją
   - Obliczenie pola `expires_at` (np. na podstawie logiki biznesowej)
   - Ustawienie pola `task_date` na dzisiejszą datę
4. Zapis zadania do bazy danych, respektując ograniczenie unikalności (unikalne `(user_id, task_date)`)
5. Zwrócenie obiektu zadania w formacie JSON

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i autoryzacja:**
  - Endpoint powinien być dostępny wyłącznie dla uwierzytelnionych użytkowników
  - Sprawdzenie, czy identyfikator `user_id` odpowiada aktualnemu użytkownikowi (lub czy użytkownik ma uprawnienia do tworzenia zadania dla innego użytkownika)
- **Walidacja danych:**
  - Użycie Zod do walidacji danych wejściowych i zapobieganie atakom typu SQL Injection
- **Zasady RLS:**
  - Zastosowanie odpowiednich zasad Row Level Security w Supabase dla tabeli `user_tasks`

## 7. Obsługa błędów

- **Błędy klienta (400):**
  - Nieprawidłowe lub brakujące pola w żądaniu
  - Przekroczenie dozwolonej liczby żądań dla zadania (`new_task_requests`)
- **Błąd autoryzacji (401):**
  - Użytkownik niezalogowany lub brak dostępu
- **Błąd nieznalezienia zasobów (404):**
  - Nie znaleziono powiązanego użytkownika, szablonu lub check-inu
- **Błedy serwera (500):**
  - Problemy przy zapisie do bazy danych lub inna nieoczekiwana sytuacja
- **Logowanie błędów:**
  - Błędy powinny być logowane przy użyciu istniejącego mechanizmu logowania w `src/lib/logger.ts`.

## 8. Rozważania dotyczące wydajności

- Upewnić się, że operacje na bazie danych są zoptymalizowane poprzez korzystanie z indeksów (np. na kolumnach `user_id` i `task_date`).
- Rozważyć caching wyników w przypadku częstych zapytań dotyczących tego samego użytkownika lub szablonu.

## 9. Etapy wdrożenia

1. **Projektowanie walidacji:**
   - Zdefiniowanie schematu walidacji za pomocą Zod.
   - Testowanie poprawności danych wejściowych.

2. **Implementacja logiki:**
   - Utworzenie lub rozszerzenie serwisu (np. `src/lib/services/userTasksService.ts`) odpowiedzialnego za logikę przypisywania zadania.
   - Obsługa logiki biznesowej (ustalanie `expires_at`, `task_date`, sprawdzenie oczeń unikalności).

3. **Interakcja z bazą danych:**
   - Implementacja zapisu danych do tabeli `user_tasks` z odpowiednimi referencjami.
   - Uwzględnienie ograniczeń bazy danych (unikalność `(user_id, task_date)`).

4. **Bezpieczeństwo i walidacja:**
   - Integracja z mechanizmem autoryzacji, zgodnie z wytycznymi Supabase RLS.
   - Zastosowanie walidacji danych wejściowych przed zapisem.

5. **Obsługa błędów i logowanie:**
   - Dodanie odpowiedniego logowania błędów (użycie `src/lib/logger.ts`).
   - Testowanie scenariuszy błędów i odpowiednich kodów statusu.

6. **Testowanie endpointa:**
   - Testy jednostkowe i integracyjne dla nowego endpointa.
   - Weryfikacja poprawności odpowiedzi (201 Created oraz błędów 400, 401, 404, 500).

7. **Dokumentacja:**
   - Uaktualnienie dokumentacji API i wewnętrznych instrukcji.

8. **Code Review i wdrożenie:**
   - Przeprowadzenie code review przez zespół.
   - Wdrożenie endpointa na środowisko testowe oraz produkcyjne po akceptacji.

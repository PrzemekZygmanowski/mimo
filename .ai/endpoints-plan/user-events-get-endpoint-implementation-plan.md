# API Endpoint Implementation Plan: GET /api/user-events

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania logów zdarzeń dla uwierzytelnionego użytkownika. Udostępnia listę zdarzeń, takich jak zakończone zadania, rejestrację aktywności itp. Endpoint wykorzystuje dane z tabeli `user_events` w bazie danych Supabase.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** /api/user-events
- **Parametry:**
  - Wymagane: Żaden (identyfikacja użytkownika odbywa się na podstawie tokenu/kontekstu uwierzytelnienia)
  - Opcjonalne: Żaden
- **Request Body:** Brak

## 3. Wykorzystywane typy

- **UserEventDTO** - reprezentuje pojedyncze zdarzenie użytkownika (zawiera pola: id, user_id, event_type, occurred_at, payload, entity_id).
- (Opcjonalnie) **CreateUserEventCommand** - dla innych operacji, ale nie dla GET.

## 4. Szczegóły odpowiedzi

- **Status:**
  - 200 OK – logi zdarzeń zostały poprawnie pobrane
  - 401 Unauthorized – użytkownik nie jest uwierzytelniony
  - 500 Internal Server Error – błąd serwera podczas pobierania danych
- **Struktura odpowiedzi:**
  ```json
  [
    {
      "id": "event-id",
      "user_id": "user-id",
      "event_type": "TASK_DONE",
      "occurred_at": "2025-10-12T15:05:00Z",
      "payload": { "details": "Task completed successfully." }
    }
  ]
  ```

## 5. Przepływ danych

1. Żądanie przychodzi do endpointu GET /api/user-events.
2. Middleware uwierzytelniające sprawdza token lub sesję, pobierając identyfikator użytkownika.
3. Logika w warstwie service (np. `UserEventsService`) filtruje zdarzenia, wykonując zapytanie do tabeli `user_events` gdzie `user_id` równa się identyfikatorowi uwierzytelnionego użytkownika.
4. Wyniki są mapowane na strukturę `UserEventDTO` i zwracane jako JSON.

## 6. Względy bezpieczeństwa

- Uwierzytelnienie: Weryfikacja tożsamości użytkownika przed wykonaniem operacji (np. za pomocą tokena JWT lub mechanizmu sesji Supabase).
- Autoryzacja: Upewnij się, że tylko zdarzenia należące do danego użytkownika są zwracane.
- Ograniczenie dostępu: Endpoint powinien być chroniony mechanizmami RLS (Row Level Security) na poziomie bazy danych.

## 7. Obsługa błędów

- **401 Unauthorized:** Brak prawidłowego uwierzytelnienia. Zwróć komunikat "Brak autoryzacji".
- **500 Internal Server Error:** Występuje błąd podczas pobierania zdarzeń. Zarejestruj błąd (np. logowanie w `src/lib/logger.ts`) i zwróć komunikat "Wewnętrzny błąd serwera".
- Możliwe inne kody (np. 400 dla błędów walidacji) nie mają zastosowania, ponieważ żadne dane wejściowe nie są przetwarzane.

## 8. Rozważania dotyczące wydajności

- Upewnij się, że tabele bazy danych mają odpowiednie indeksy (np. indeks na `user_id` w tabeli `user_events`).
- Optymalizacja zapytań SQL, zwłaszcza przy dużej liczbie logów.
- Rozważ paginację, jeśli liczba zdarzeń jest bardzo duża.

## 9. Etapy wdrożenia

1. **Przygotowanie endpointu:** Utworzenie nowego pliku API w `src/pages/api/user-events.ts`.
2. **Uwierzytelnienie i autoryzacja:** Integracja z middleware oraz sprawdzenie tokena/sesji użytkownika.
3. **Implementacja logiki serwisowej:** Utworzenie lub rozszerzenie usługi `UserEventsService` odpowiedzialnej za komunikację z bazą danych, wykonanie zapytania do tabeli `user_events` filtrowanego po `user_id`.
4. **Mapowanie danych:** Konwersja wyniku zapytania do formatu `UserEventDTO`.
5. **Obsługa błędów:** Implementacja mechanizmów obsługi błędów i logowania (użycie np. `src/lib/logger.ts`).
6. **Testy:** Testowanie endpointu pod kątem uwierzytelnienia, poprawności danych oraz obsługi błędów.
7. **Dokumentacja:** Uaktualnienie dokumentacji API oraz README jeśli to konieczne.
8. **Przegląd i wdrożenie:** Code review i wdrożenie na środowisko testowe/produkcyjne.

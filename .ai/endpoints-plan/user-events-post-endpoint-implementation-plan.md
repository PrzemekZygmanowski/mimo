# API Endpoint Implementation Plan: POST /api/user-events

## 1. Przegląd punktu końcowego

Endpoint odpowiedzialny za rejestrowanie zdarzeń użytkownika, takich jak wykonanie zadania (TASK_DONE), pominięcie zadania (TASK_SKIPPED) lub utworzenie check-in (CHECKIN_CREATED). Punkt końcowy zapisuje zdarzenie w bazie danych, umożliwiając monitorowanie i analizę działań użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: /api/user-events
- **Parametry**:
  - **Wymagane**:
    - `event_type`: typ zdarzenia (np. TASK_DONE, TASK_SKIPPED, CHECKIN_CREATED)
    - `user_id`: identyfikator użytkownika (UUID)
  - **Opcjonalne**:
    - `entity_id`: identyfikator powiązanego zasobu (np. identyfikator zadania lub check-in), typ: BIGINT
    - `payload`: dodatkowe informacje w formacie JSON (np. szczegóły zdarzenia)
- **Request Body**:
  ```json
  {
    "event_type": "TASK_DONE",
    "user_id": "user-id",
    "entity_id": "entity-id",
    "payload": { "details": "Task completed successfully." }
  }
  ```

## 3. Wykorzystywane typy

- **DTO**: `UserEventDTO`
- **Command Model**: `CreateUserEventCommand` (definiowany jako Omit<UserEventDTO, "id" | "occurred_at">)

## 4. Szczegóły odpowiedzi

- **Response Body**: Zwracany JSON zawiera szczegóły utworzonego zdarzenia, w tym:
  - `id`: identyfikator zdarzenia (BIGSERIAL)
  - `user_id`: UUID użytkownika
  - `event_type`: typ zdarzenia
  - `occurred_at`: timestamp określający czas wystąpienia zdarzenia
  - `payload`: obiekt JSON zawierający dodatkowe informacje
- **Kody statusu**:
  - 201 Created – dla poprawnego utworzenia zdarzenia
  - 400 Bad Request – dla nieprawidłowych danych wejściowych
  - 401 Unauthorized – gdy użytkownik nie jest autoryzowany
  - 404 Not Found – gdy powiązany zasób nie zostanie znaleziony (jeśli dotyczy)
  - 500 Internal Server Error – w przypadku błędów po stronie serwera

## 5. Przepływ danych

1. Klient wysyła żądanie POST z danymi zdarzenia do endpointa /api/user-events.
2. Dane wejściowe są walidowane (sprawdzanie obowiązkowych pól, zakresów oraz typów danych zgodnych z modelem CreateUserEventCommand).
3. Po poprawnej walidacji, logika biznesowa przekazuje dane do warstwy serwisowej odpowiedzialnej za interakcję z bazą danych (użycie Supabase z odpowiednimi regułami RLS).
4. Zdarzenie jest zapisywane w tabeli `user_events`.
5. Zwracana jest odpowiedź JSON z danymi utworzonego zdarzenia.

## 6. Względy bezpieczeństwa

- Uwierzytelnianie i autoryzacja użytkownika powinny być sprawdzane przed wykonaniem operacji na bazie.
- Użycie RLS (Row Level Security) w tabeli `user_events` umożliwia, aby użytkownik miał dostęp tylko do swoich danych.
- Walidacja danych wejściowych w celu zapobiegania atakom SQL Injection oraz weryfikacja typu danych (np. UUID dla `user_id`, liczba dla `entity_id`).

## 7. Obsługa błędów

- **400 Bad Request**: Zwracany, gdy dane wejściowe nie spełniają wymagań walidacji (brak wymaganych pól, niepoprawny format danych).
- **401 Unauthorized**: Zwracany, gdy użytkownik nie przeszedł poprawnej autoryzacji.
- **404 Not Found**: Zwracany, gdy powiązany zasób (np. check-in lub zadanie) nie istnieje.
- **500 Internal Server Error**: Ogólny błąd serwera, logowany w systemie z dokładnymi informacjami o błędzie dla celów debugowania.

## 8. Rozważania dotyczące wydajności

- Upewnić się, że w bazie danych istnieją odpowiednie indeksy (np. na `user_id`) dla tabeli `user_events` w celu przyspieszenia zapytań.
- Wdrożenie mechanizmów cache'owania nie jest tu krytyczne, ale monitorować obciążenie serwera w przypadku wysokiego ruchu.
- Optymalizacja połączeń z bazą danych, aby uniknąć problemów z wydajnością przy dużej liczbie równoczesnych żądań.

## 9. Etapy wdrożenia

1. **Projektowanie interfejsu API**:
   - Dokumentacja specyfikacji punktu końcowego wraz z wymaganiami walidacji.
2. **Implementacja walidacji danych wejściowych**:
   - Zastosować validatory (np. z pomocą biblioteki zod) dla CreateUserEventCommand.
3. **Implementacja warstwy serwisowej**:
   - Utworzyć lub rozbudować istniejący serwis odpowiedzialny za operacje na zdarzeniach użytkownika.
4. **Integracja z bazą danych**:
   - Zapisać zdarzenie w tabeli `user_events` poprzez wywołanie odpowiednich metod Supabase.
5. **Testowanie endpointa**:
   - Przygotować zestaw testów (unit i integracyjne) w celu weryfikacji poprawności działania.
6. **Obsługa błędów oraz logowanie**:
   - Upewnić się, że błędy są odpowiednio logowane, a użytkownik otrzymuje klarowne komunikaty.
7. **Wdrożenie i monitorowanie**:
   - Wdrożyć zmiany w środowisku testowym, a następnie w produkcyjnym; monitorować wydajność i logi systemowe.

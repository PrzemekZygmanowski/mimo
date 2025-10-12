# API Endpoint Implementation Plan: GET /api/user-tasks

## 1. Przegląd punktu końcowego

Endpoint GET /api/user-tasks jest przeznaczony do pobierania listy zadań przypisanych do uwierzytelnionego użytkownika. Umożliwia filtrowanie zadań po statusie oraz wspiera paginację wyników, co pozwala na efektywne zarządzanie danymi przy dużej liczbie rekordów.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** /api/user-tasks
- **Parametry zapytania:**
  - **Wymagane:**
    - Brak (uwierzytelnienie odbywa się poprzez token sesji lub JWT)
  - **Opcjonalne:**
    - `page`: Numer strony do pobrania (integer)
    - `limit`: Liczba elementów na stronę (integer)
    - `status`: Filtr zadania (np. `pending`, `completed`)
    - `date`: Opcjonalny filtr daty (np. w celu pobrania zadań z konkretnego dnia lub zakresu dat)
- **Request Body:** Brak

## 3. Wykorzystywane typy

- **DTO:**
  - `UserTaskDTO` - reprezentuje strukturę zadania użytkownika, zawierając m.in. pola: `id`, `user_id`, `template_id`, `expires_at`, `status` oraz `new_task_requests`.

## 4. Szczegóły odpowiedzi

- **Kod statusu:** 200 OK dla pomyślnego odczytu
- **Struktura odpowiedzi:**

  ```json
  [
    {
      "id": "task-id",
      "user_id": "user-id",
      "template_id": "template-id",
      "expires_at": "2025-10-13T12:05:00Z",
      "status": "pending",
      "new_task_requests": 0
    }
    // ... kolejne zadania
  ]
  ```

## 5. Przepływ danych

1. Uwierzytelnienie: Odbierz i zweryfikuj token uwierzytelniający (np. JWT) z nagłówka żądania.
2. Walidacja parametrów: Wykorzystaj bibliotekę np. Zod do walidacji parametrów `page`, `limit`, `status` oraz ewentualnie `date`.
3. Pobranie danych: Użyj klienta Supabase (zaimportowanego z `src/db/supabase.client.ts`) do pobrania zadań z tabeli `user_tasks`, filtrując wyniki po `user_id` (pobranym z tokena) oraz ewentualnych dodatkowych parametrach.
4. Paginacja: Zastosuj ograniczenia w zapytaniu dzięki parametrom `page` i `limit`.
5. Zwrócenie odpowiedzi: Wyniki zwróć w formacie JSON zgodnie z wymaganym schematem.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie:** Endpoint dostępny tylko dla uwierzytelnionych użytkowników. Upewnić się, że żądanie posiada poprawny token (np. JWT).
- **Autoryzacja:** Zapytanie musi być ograniczone tylko do zadań przypisanych do aktualnie zalogowanego użytkownika. Można to osiągnąć poprzez politykę RLS (Row Level Security) w bazie danych.
- **Walidacja danych:** Wszystkie parametry wejściowe (np. `page`, `limit`, `status`) powinny być walidowane przy użyciu schematów (np. Zod), aby zapobiec awariom lub atakom typu injection.

## 7. Obsługa błędów

- **401 Unauthorized:** Brak lub niewłaściwy token uwierzytelniający.
- **400 Bad Request:** Nieprawidłowe parametry zapytania (np. błędne wartości `page`, `limit`, `status`).
- **404 Not Found:** (Opcjonalnie) Jeśli nie znaleziono żadnych zadań – chociaż zwykle zwracana jest pusta lista.
- **500 Internal Server Error:** Błąd po stronie serwera lub problem z bazą danych.

## 8. Rozważania dotyczące wydajności

- **Indeksowanie:** Upewnić się, że kolumny `user_id` oraz `task_date` są odpowiednio indeksowane, co przyspieszy filtrowanie oraz paginację.
- **Paginacja:** Ograniczenie liczby wyników wysyłanych w odpowiedzi dzięki parametrom `page` i `limit`.
- **Caching:** Rozważyć mechanizmy cachingowe (np. Redis) przy wysokim obciążeniu, choć w pierwszej fazie można pominąć tę optymalizację.

## 9. Etapy wdrożenia

1. **Stworzenie endpointu**:
   - Utworzyć plik `src/pages/api/user-tasks.ts` (lub `.js`/`.ts` w zależności od preferencji) i zdefiniować trasę dla metody GET.
2. **Walidacja parametrów**:
   - Zaimplementować walidację query parametrów przy użyciu Zod lub innej biblioteki walidującej.
3. **Uwierzytelnianie i autoryzacja**:
   - Odpytać kontekst uwierzytelniania (np. `context.locals` z Supabase) i upewnić się, że użytkownik jest zalogowany oraz pobrać jego `user_id`.
4. **Pobieranie danych z bazy**:
   - Użyć Supabase client do zapytania tabeli `user_tasks` z odpowiednimi filtrami i paginacją.
5. **Obsługa błędów**:
   - Dodanie mechanizmu obsługi wyjątków, który będzie zwracał odpowiednie kody statusu i komunikaty błędów.
6. **Testowanie**:
   - Napisać testy jednostkowe oraz testy integracyjne dla endpointu, aby zweryfikować poprawność działania we wszystkich scenariuszach (poprawne dane, błędne dane, brak autoryzacji, itp.).
7. **Logowanie i monitoring**:
   - Zaimplementować logowanie błędów (np. przy użyciu loggera z `src/lib/logger.ts`), aby ułatwić diagnozowanie problemów w produkcji.
8. **Dokumentacja**:
   - Uaktualnić dokumentację API, umieszczając szczegóły dotyczące nowego endpointu.

---

Plan wdrożenia powinen być wykorzystywany jako przewodnik przy implementacji endpointu przez zespół programistów, zapewniając zgodność z wytycznymi dotyczącymi stacku technologicznego, bezpieczeństwa oraz najlepszych praktyk implementacyjnych.

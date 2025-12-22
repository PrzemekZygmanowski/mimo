# API Endpoint Implementation Plan: DELETE /api/task-templates/:id

## 1. Przegląd punktu końcowego

Endpoint umożliwia usunięcie szablonu zadania z systemu. Jego zadaniem jest usunięcie rekordu w tabeli `task_templates` przy zachowaniu spójności z relacjami, szczególnie odnoszącymi się do tabeli `user_tasks`.

## 2. Szczegóły żądania

- **Metoda HTTP:** DELETE
- **Struktura URL:** `/api/task-templates/:id`
- **Parametry URL:**
  - **id (wymagany):** Identyfikator szablonu zadania (BIGSERIAL).

- **Request Body:** Brak (wszystkie dane przekazywane są przez parametr URL).

## 3. Wykorzystywane typy

- **DTO:** Chociaż usunięcie nie wymaga pełnego DTO, do celów ujednolicenia odpowiedzi można zwrócić np. status operacji.
- **Command Model (opcjonalnie):** Nie dotyczy, gdyż operacja nie przyjmuje dodatkowych danych poza `id` z URL.

## 4. Szczegóły odpowiedzi

- **Status 200:** Usunięcie zakończone sukcesem, zwrócenie komunikatu potwierdzającego operację.
- **Status 400:** Błędny identyfikator (np. niepoprawny format lub wartość spoza oczekiwanych parametrów).
- **Status 401:** Nieautoryzowany dostęp do zasobu.
- **Status 404:** Szablon zadania o podanym identyfikatorze nie został odnaleziony.
- **Status 500:** Wewnętrzny błąd serwera, np. nieoczekiwany problem przy usuwaniu rekordu.

## 5. Przepływ danych

1. Odbiór żądania DELETE na trasie `/api/task-templates/:id`.
2. Walidacja parametru `id` (użycie biblioteki typu Zod do sprawdzenia poprawności danych wejściowych).
3. Sprawdzenie istnienia szablonu zadania o podanym `id` w bazie danych.
4. Próba usunięcia rekordu. W przypadku naruszenia ograniczeń relacyjnych (np. istnieją związane rekordy w `user_tasks`), obsłużenie błędu zgodnie z polityką.
5. Zwrócenie odpowiedzi do klienta.

## 6. Względy bezpieczeństwa

- **Autoryzacja:** Upewnić się, że jedynie uprawniony użytkownik (np. administrator lub właściciel) ma dostęp do tej operacji. Wykorzystanie istniejących mechanizmów RLS w Supabase lub middleware autoryzującego.
- **Walidacja danych:** Użycie Zod do walidacji identyfikatora oraz zabezpieczenie przed wstrzyknięciem niepoprawnych danych.
- **Bezpieczeństwo operacji:** Zapewnienie, że operacja usunięcia sprawdza relacje w bazie (np. czy powiązane rekordy w `user_tasks` nie blokują usunięcia lub są poprawnie zarządzane poprzez ON DELETE CASCADE).

## 7. Obsługa błędów

- **400 Bad Request:** Zwrot, gdy `id` jest niepoprawne lub brakuje wymaganych danych.
- **401 Unauthorized:** W przypadku gdy użytkownik nie posiada odpowiednich uprawnień.
- **404 Not Found:** Gdy szablon zadania o podanym `id` nie istnieje.
- **500 Internal Server Error:** Dla wszelkich nieoczekiwanych błędów, np. problemów z bazą danych.
- **Logowanie błędów:** Rejestrowanie szczegółów błędów w systemie logowania (np. za pomocą modułu `logger.ts`) w celu późniejszej analizy.

## 8. Rozważania dotyczące wydajności

- Usunięcie pojedynczego rekordu nie powinno wpływać znacząco na wydajność, zakładając poprawne indeksowanie kolumny `id`.
- Sprawdzenie poprawności istnienia rekordu przed operacją usunięcia pozwoli uniknąć zbędnych operacji na bazie.
- Rozważenie mechanizmu cache’owania wyników zapytań, jeśli operacje usuwania będą stanowiły część częstszych interakcji.

## 9. Etapy wdrożenia

1. **Walidacja danych wejściowych:**
   - Implementacja walidacji parametru `id` przy użyciu Zod.
2. **Sprawdzenie istnienia rekordu:**
   - Zapytanie do bazy danych w celu potwierdzenia istnienia szablonu zadania.
3. **Operacja usunięcia:**
   - Wykonanie zapytania DELETE na bazie danych, wykorzystując Supabase klienta.
   - Obsługa scenariusza, gdy usunięcie jest blokowane przez powiązane rekordy.
4. **Autoryzacja:**
   - Weryfikacja, czy użytkownik posiada odpowiednie uprawnienia.
5. **Obsługa błędów i logowanie:**
   - Implementacja mechanizmu logowania błędów oraz zwracanie odpowiednich kodów statusu.
6. **Testy i weryfikacja:**
   - Pokrycie endpointu testami jednostkowymi oraz integracyjnymi.
   - Walidacja zachowania przy poprawnych i błędnych danych wejściowych.
7. **Przegląd kodu i wdrożenie:**
   - Code review, po czym wdrożenie zmian na środowisku testowym przed produkcyjnym.

# API Endpoint Implementation Plan: PATCH /api/plants-progress

## 1. Przegląd punktu końcowego

Endpoint służy do aktualizacji stanu ogrodu (garden board) użytkownika. Po ukończeniu zadania system aktualizuje stan planszy, zapisując nowy układ pól oraz czas ostatniej aktualizacji.

## 2. Szczegóły żądania

- **Metoda HTTP:** PATCH
- **Ścieżka URL:** /api/plants-progress
- **Parametry:**
  - _Wymagane:_
    - `board_state`: obiekt JSON reprezentujący zaktualizowany stan planszy (5x6 grid)
  - _Opcjonalne:_ brak
- **Request Body:**
  ```json
  {
    "board_state": {
      /* updated 5x6 grid state as JSON */
    }
  }
  ```

## 3. Wykorzystywane typy

- **Request DTO:**
  - Typ: `UpdatePlantsProgressRequestDTO`
  - Definicja (przykładowa):
    ```typescript
    interface UpdatePlantsProgressRequestDTO {
      board_state: Record<string, any>; // expected to follow a 5x6 grid structure
    }
    ```
- **Response DTO:**
  - Typ: `PlantsProgressResponseDTO`
  - Definicja (przykładowa):
    ```typescript
    interface PlantsProgressResponseDTO {
      user_id: string;
      board_state: Record<string, any>;
      last_updated_at: string; // ISO timestamp
    }
    ```

## 4. Przepływ danych

1. Klient wysyła żądanie PATCH z ciałem zawierającym nowy `board_state`.
2. Warstwa autoryzacji weryfikuje token JWT i przypisuje identyfikator użytkownika.
3. Dane wejściowe są walidowane, aby sprawdzić poprawność struktury (m.in. czy `board_state` zawiera 5x6 siatkę).
4. Logika biznesowa (w serwisie `PlantsProgressService`) aktualizuje rekord w tabeli `user_plants_progress` dla zalogowanego użytkownika.
5. Aktualizacja zapisuje nowy stan planszy oraz ustawia `last_updated_at` na bieżący czas.
6. Odpowiedź zawiera zaktualizowane dane: `user_id`, `board_state` oraz `last_updated_at`.

## 5. Względy bezpieczeństwa

- **Uwierzytelnianie:** Wymagany token JWT przesyłany w nagłówku `Authorization: Bearer <token>`. Endpoint powinien być dostępny tylko dla zalogowanych użytkowników.
- **Autoryzacja:** Sprawdzenie, czy użytkownik ma prawo modyfikować dany rekord (RLS w bazie danych lub logika w API).
- **Walidacja danych:** Walidacja struktury `board_state` za pomocą np. bibliotek typu Zod w przypadku TypeScript. Upewnienie się, że struktura odpowiada oczekiwanemu układowi 5x6.

## 6. Obsługa błędów

- **400 Bad Request:**
  - Gdy dane wejściowe są niepoprawne lub niekompletne (np. brak `board_state` lub nieprawidłowy format planszy).
- **401 Unauthorized:**
  - Gdy token autoryzacyjny jest niepoprawny lub nieobecny.
- **500 Internal Server Error:**
  - Błąd podczas aktualizacji danych w bazie lub inny nieoczekiwany problem.

## 7. Rozważania dotyczące wydajności

- Aktualizacja jednego rekordu w tabeli `user_plants_progress` zazwyczaj jest szybka, jednak warto monitorować operacje na bazie przy dużej liczbie użytkowników.
- Optymalizacja po stronie bazy danych, np. poprzez odpowiednie indeksy na kolumnach używanych do wyszukiwania (user_id) oraz zapisywania timestampa.

## 8. Etapy wdrożenia

1. **Definicja DTO:**
   - Utworzenie interfejsów `UpdatePlantsProgressRequestDTO` i `PlantsProgressResponseDTO` w pliku typów (np. w `src/types.ts`).
2. **Implementacja usługi:**
   - Utworzenie lub rozszerzenie serwisu `PlantsProgressService` w warstwie logiki biznesowej (`src/lib/services/`), który będzie zawierał metodę do aktualizacji stanu planszy.
3. **Endpoint API:**
   - Utworzenie endpointu w pliku `src/pages/api/plants-progress.ts` lub odpowiednim pliku kontrolera.
   - Import i wywołanie metody serwisu, przekazując dane użytkownika oraz `board_state`.
4. **Walidacja:**
   - Dodanie walidacji żądania (np. za pomocą Zod).
5. **Obsługa błędów:**
   - Implementacja mechanizmów obsługi błędów, rejestrowanie wyjątków przy pomocy loggera (np. `src/lib/logger.ts`).
6. **Testy:**
   - Napisanie testów integracyjnych i jednostkowych sprawdzających poprawność działania endpointu przy różnych scenariuszach (poprawne dane, błędne dane, brak autoryzacji itd.).
7. **Dokumentacja:**
   - Uaktualnienie dokumentacji API o szczegóły nowego endpointu.
8. **Code Review i wdrożenie:**
   - Przeprowadzenie code-review i wdrożenie zmian do środowiska testowego przed wdrożeniem na produkcję.

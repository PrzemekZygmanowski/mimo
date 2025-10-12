# API Endpoint Implementation Plan: GET /api/checkins/:id

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania pojedynczego rekordu check-in. Umożliwia użytkownikowi odczytanie szczegółów swojego check-in na podstawie identyfikatora. Endpoint uwzględnia autoryzację i oprócz danych check-in zwraca jedynie rekord przypisany do aktualnie zalogowanego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/checkins/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` - identyfikator check-in (BIGSERIAL, liczba)
  - **Opcjonalne**: brak
- **Request Body**: brak

## 3. Wykorzystywane typy

- **DTO**:
  - `CheckInDTO` z pliku `src/types.ts`
- **Command Model**: brak, ponieważ endpoint ten nie tworzy ani nie modyfikuje zasobu

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - Status: `200 OK`
  - Treść: JSON zawierający dane check-in, np.:
    ```json
    {
      "id": 123,
      "user_id": "user-id",
      "mood_level": 3,
      "energy_level": 2,
      "at": "2025-10-12T12:05:00Z",
      "notes": "Feeling okay"
    }
    ```
- **Błędy**:
  - `401 Unauthorized` – gdy użytkownik nie jest autoryzowany
  - `404 Not Found` – gdy rekord o podanym identyfikatorze nie istnieje lub nie należy do użytkownika
  - `500 Internal Server Error` – dla nieoczekiwanych błędów serwera

## 5. Przepływ danych

1. Użytkownik wysyła żądanie GET na `/api/checkins/:id` wraz z identyfikatorem.
2. Middleware sprawdza autoryzację użytkownika.
3. Parametr `id` jest walidowany (sprawdzenie typu liczbowego).
4. Serwis dedykowany (np. `getCheckInById`) wykonuje zapytanie do bazy danych za pomocą klienta Supabase, filtrując rekordy po `id` i `user_id`.
5. Jeśli rekord zostanie znaleziony, dane są zwracane w strukturze `CheckInDTO`.
6. W przypadku braku rekordu lub braku uprawnień zwracany jest odpowiedni kod błędu.

## 6. Względy bezpieczeństwa

- Endpoint musi być dostępny tylko dla autoryzowanych użytkowników.
- Sprawdzenie, czy `user_id` w rekordzie odpowiada identyfikatorowi aktualnie zalogowanego użytkownika.
- Walidacja i sanitizacja parametru `id` przed wykonaniem zapytania do bazy danych.
- Korzystanie z middlewaru autoryzacyjnego.

## 7. Obsługa błędów

- **401 Unauthorized**: Jeśli użytkownik nie jest autoryzowany.
- **404 Not Found**: Jeśli żaden rekord nie został znaleziony dla podanego `id` lub rekord nie należy do użytkownika.
- **500 Internal Server Error**: W przypadku wystąpienia nieoczekiwanych problemów (np. błąd bazy danych).
- Logowanie błędów z użyciem modułu `logger.ts` (z `src/lib/logger.ts`).

## 8. Rozważania dotyczące wydajności

- Upewnienie się, że zapytanie do bazy korzysta z indeksu na kolumnie `id` oraz sprawdza `user_id` pod kątem zgodności.
- Minimalizacja obciążenia poprzez ograniczenie zwracanych kolumn tylko do tych potrzebnych do stworzenia obiektu `CheckInDTO`.

## 9. Etapy wdrożenia

1. **Implementacja autoryzacji**:
   - Upewnienie się, że middleware autoryzacyjne jest poprawnie skonfigurowane.
2. **Walidacja parametru `id`**:
   - Dodanie walidacji, aby `id` było liczbą.
3. **Logika wyszukiwania**:
   - Utworzenie lub rozszerzenie serwisu (np. `getCheckInById`) w celu pobierania rekordu check-in z bazy danych przy użyciu klienta Supabase.
4. **Implementacja endpointu**:
   - W pliku `src/pages/api/checkins.ts` zaimplementować handler:
     - Pobranie parametru `id` ze ścieżki URL.
     - Walidacja parametru oraz autoryzacja.
     - Wywołanie serwisu wyszukującego rekord check-in.
     - Zwrócenie odpowiedzi JSON z statusem `200 OK` lub odpowiednio obsłużenie błędów (401, 404, 500).
5. **Testowanie**:
   - Przeprowadzenie testów jednostkowych i integracyjnych.
   - Symulacja przypadków błędnych, np. nieautoryzowanego dostępu i nieistniejącego identyfikatora.
6. **Logowanie**:
   - Dodanie logowania błędów przy użyciu `logger.ts`.
7. **Finalna walidacja**:
   - Weryfikacja poprawności odpowiedzi i działania endpointu przy wykorzystaniu narzędzi do testowania API (np. Postman).

---

Plan należy zapisać w pliku:
`.ai/check-in-id-endpoint-implementation-plan.md`

# API Endpoint Implementation Plan: GET /api/checkins/:id

## 1. Przegląd punktu końcowego

Endpoint służy do pobierania pojedynczego rekordu check-in. Umożliwia użytkownikowi odczytanie szczegółów swojego check-in na podstawie identyfikatora. Endpoint uwzględnia autoryzację i oprócz danych check-in zwraca jedynie rekord przypisany do aktualnie zalogowanego użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/checkins/:id`
- **Parametry**:
  - **Wymagane**:
    - `id` - identyfikator check-in (BIGSERIAL, liczba)
  - **Opcjonalne**: brak
- **Request Body**: brak

## 3. Wykorzystywane typy

- **DTO**:
  - `CheckInDTO` z pliku `src/types.ts`
- **Command Model**: brak, ponieważ endpoint ten nie tworzy ani nie modyfikuje zasobu

## 4. Szczegóły odpowiedzi

- **Sukces**:
  - Status: `200 OK`
  - Treść: JSON zawierający dane check-in, np.:
    ```json
    {
      "id": 123,
      "user_id": "user-id",
      "mood_level": 3,
      "energy_level": 2,
      "at": "2025-10-12T12:05:00Z",
      "notes": "Feeling okay"
    }
    ```
- **Błędy**:
  - `401 Unauthorized` – gdy użytkownik nie jest autoryzowany
  - `404 Not Found` – gdy rekord o podanym identyfikatorze nie istnieje lub nie należy do użytkownika
  - `500 Internal Server Error` – dla nieoczekiwanych błędów serwera

## 5. Przepływ danych

1. Użytkownik wysyła żądanie GET na `/api/checkins/:id` wraz z identyfikatorem.
2. Middleware sprawdza autoryzację użytkownika.
3. Parametr `id` jest walidowany (sprawdzenie typu liczbowego).
4. Serwis dedykowany (np. `getCheckInById`) wykonuje zapytanie do bazy danych za pomocą klienta Supabase, filtrując rekordy po `id` i `user_id`.
5. Jeśli rekord zostanie znaleziony, dane są zwracane w strukturze `CheckInDTO`.
6. W przypadku braku rekordu lub braku uprawnień zwracany jest odpowiedni kod błędu.

## 6. Względy bezpieczeństwa

- Endpoint musi być dostępny tylko dla autoryzowanych użytkowników.
- Sprawdzenie, czy `user_id` w rekordzie odpowiada identyfikatorowi aktualnie zalogowanego użytkownika.
- Walidacja i sanitizacja parametru `id` przed wykonaniem zapytania do bazy danych.
- Korzystanie z middlewaru autoryzacyjnego.

## 7. Obsługa błędów

- **401 Unauthorized**: Jeśli użytkownik nie jest autoryzowany.
- **404 Not Found**: Jeśli żaden rekord nie został znaleziony dla podanego `id` lub rekord nie należy do użytkownika.
- **500 Internal Server Error**: W przypadku wystąpienia nieoczekiwanych problemów (np. błąd bazy danych).
- Logowanie błędów z użyciem modułu `logger.ts` (z `src/lib/logger.ts`).

## 8. Rozważania dotyczące wydajności

- Upewnienie się, że zapytanie do bazy korzysta z indeksu na kolumnie `id` oraz sprawdza `user_id` pod kątem zgodności.
- Minimalizacja obciążenia poprzez ograniczenie zwracanych kolumn tylko do tych potrzebnych do stworzenia obiektu `CheckInDTO`.

## 9. Etapy wdrożenia

1. **Implementacja autoryzacji**:
   - Upewnienie się, że middleware autoryzacyjne jest poprawnie skonfigurowane.
2. **Walidacja parametru `id`**:
   - Dodanie walidacji, aby `id` było liczbą.
3. **Logika wyszukiwania**:
   - Utworzenie lub rozszerzenie serwisu (np. `getCheckInById`) w celu pobierania rekordu check-in z bazy danych przy użyciu klienta Supabase.
4. **Implementacja endpointu**:
   - W pliku `src/pages/api/checkins.ts` zaimplementować handler:
     - Pobranie parametru `id` ze ścieżki URL.
     - Walidacja parametru oraz autoryzacja.
     - Wywołanie serwisu wyszukującego rekord check-in.
     - Zwrócenie odpowiedzi JSON z statusem `200 OK` lub odpowiednio obsłużenie błędów (401, 404, 500).
5. **Testowanie**:
   - Przeprowadzenie testów jednostkowych i integracyjnych.
   - Symulacja przypadków błędnych, np. nieautoryzowanego dostępu i nieistniejącego identyfikatora.
6. **Logowanie**:
   - Dodanie logowania błędów przy użyciu `logger.ts`.
7. **Finalna walidacja**:
   - Weryfikacja poprawności odpowiedzi i działania endpointu przy wykorzystaniu narzędzi do testowania API (np. Postman).

---

Plan należy zapisać w pliku:
`.ai/check-in-id-endpoint-implementation-plan.md`

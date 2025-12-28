# API Endpoint Implementation Plan: POST /api/task-templates

## 1. Przegląd punktu końcowego

Endpoint umożliwia utworzenie jednego lub wielu nowych szablonów zadań. Użytkownik wysyła szczegóły szablonu lub tablicę szablonów (m.in. tytuł, opis oraz opcjonalne ograniczenia dotyczące nastroju i poziomu energii), a system tworzy rekordy w tabeli `task_templates` w bazie danych. Endpoint obsługuje zarówno pojedyncze obiekty, jak i tablice szablonów, co umożliwia efektywne tworzenie wielu szablonów w jednym żądaniu. W przypadku pomyślnego utworzenia zwracany jest obiekt szablonu lub tablica szablonów wraz z kodem statusu 201 Created.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **URL:** /api/task-templates
- **Parametry (dla pojedynczego szablonu lub każdego elementu tablicy):**
  - **Wymagane:**
    - `title` (string, 1-255 znaków) – tytuł szablonu
  - **Opcjonalne:**
    - `description` (string, max 1000 znaków, null) – opis szablonu
    - `required_mood_level` (number, 1-5) – minimalny poziom nastroju
    - `required_energy_level` (number, 1-3) – minimalny poziom energii
    - `metadata` (JSON) – dowolne dodatkowe informacje
- **Limity:**
  - Minimalna liczba szablonów w tablicy: 1
  - Maksymalna liczba szablonów w jednym żądaniu batch: 100
- **Request Body (pojedynczy szablon):**
  ```json
  {
    "title": "Szablon zadania",
    "description": "Opis opcjonalny",
    "required_mood_level": 3,
    "required_energy_level": 2,
    "metadata": {}
  }
  ```
- **Request Body (wiele szablonów - batch):**
  ```json
  [
    {
      "title": "Szablon 1",
      "description": "Opis 1",
      "required_mood_level": 3
    },
    {
      "title": "Szablon 2",
      "description": "Opis 2",
      "required_energy_level": 2
    }
  ]
  ```

## 3. Wykorzystywane typy

- **DTO:** `TaskTemplateDTO` – reprezentuje pełne dane szablonu zadania (odczyt z bazy)
- **Command Model:** `CreateTaskTemplateCommand` – model dla tworzenia pojedynczego szablonu (pomija pola auto-generowane takie jak `id`, `created_at`, `updated_at`)
- **Request Body:** Union type akceptujący `CreateTaskTemplateCommand` lub `CreateTaskTemplateCommand[]` – umożliwia wysłanie pojedynczego obiektu lub tablicy obiektów
- **Response Body:** `TaskTemplateDTO` lub `TaskTemplateDTO[]` – zwracany format odpowiada formatowi żądania (pojedynczy obiekt lub tablica)

## 4. Szczegóły odpowiedzi

- **Sukces (201 Created) - pojedynczy szablon:**
  ```json
  {
    "id": 123,
    "title": "Szablon zadania",
    "description": "Opis opcjonalny",
    "required_mood_level": 3,
    "required_energy_level": 2,
    "metadata": {},
    "created_at": "2025-12-28T10:00:00Z",
    "updated_at": "2025-12-28T10:00:00Z"
  }
  ```
- **Sukces (201 Created) - wiele szablonów:**
  ```json
  [
    {
      "id": 123,
      "title": "Szablon 1",
      "description": "Opis 1",
      "required_mood_level": 3,
      "required_energy_level": null,
      "metadata": null,
      "created_at": "2025-12-28T10:00:00Z",
      "updated_at": "2025-12-28T10:00:00Z"
    },
    {
      "id": 124,
      "title": "Szablon 2",
      "description": "Opis 2",
      "required_mood_level": null,
      "required_energy_level": 2,
      "metadata": null,
      "created_at": "2025-12-28T10:00:00Z",
      "updated_at": "2025-12-28T10:00:00Z"
    }
  ]
  ```
- **Błędy:**
  - 400 Bad Request – nieprawidłowe dane wejściowe, naruszenie ograniczeń walidacyjnych, pusta tablica
  - 401 Unauthorized – brak autoryzacji
  - 500 Internal Server Error – błąd po stronie serwera (np. problemy z bazą danych)

## 5. Przepływ danych

1. Klient wysyła żądanie POST z danymi szablonu lub tablicą szablonów zadań do endpointu.
2. Warstwa kontrolera weryfikuje dane wejściowe za pomocą Zod:
   - Sprawdzenie, czy żądanie zawiera pojedynczy obiekt lub tablicę obiektów
   - Walidacja wymaganych pól dla każdego szablonu (`title`)
   - Walidacja zakresów wartości dla `required_mood_level` (1-5) i `required_energy_level` (1-3)
   - W przypadku tablicy: walidacja, że zawiera co najmniej jeden element
3. Normalizacja danych wejściowych:
   - Konwersja pojedynczego obiektu do tablicy dla ujednolicenia przetwarzania
   - Przygotowanie danych do insertu (mapowanie null dla opcjonalnych pól)
4. Komunikacja z bazą danych (Supabase):
   - Wykonanie bulk insert do tabeli `task_templates`
   - Pobranie utworzonych rekordów z wszystkimi wygenerowanymi polami
5. Mapowanie wyników do `TaskTemplateDTO` i zwrócenie odpowiedzi:
   - Jeśli żądanie zawierało pojedynczy obiekt, zwraca pojedynczy obiekt
   - Jeśli żądanie zawierało tablicę, zwraca tablicę obiektów
   - Status HTTP 201 Created

## 6. Względy bezpieczeństwa

- Uwierzytelnianie i autoryzacja – sprawdzenie, czy użytkownik jest zalogowany i posiada odpowiednie uprawnienia do tworzenia szablonów.
- Walidacja danych wejściowych – użycie zod do weryfikacji danych pod kątem ograniczeń (np. zakresy dla `required_mood_level` i `required_energy_level`).
- Ochrona przed atakami typu SQL Injection poprzez korzystanie z ORM lub mechanizmów oferowanych przez Supabase.

## 7. Obsługa błędów

- **400 Bad Request:** Zwracany, gdy:
  - Dane wejściowe nie spełniają wymagań walidacyjnych (np. brak pola `title`)
  - Pole `title` jest puste lub przekracza 255 znaków
  - Pole `description` przekracza 1000 znaków
  - Niewłaściwy zakres wartości dla `required_mood_level` (poza 1-5) lub `required_energy_level` (poza 1-3)
  - Pusta tablica szablonów lub przekroczenie limitu 100 szablonów w batch
  - Nieprawidłowy format danych (błędny typ pola)
  - Błędy walidacji Zod zawierające szczegółowe informacje o nieprawidłowych polach
- **401 Unauthorized:** Zwracany, gdy użytkownik nie jest autoryzowany do wykonania operacji (nie jest zalogowany).
- **500 Internal Server Error:** Używany do sygnalizowania niespodziewanych błędów po stronie serwera:
  - Problemy z połączeniem z bazą danych
  - Błędy podczas bulk insert
  - Inne nieoczekiwane wyjątki
- **Rejestracja błędów:**
  - Logowanie wszystkich wyjątków i błędów walidacji przy użyciu `src/lib/logger.ts`
  - Dla operacji batch należy logować informacje o liczbie przetwarzanych szablonów

## 8. Rozważania dotyczące wydajności

- Minimalny narzut obliczeniowy przy walidacji danych wejściowych (Zod validation).
- **Zaimplementowany bulk insert** dla operacji batch, który jest znacznie wydajniejszy niż pojedyncze inserty w pętli.
- **Zaimplementowany limit** na maksymalną liczbę szablonów w jednym żądaniu batch: **100 szablonów**, aby uniknąć przeciążenia serwera.
- **Zaimplementowane limity długości** dla pól tekstowych: `title` (max 255 znaków), `description` (max 1000 znaków).
- **Zaimplementowane logowanie** operacji batch (liczba tworzonych szablonów, user_id) dla celów monitoringu i debugowania.
- Upewnienie się, że operacje zapisu do bazy danych są zoptymalizowane (indeksy na kolumnach używanych w zapytaniach) i obsługa potencjalnych blokad.
- Użycie cache tam, gdzie to możliwe, dla operacji odczytu (GET endpoint), choć dla operacji tworzenia cache nie jest krytyczny.
- Monitorowanie wydajności operacji batch i dostosowanie limitów w razie potrzeby.

## 9. Etapy wdrożenia

1. **Analiza wymagań i przygotowanie szablonów:**
   - Przegląd dokumentacji API, schematu bazy danych oraz specyfikacji DTO i Command Modeli.
2. **Implementacja walidacji danych:**
   - Utworzenie schematu walidacji za pomocą Zod dla pojedynczego szablonu (`createTaskTemplateSchema`).
   - Utworzenie schematu union akceptującego pojedynczy obiekt lub tablicę (`createTaskTemplateRequestSchema`).
   - Dodanie walidacji minimalnej liczby elementów w tablicy (min. 1).
   - Opcjonalnie: dodanie walidacji maksymalnej liczby elementów (np. max. 100).
3. **Implementacja endpointu:**
   - Utworzenie lub rozszerzenie kontrolera w `src/pages/api/task-templates.ts`.
   - Implementacja wykrywania, czy żądanie zawiera pojedynczy obiekt czy tablicę.
   - Normalizacja danych wejściowych do wspólnego formatu (konwersja pojedynczego obiektu do tablicy).
4. **Integracja z bazą danych:**
   - Implementacja operacji bulk insert w tabeli `task_templates` przy użyciu klienta Supabase.
   - Prawidłowa obsługa odpowiedzi z bazy danych (pojedynczy obiekt vs. tablica).
   - Zwracanie wyniku w formacie odpowiadającym formatowi żądania.
5. **Testowanie jednostkowe i integracyjne:**
   - Testowanie scenariusza z pojedynczym szablonem (201 Created).
   - Testowanie scenariusza z wieloma szablonami batch (201 Created z tablicą).
   - Testowanie walidacji dla pustej tablicy (400 Bad Request).
   - Testowanie walidacji dla nieprawidłowych danych.
   - Weryfikacja odpowiedzi 201 w przypadku sukcesu oraz obsługi błędów (400, 401, 500).
   - Testowanie wydajności operacji batch z różną liczbą szablonów.
6. **Logowanie i monitorowanie:**
   - Implementacja rejestracji błędów oraz monitoringu przy użyciu `src/lib/logger.ts`.
   - Logowanie informacji o liczbie przetwarzanych szablonów dla operacji batch.
7. **Code Review i wdrożenie:**
   - Przegląd kodu przez zespół, wdrożenie na środowisko testowe i produkcyjne.

---

## Status Implementacji: ✅ ZAKOŃCZONY

**Data ukończenia:** 2025-12-28

### Zaimplementowane funkcjonalności:

✅ **Walidacja z Zod:**

- Wymagane pole `title` (1-255 znaków)
- Opcjonalne pole `description` (max 1000 znaków)
- Walidacja zakresów: `required_mood_level` (1-5), `required_energy_level` (1-3)
- Limit batch: min 1, max 100 szablonów

✅ **Endpoint POST /api/task-templates:**

- Autoryzacja użytkownika (401 dla niezalogowanych)
- Obsługa pojedynczego obiektu lub tablicy (batch)
- Bulk insert do bazy danych
- Smart response (format odpowiedzi = format żądania)
- Polskie komunikaty błędów
- Logowanie operacji batch

✅ **Testy jednostkowe (14 testów):**

- Sukces: pojedynczy szablon (201)
- Sukces: batch request (201 z tablicą)
- Błędy walidacji: brak title, pusty title, poza zakresem mood/energy (400)
- Błędy walidacji: przekroczenie długości title/description (400)
- Błędy walidacji: pusta tablica, przekroczenie limitu 100 (400)
- Błąd autoryzacji (401)
- Błąd bazy danych (500)
- Obsługa opcjonalnych pól (null values)

✅ **Usprawnienia:**

- Limity długości pól zapobiegające atakom
- Limit batch (100) zapobiegający przeciążeniu serwera
- Logowanie informacji o batch operations
- Kod bez błędów lintingu
- Zgodność z wytycznymi projektu (używa `locals.supabase`)

### Pliki zmodyfikowane:

- `src/pages/api/task-templates.ts` - implementacja endpointa
- `src/pages/api/task-templates.test.ts` - testy jednostkowe (14 testów)
- `package.json` - dodano skrypty test
- `vitest.config.ts` - konfiguracja testów (nowy plik)
- `.ai/endpoints-plan/task-template-post-endpoint-implementation-plan.md` - zaktualizowana dokumentacja

### Uwagi dla wdrożenia:

- **Wymagana wersja Node.js:** 18+ (obecnie v14.17.4 - wymaga aktualizacji przed uruchomieniem testów)
- Wszystkie komunikaty błędów są w języku polskim
- Endpoint gotowy do wdrożenia na środowisko testowe/produkcyjne po aktualizacji Node.js

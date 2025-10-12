# API Endpoint Implementation Plan: POST /api/task-templates

## 1. Przegląd punktu końcowego

Endpoint umożliwia utworzenie nowego szablonu zadania. Użytkownik wysyła szczegóły szablonu (m.in. tytuł, opis oraz opcjonalne ograniczenia dotyczące nastroju i poziomu energii), a system tworzy rekord w tabeli `task_templates` w bazie danych. W przypadku pomyślnego utworzenia zwracany jest obiekt szablonu wraz z kodem statusu 201 Created.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **URL:** /api/task-templates
- **Parametry:**
  - **Wymagane:**
    - `title` (string) – tytuł szablonu
  - **Opcjonalne:**
    - `description` (string, null) – opis szablonu
    - `required_mood_level` (number, 1-5) – minimalny poziom nastroju
    - `required_energy_level` (number, 1-3) – minimalny poziom energii
    - `metadata` (JSON) – dowolne dodatkowe informacje
- **Request Body:** JSON zawierający szczegóły szablonu zadania

## 3. Wykorzystywane typy

- **DTO:** `TaskTemplateDTO` (odczyt szablonu)
- **Command Model:** `CreateTaskTemplateCommand` (tworzenie szablonu, pomija pola auto-generowane takie jak `id`, `created_at`, `updated_at`)

## 4. Szczegóły odpowiedzi

- **Sukces (201 Created):**
  - Zwracany JSON zawiera szczegóły utworzonego szablonu zadania (zgodne z `TaskTemplateDTO`)
- **Błędy:**
  - 400 Bad Request – nieprawidłowe dane wejściowe lub naruszenie ograniczeń walidacyjnych
  - 401 Unauthorized – brak autoryzacji
  - 500 Internal Server Error – błąd po stronie serwera

## 5. Przepływ danych

1. Klient wysyła żądanie POST z danymi szablonu zadania do endpointu.
2. Warstwa kontrolera weryfikuje dane wejściowe, korzystając z walidacji (np. za pomocą zod zgodnie z regułami backendu).
3. Następuje wywołanie logiki biznesowej w serwisie odpowiedzialnym za tworzenie szablonów zadań.
4. Serwis komunikuje się z bazą danych (np. przy użyciu Supabase) w celu utworzenia rekordu w tabeli `task_templates`.
5. W przypadku powodzenia, utworzony rekord jest zwracany do kontrolera, który opakowuje go w odpowiedź HTTP (201 Created).

## 6. Względy bezpieczeństwa

- Uwierzytelnianie i autoryzacja – sprawdzenie, czy użytkownik jest zalogowany i posiada odpowiednie uprawnienia do tworzenia szablonów.
- Walidacja danych wejściowych – użycie zod do weryfikacji danych pod kątem ograniczeń (np. zakresy dla `required_mood_level` i `required_energy_level`).
- Ochrona przed atakami typu SQL Injection poprzez korzystanie z ORM lub mechanizmów oferowanych przez Supabase.

## 7. Obsługa błędów

- **400 Bad Request:** Zwracany, gdy dane wejściowe nie spełniają wymagań walidacyjnych (np. brak pola `title`, niewłaściwy zakres wartości dla `required_mood_level` lub `required_energy_level`).
- **401 Unauthorized:** Zwracany, gdy użytkownik nie jest autoryzowany do wykonania operacji.
- **500 Internal Server Error:** Używany do sygnalizowania niespodziewanych błędów po stronie serwera, np. problemów z połączeniem z bazą danych.
- Rejestracja błędów – logowanie wszystkich wyjątków i błędów walidacji w systemie logowania (np. za pomocą dedykowanego service logującego).

## 8. Rozważania dotyczące wydajności

- Minimalny narzut obliczeniowy przy walidacji danych wejściowych.
- Upewnienie się, że operacje zapisu do bazy danych są zoptymalizowane (indeksy na kolumnach używanych w zapytaniach) i obsługa potencjalnych blokad.
- Użycie cache tam, gdzie to możliwe, dla operacji odczytu, choć dla operacji tworzenia cache nie jest krytyczny.

## 9. Etapy wdrożenia

1. **Analiza wymagań i przygotowanie szablonów:**
   - Przegląd dokumentacji API, schematu bazy danych oraz specyfikacji DTO i Command Modeli.
2. **Implementacja walidacji danych:**
   - Stworzenie lub aktualizacja schematu walidacji (np. przy użyciu zod) dla danych wejściowych.
3. **Rozwój logiki biznesowej:**
   - Wyodrębnienie logiki tworzenia szablonu zadania do osobnego serwisu.
4. **Implementacja endpointu:**
   - Utworzenie kontrolera w ramach API (np. w katalogu `src/pages/api/task-templates.ts` lub zgodnie z architekturą projektu).
5. **Integracja z bazą danych:**
   - Implementacja operacji zapisu w tabeli `task_templates` przy użyciu klienta Supabase.
6. **Testowanie jednostkowe i integracyjne:**
   - Testowanie poprawności działania endpointu, weryfikacja odpowiedzi 201 w przypadku sukcesu oraz obsługi błędów (400, 401, 500).
7. **Logowanie i monitorowanie:**
   - Implementacja rejestracji błędów oraz monitoringu, aby szybko reagować na problemy produkcyjne.
8. **Code Review i wdrożenie:**
   - Przegląd kodu przez zespół, wdrożenie na środowisko testowe i produkcyjne.

# API Endpoint Implementation Plan: GET /api/task-templates

## 1. Przegląd punktu końcowego

Endpoint pozwala na pobranie listy szablonów zadań, umożliwiając filtrowanie po poziomie nastroju i energii. Użytkownicy mogą w ten sposób uzyskać spersonalizowane zadania na podstawie swoich aktualnych warunków.

## 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/task-templates`
- **Parametry zapytania**:
  - **Wymagane**: Brak
  - **Opcjonalne**:
    - `mood_level` (liczba całkowita, zakres 1-5)
    - `energy_level` (liczba całkowita, zakres 1-3)
- **Request Body**: Brak

## 3. Wykorzystywane typy

- **TaskTemplateDTO**: Definiuje strukturę szablonu zadania, w tym pola takie jak `id`, `title`, `description`, `required_mood_level`, `required_energy_level`, `metadata`, `created_at`, `updated_at`.

## 4. Szczegóły odpowiedzi

- **Status**: 200 OK
- **Struktura odpowiedzi**: JSON array, gdzie każdy element ma strukturę:
  ```json
  {
    "id": "template-id",
    "name": "Nazwij zadanie",
    "constraints": {
      "mood_level": [1, 2, 3, 4, 5],
      "energy_level": [1, 2, 3]
    }
  }
  ```
- **Przykład**: Widok listy szablonów zadań zgodnie z kryteriami filtrowania.

## 5. Przepływ danych

1. Odbiór żądania HTTP z opcjonalnymi parametrami: `mood_level` i `energy_level`.
2. Walidacja parametrów wejściowych (np. format, zakres wartości). Zastosowanie biblioteki walidacyjnej (np. Zod) zgodnie z regułami implementacji.
3. Przekazanie parametrów do warstwy serwisów w celu wykonania zapytania do bazy danych.
4. Pobranie listy szablonów zadań z bazy danych, przy czym przy zastosowaniu filtrów odpowiednie zapytanie SQL powinno używać indeksów (np. na kolumnach `required_mood_level` i `required_energy_level`).
5. Transformacja danych z formatu bazy danych do formatu odpowiedzi API, w tym mapowanie pól do struktury `name` i `constraints`.
6. Zwrócenie odpowiedzi JSON z kodem 200 OK.

## 6. Względy bezpieczeństwa

- **Autoryzacja**: Endpoint powinien być dostępny tylko dla uwierzytelnionych użytkowników, stosując RLS w bazie danych oraz mechanizmy autoryzacji w warstwie API.
- **Walidacja danych**: Dokładna walidacja parametrów wejściowych, aby zapobiec atakom typu SQL Injection lub innym złośliwym działaniom.
- **Ochrona danych**: Upewnienie się, że zadania użytkowników oraz dane szablonów są odpowiednio filtrowane zgodnie z politykami bezpieczeństwa.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracane, gdy parametry zapytania są nieprawidłowe (np. poza dozwolonym zakresem).
- **401 Unauthorized**: W przypadku nieautoryzowanego dostępu.
- **404 Not Found**: Gdy żaden szablon zadania nie odpowiada kryteriom filtrowania (opcjonalnie, może być zwrócony pusty array).
- **500 Internal Server Error**: W przypadku błędów po stronie serwera lub nieoczekiwanych wyjątków.

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Użycie indeksów na kolumnach `required_mood_level` i `required_energy_level` w tabeli `task_templates`, aby zapewnić szybkie filtrowanie.
- **Cache'owanie**: Rozważenie cache'owania wyników dla popularnych filtrów, jeżeli obciążenie serwera będzie znaczne.
- **Limitowanie wyników**: Potencjalne wprowadzenie mechanizmu paginacji w przyszłości, aby zapobiec przeciążeniu serwera przy bardzo dużej liczbie rekordów.

## 9. Etapy wdrożenia

1. **Utworzenie pliku endpointa**: Stworzenie lub modyfikacja pliku `src/pages/api/task-templates.ts` zgodnie z architekturą projektu (Astro API endpoint).
2. **Walidacja parametrów**: Implementacja walidacji parametrów `mood_level` i `energy_level` przy użyciu Zod lub innej biblioteki walidacyjnej.
3. **Warstwa serwisów**: Wyodrębnienie logiki dostępu do danych do nowo utworzonego modułu w `src/lib/services/taskTemplates.ts` (lub modyfikacja istniejącego, jeżeli taki istnieje).
4. **Interakcja z bazą danych**: Implementacja zapytania do bazy danych, które uwzględnia ewentualne filtry oraz korzysta z RLS jako dodatkowej warstwy zabezpieczeń.
5. **Transformacja danych**: Zmapowanie danych z bazy danych na strukturę odpowiedzi API, ujednolicając pola (np. zamiana `title` na `name`, utworzenie obiektu `constraints`).
6. **Obsługa błędów i logowanie**: Implementacja mechanizmu przechwytywania błędów, logowania ich oraz zwracanie odpowiednich kodów statusu.
7. **Testy**: Przeprowadzenie testów jednostkowych i integracyjnych, aby upewnić się, że endpoint działa zgodnie z planem i jest odporny na błędne dane wejściowe.
8. **Dokumentacja**: Aktualizacja dokumentacji API i przekazanie szczegółowego planu wdrożenia zespołowi deweloperskiemu.

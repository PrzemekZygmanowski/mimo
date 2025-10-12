# API Endpoint Implementation Plan: POST /api/checkins

## 1. Przegląd punktu końcowego

Ten punkt końcowy umożliwia tworzenie nowego check-in dla aktualnie uwierzytelnionego użytkownika. Podczas tworzenia check-in, system rejestruje poziom nastroju oraz energii użytkownika, a także ew. notatki. W niektórych przypadkach na tej podstawie może zostać wygenerowane powiązane zadanie dla użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** /api/checkins
- **Parametry:**
  - **Wymagane:**
    - mood_level (liczba, wartość całkowita z zakresu 1-5)
    - energy_level (liczba, wartość całkowita z zakresu 1-3)
  - **Opcjonalne:**
    - notes (tekst, opcjonalny komentarz użytkownika)
- **Request Body:**

```json
{
  "mood_level": 3,
  "energy_level": 2,
  "notes": "Feeling okay"
}
```

## 3. Wykorzystywane typy

- **DTO:**
  - CheckInDTO – reprezentuje rekord check-in, zawierający: id, user_id, mood_level, energy_level, at, notes oraz opcjonalnie generated_task.
- **Command Model:**
  - CreateCheckInCommand – zawiera: mood_level, energy_level oraz opcjonalnie notes.

## 4. Szczegóły odpowiedzi

- **Kod statusu:** 201 (Created) w przypadku powodzenia
- **Struktura odpowiedzi:** JSON z rekordem check-in, przykładowo:

```json
{
  "id": "checkin-id",
  "user_id": "user-id",
  "mood_level": 3,
  "energy_level": 2,
  "at": "2025-10-12T12:05:00Z",
  "notes": "Feeling okay",
  "generated_task": {
    "id": "usertask-id",
    "expires_at": "2025-10-13T12:05:00Z"
  }
}
```

- **Kody błędów:**
  - 400 Bad Request – w przypadku błędnych danych wejściowych
  - 401 Unauthorized – brak autoryzacji
  - 500 Internal Server Error – przy awariach serwera

## 5. Przepływ danych

1. Uwierzytelnienie i autoryzacja: Endpoint sprawdza, czy użytkownik jest zalogowany (np. poprzez supabase z context.locals).
2. Walidacja danych: Dane wejściowe poddane walidacji przy użyciu biblioteki zod, sprawdzając zakresy dla mood_level (1-5) i energy_level (1-3).
3. Operacja w bazie danych: Wstawienie nowego rekordu do tabeli check_ins przy użyciu transakcji, aby zachować integralność danych.
4. Generacja powiązanego zadania: Opcjonalnie, w oparciu o pewne kryteria (np. określone wartości nastroju lub energii), utworzenie rekordu w tabeli user_tasks.
5. Zwrócenie odpowiedzi: Endpoint zwraca JSON z utworzonym check-in oraz, jeśli dotyczy, wygenerowanym zadaniem.

## 6. Względy bezpieczeństwa

- Weryfikacja autoryzacji użytkownika (np. middleware z Astro, wykorzystujący supabase w context.locals).
- Użycie walidacji wejścia (zod) w celu zabezpieczenia przed złośliwymi danymi.
- Ograniczenie dostępności endpointu tylko dla uwierzytelnionych użytkowników.
- Ochrona przed nadużyciami (rate limiting, monitorowanie nietypowych zachowań).

## 7. Obsługa błędów

- **400 Bad Request:**
  - Błędne dane wejściowe, np. spoza zakresu wartości dla mood_level lub energy_level.
- **401 Unauthorized:**
  - Żądanie pochodzi od nieautoryzowanego użytkownika.
- **500 Internal Server Error:**
  - Problemy z bazą danych lub błędy serwerowe.

Wszelkie błędy powinny być logowane zgodnie z ustalonymi procedurami (np. dedykowana tabela lub system logowania) w celu ułatwienia analizy i monitorowania.

## 8. Rozważania dotyczące wydajności

- Zoptymalizowane zapytania do bazy danych – wykorzystanie indeksów dla pól takich jak user_id.
- Użycie transakcji, aby zapewnić spójność danych przy złożonych operacjach (check_in + opcjonalne zadanie).
- Optymalizacja walidacji wejścia przy użyciu bibliotek takich jak zod, aby minimalizować narzut.

## 9. Etapy wdrożenia

1. **Przygotowanie middleware:** Weryfikacja autoryzacji użytkownika, używanie supabase z context.locals.
2. **Implementacja walidacji:** Utworzenie schematu walidacji dla CreateCheckInCommand przy użyciu zod.
3. **Warstwa serwisowa:** Wyodrębnienie logiki check-in do oddzielnej warstwy serwisowej (np. w katalogu src/lib/services), obsługującej:
   - Walidację danych
   - Transakcję wstawiania danych do tabeli check_ins
   - Opcjonalną generację zadania w tabeli user_tasks
4. **Implementacja endpointu:** Utworzenie API endpointu POST /api/checkins oraz integracja z warstwą serwisową.
5. **Obsługa błędów i logowanie:** Dodanie mechanizmów przechwytywania błędów oraz logowania zgodnie z przyjętymi zasadami.
6. **Testy:** Przygotowanie testów integracyjnych i jednostkowych, sprawdzających poprawność walidacji, logiki biznesowej oraz obsługi błędów.
7. **Dokumentacja:** Aktualizacja dokumentacji API, w tym zaktualizowanie specyfikacji w repozytorium oraz przekazanie zespołowi wskazówek dotyczących wdrożenia.
8. **Wdrożenie:** Wprowadzenie zmian na środowisko testowe, monitorowanie logów oraz stopniowe wdrażanie na produkcję.

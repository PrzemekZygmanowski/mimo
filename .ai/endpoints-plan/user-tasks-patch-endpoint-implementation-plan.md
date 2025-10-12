# API Endpoint Implementation Plan: PATCH /api/user-tasks/:id

## 1. Przegląd punktu końcowego

Endpoint umożliwia aktualizację zadania użytkownika, np. oznaczenie zadania jako ukończone, pominięte lub zgłoszenie żądania nowego zadania. Użytkownik wysyła żądanie PATCH z identyfikatorem zadania oraz danymi do aktualizacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: /api/user-tasks/:id
- **Parametry**:
  - **Wymagane**:
    - Parametr ścieżki `id` (identyfikator zadania)
    - W ciele żądania co najmniej pole `status`
  - **Opcjonalne**:
    - `new_task_requests` (jeśli dotyczy dodatkowego żądania zadania)
- **Request Body** (przykładowa struktura):
  ```json
  {
    "status": "completed"
  }
  ```

## 3. Wykorzystywane typy

- **DTO**: `UserTaskDTO` (reprezentuje zadanie użytkownika)
- **Command Model**: `UpdateUserTaskCommand` (częściowa aktualizacja pól, głównie `status` i `new_task_requests`)

## 4. Szczegóły odpowiedzi

- **Kod statusu 200 OK**: Zwraca zaktualizowany rekord zadania w formacie JSON, np.:
  ```json
  {
    "id": "task-id",
    "status": "completed",
    "completed_at": "2025-10-12T15:00:00Z"
  }
  ```
- **Kod statusu 400 Bad Request**: W przypadku nieprawidłowych danych wejściowych (np. przekroczenie limitu żądań nowych zadań)
- **Kod statusu 401 Unauthorized**: Gdy użytkownik nie jest uwierzytelniony
- **Kod statusu 404 Not Found**: Gdy zadanie o podanym identyfikatorze nie istnieje
- **Kod statusu 500 Internal Server Error**: W przypadku błędów serwerowych

## 5. Przepływ danych

1. Autoryzacja i uwierzytelnienie użytkownika – upewnienie się, że użytkownik ma dostęp do zasobu.
2. Pobranie zadania użytkownika z bazy danych na podstawie identyfikatora (`id`) oraz weryfikacja, że zadanie należy do użytkownika.
3. Walidacja danych wejściowych – sprawdzenie poprawności parametrów, np. czy `status` jest dozwolony oraz czy liczba `new_task_requests` nie przekracza limitu (maksymalnie 3).
4. Aktualizacja rekordu w bazie danych, z uwzględnieniem aktualizacji pól takich jak `status`, ewentualnie `completed_at` (w przypadku zakończenia zadania) oraz `new_task_requests`.
5. Zapisanie zmian w bazie danych i zwrócenie zaktualizowanego rekordu jako odpowiedzi.

## 6. Względy bezpieczeństwa

- **Uwierzytelnianie i autoryzacja**: Endpoint powinien sprawdzać, czy żądanie pochodzi od autoryzowanego użytkownika. Wykorzystać mechanizmy zabezpieczeń dostępne w Supabase oraz RLS (Row Level Security) w bazie danych.
- **Walidacja danych**: Użycie walidatorów (np. z użyciem biblioteki Zod) w celu zapobiegania przesłaniu nieprawidłowych danych.
- **Ograniczenia operacji**: Zapewnić, że użytkownik może aktualizować tylko zadania, które do niego należą.

## 7. Obsługa błędów

- **400 Bad Request**: Zwracane w przypadku nieprawidłowych danych wejściowych lub przekroczenia limitu nowych żądań zadania.
- **401 Unauthorized**: Gdy użytkownik nie jest uwierzytelniony lub nie ma odpowiednich uprawnień.
- **404 Not Found**: Gdy zadanie o podanym identyfikatorze nie istnieje lub nie jest powiązane z aktualnym użytkownikiem.
- **500 Internal Server Error**: Błędy nieoczekiwane lub problemy z bazą danych – tutaj możliwa jest rejestracja błędów w systemie logowania aplikacji.

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Wykorzystanie indeksów na kolumnie `user_id` i `task_date` w tabeli `user_tasks` w celu przyspieszenia wyszukiwania.
- **RLS (Row Level Security)**: Korzystanie z mechanizmów RLS w celu ograniczenia operacji tylko do zasobów należących do danego użytkownika.
- **Caching**: Rozważenie implementacji cache'owania dla operacji odczytu, jeśli endpoint jest często wywoływany.

## 9. Etapy wdrożenia

1. **Planowanie i definiowanie wymagań**:
   - Dokładne przeanalizowanie specyfikacji API oraz dokumentacji bazy danych.
   - Zidentyfikowanie używanych typów (DTO, Command Model) oraz potrzebnych walidatorów.
2. **Implementacja walidacji danych**:
   - Zaimplementowanie walidacji wejścia z użyciem Zod lub innej biblioteki walidującej.
   - Sprawdzenie limitu `new_task_requests` oraz poprawności pola `status`.
3. **Logika biznesowa (service layer)**:
   - Utworzenie lub rozszerzenie istniejącego serwisu `userTasksService` w celu obsługi aktualizacji zadania.
   - Wprowadzenie logiki weryfikacji posiadania zadania przez użytkownika.
4. **Aktualizacja rekordu w bazie danych**:
   - Implementacja metody aktualizacji, która pobiera zadanie, weryfikuje dane i zapisuje zmiany w bazie.
5. **Obsługa błędów i logowanie**:
   - Zaimplementowanie mechanizmu obsługi błędów, rejestracji awarii oraz zwracania odpowiednich kodów statusu.
6. **Testy jednostkowe i integracyjne**:
   - Przygotowanie testów pokrywających przypadki poprawnych operacji, walidacji danych, błędów autoryzacji oraz sytuacji, gdy zadanie nie istnieje.
7. **Review i wdrożenie**:
   - Code review, testy w środowisku developerskim, a następnie wdrożenie do środowiska produkcyjnego.

---

Plan powinien być regularnie aktualizowany w miarę postępu prac oraz na podstawie feedbacku zespołu.

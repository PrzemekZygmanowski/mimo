# API Endpoint Implementation Plan: Create Daily Check-In

## 1. Przegląd punktu końcowego

Endpoint ten umożliwia użytkownikowi przesłanie codziennego check-in, zawierającego ocenę nastroju i poziomu energii. Podczas tworzenia check-in, system generuje również zadanie (task) dopasowane do podanych parametrów, zwracając identyfikator check-in oraz szczegóły przypisanego zadania.

## 2. Szczegóły żądania

- **Metoda HTTP:** POST
- **Struktura URL:** `/api/check-ins`
- **Parametry w żądaniu (Request Body):**
  - **Wymagane:**
    - `userId` (UUID) – identyfikator użytkownika
    - `mood_level` (liczba całkowita, 1–5) – ocena nastroju
    - `energy_level` (liczba całkowita, 1–3) – poziom energii
  - **Opcjonalne:**
    - `notes` (string) – dodatkowe notatki

## 3. Wykorzystywane typy

- **DTO i Command Modele:**
  - `CreateCheckInDto` (zdefiniowany jako `Omit<Database["public"]["Tables"]["check_ins"]["Insert"], "id">`)
  - `CreateCheckInResponseDto` (zawiera `checkInId` oraz `assignedTask` z polami: `taskId`, `taskDetails`, `message`)
  - (Ewentualnie) `CreateCheckInCommand` – wykorzystywany wewnętrznie do przetwarzania logiki biznesowej.

## 4. Szczegóły odpowiedzi

- **Struktura odpowiedzi:**
  ```json
  {
    "checkInId": "uuid",
    "assignedTask": {
      "taskId": "uuid",
      "taskDetails": "Do a 10 minute walk",
      "message": "Based on your energy, we suggest a light activity."
    }
  }
  ```
- **Kody statusu:**
  - 201: Pomyślne utworzenie (Check-In oraz przydzielone zadanie)
  - 400: Błędy walidacji np. niepoprawne wartości mood_level/energy_level
  - 401: Nieautoryzowany dostęp
  - 500: Błąd serwera

## 5. Przepływ danych

1. Klient wysyła żądanie POST na `/api/check-ins` z danymi check-in.
2. Warstwa kontrolera sprawdza token JWT i autoryzuje dostęp.
3. Dane wejściowe są walidowane przy wykorzystaniu np. Zod, zgodnie z limitami mood_level (1–5) i energy_level (1–3).
4. Logika biznesowa (w serwisie) przetwarza żądanie:
   - Wpisuje nowy rekord do tabeli `check_ins`.
   - Na podstawie parametrów wywołuje logikę przypisania zadania (np. pobiera task template, który spełnia kryteria) i tworzy rekord w tabeli `user_tasks`.
5. Usługa zwraca utworzony `checkInId` oraz szczegóły przypisanego zadania.

## 6. Względy bezpieczeństwa

- Autoryzacja: Endpoint wymaga poprawnego tokena JWT, co zapewnia Supabase.
- Walidacja: Dane wejściowe weryfikowane przez walidatory (np. Zod) aby upewnić się, że wartości `mood_level` i `energy_level` mieszczą się w dozwolonym zakresie.
- RLS: Zastosowanie polityk Row Level Security (RLS) w tabelach, aby upewnić się, że użytkownicy mają dostęp tylko do swoich danych.

## 7. Obsługa błędów

- **400 Bad Request:** Gdy walidacja danych wejściowych się nie powiedzie
- **401 Unauthorized:** Gdy brak lub nieważny token JWT
- **404 Not Found:** W przypadku odnalezienia nieistniejących zasobów, choć dla tego endpointu spodziewamy się raczej 400 lub 500
- **500 Internal Server Error:** W przypadku niespodziewanych błędów w systemie

## 8. Rozważania dotyczące wydajności

- Indeksowanie: Wykorzystanie indeksów (np. na kolumnie `user_id` oraz `task_date` w tabeli `user_tasks`) w celu przyspieszenia operacji wyszukiwania i wstawiania.
- Optymalizacja zapytań: Minimalizacja liczby zapytań do bazy danych przez łączenie operacji tam, gdzie to możliwe.
- Skalowalność: Zaprojektowanie usługi z myślą o skalowaniu, w sytuacjach gdy liczba użytkowników i operacji gwałtownie wzrośnie.

## 9. Etapy wdrożenia

1. **Utworzenie routingu:** Dodanie endpointa w `src/pages/api/check-ins` (lub analogicznym folderze dla API w Astro).
2. **Walidacja danych:** Implementacja walidatora dla danych wejściowych przy użyciu Zod lub innej biblioteki walidacyjnej.
3. **Logika serwisowa:** Utworzenie/uszczegółowienie serwisu, który:
   - Wstawia dane check-in do bazy (tabela `check_ins`).
   - Wykonuje logikę przypisania zadania (tworzy rekord w `user_tasks` na podstawie task templates).
4. **Autoryzacja:** Weryfikacja tokena JWT i zastosowanie polityk RLS, korzystając z Supabase (zgodnie z @backend.mdc i @astro.mdc).
5. **Obsługa błędów:** Implementacja centralnego mechanizmu obsługi błędów, zwracającego odpowiednie kody statusu (400, 401, 500).
6. **Testy:** Napisać testy jednostkowe i integracyjne dla endpointu, aby zweryfikować poprawność walidacji, logiki biznesowej i obsługi błędów.
7. **Dokumentacja:** Uaktualnić dokumentację API oraz przekazać plan wdrożenia zespołowi developerskiemu.

**Referencje:**

- [@types](./src/types.ts) dla definicji typów
- [@tech-stack.md](./.ai/tech-stack.md) dla szczegółów stosu technologicznego
- [@shared.mdc, @backend.mdc, @astro.mdc](./.cursor/rules/) dla zasad implementacji

# API Endpoint Implementation Plan: GET /api/plants-progress

## 1. Przegląd punktu końcowego

Endpoint przeznaczony do pobierania stanu ogrodu użytkownika (system nagród). Umożliwia odczytanie aktualnego stanu planszy roślin, co jest kluczową funkcjonalnością aplikacji w zakresie monitorowania postępów użytkownika.

## 2. Szczegóły żądania

- **Metoda HTTP:** GET
- **Struktura URL:** `/api/plants-progress`
- **Parametry:**
  - **Wymagane:** Brak dodatkowych parametrów – identyfikacja użytkownika odbywa się przez mechanizmy autoryzacji (np. Supabase Auth oraz RLS).
  - **Opcjonalne:** Brak
- **Request Body:** Nie dotyczy

## 3. Wykorzystywane typy

- **PlantsProgressDTO** (zdefiniowany w `src/types.ts`):
  - `user_id`: string (UUID)
  - `board_state`: Json (reprezentacja stanu planszy 5x6)
  - `last_updated_at`: string (timestamp)

## 4. Szczegóły odpowiedzi

- **Status 200 OK** – zwracany dla prawidłowego odczytu
- **Struktura odpowiedzi (JSON):**
  ```json
  {
    "user_id": "user-id",
    "board_state": {
      /* 5x6 grid state as JSON */
    },
    "last_updated_at": "2025-10-12T16:00:00Z"
  }
  ```
- Inne kody statusu:
  - **401 Unauthorized** – jeśli użytkownik nie jest uwierzytelniony
  - **404 Not Found** – jeśli rekord nie zostanie znaleziony
  - **500 Internal Server Error** – w przypadku błędów po stronie serwera

## 5. Przepływ danych

1. Klient wysyła żądanie GET na endpoint `/api/plants-progress`.
2. Mechanizmy autoryzacyjne (np. Supabase Auth oraz RLS) weryfikują tożsamość użytkownika.
3. Usługa (service) odpowiedzialna za logikę biznesową pobiera rekord z tabeli `user_plants_progress` dla danego `user_id`.
4. Pobierany jest JSON zawierający stan planszy (`board_state`) oraz znacznik czasowy ostatniej aktualizacji (`last_updated_at`).
5. Ostateczna odpowiedź jest zwracana w formacie JSON z kodem statusu 200.

## 6. Względy bezpieczeństwa

- **Autoryzacja i uwierzytelnianie:**
  - Wykorzystanie Supabase Auth do zapewnienia, że tylko uwierzytelnieni użytkownicy mogą uzyskać dostęp do danych.
  - RLS (Row Level Security) w tabeli `user_plants_progress` gwarantuje, że użytkownik może odczytać tylko swój rekord.
- **Walidacja danych:**
  - Brak danych wejściowych do walidacji, jednak odpowiedź powinna być dodatkowo walidowana pod kątem formatu JSON.
- **Rejestrowanie błędów:**
  - Błędy krytyczne powinny być logowane przy użyciu istniejącego systemu logowania (np. w `src/lib/logger.ts`).

## 7. Obsługa błędów

- **401 Unauthorized:**
  - Odpowiedź, gdy użytkownik nie jest uwierzytelniony.
- **404 Not Found:**
  - Zwracane, gdy rekord `user_plants_progress` nie zostanie znaleziony dla danego `user_id`.
- **500 Internal Server Error:**
  - Używane w przypadku wystąpienia błędów po stronie serwera (np. problemy z bazą danych).

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych:**
  - Upewnić się, że kolumna `user_id` w tabeli `user_plants_progress` posiada indeks, co zapewni szybki dostęp do rekordu.
- **Cache’owanie:**
  - Rozważyć mechanizmy cache’owania dla często odczytywanych danych, jeśli obciążenie aplikacji tego wymaga.

## 9. Etapy wdrożenia

1. **Analiza i planowanie:**
   - Weryfikacja obecności danych w tabeli `user_plants_progress` i konfiguracja RLS.
2. **Implementacja usługi:**
   - Utworzenie lub rozbudowa serwisu w `src/lib/services` odpowiedzialnego za pobieranie stanu ogrodu.
3. **Stworzenie endpointu:**
   - Utworzenie pliku endpointu w `src/pages/api/plants-progress.ts` zgodnie z zaleceniami Astro dla API routes.
4. **Integracja walidacji i autoryzacji:**
   - Implementacja weryfikacji tożsamości użytkownika oraz mechanizmów RLS.
5. **Implementacja logiki biznesowej:**
   - Pobieranie rekordu z bazy, obsługa sytuacji braku rekordu (404) oraz błędów po stronie serwera (500).
6. **Testowanie:**
   - Testy jednostkowe i integracyjne endpointu, weryfikacja poprawności odpowiedzi i kodów statusu.
7. **Dokumentacja:**
   - Aktualizacja dokumentacji API i wewnętrznych materiałów dla zespołu.
8. **Deploy i monitoring:**
   - Wdrożenie na środowisko testowe oraz monitorowanie wydajności i logów błędów.

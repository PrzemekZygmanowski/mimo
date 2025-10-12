# API Endpoint Implementation Plan: GET /api/task-templates/:id

## 1. Przegląd punktu końcowego
Endpoint odpowiada na żądanie pobrania szczegółowych informacji o szablonie zadania (task template) na podstawie jego identyfikatora. Umożliwia klientowi pobranie danych, które zostaną wykorzystane do wyświetlenia opisu zadania w interfejsie użytkownika.

## 2. Szczegóły żądania
- **Metoda HTTP**: GET
- **Struktura URL**: /api/task-templates/:id
- **Parametry**:
  - **Wymagane**:
    - `id` (parametr ścieżki) – identyfikator szablonu zadania (BIGSERIAL, liczba)
  - **Opcjonalne**: żadnych
- **Request Body**: Brak

## 3. Wykorzystywane typy
- **TaskTemplateDTO**: Wykorzystywany do reprezentacji danych pobranych z bazy danych.
  - Zawiera pola: `id`, `title` (odpowiadający "name"), `description`, `required_mood_level`, `required_energy_level`, `metadata`, `created_at`, `updated_at`.
- **Response Transformation**:
  - Zwracany obiekt powinien zawierać:
    - `id`: identyfikator szablonu
    - `name`: wartość pola `title` z bazy danych
    - `description`: opis zadania
    - `constraints`: obiekt zawierający:
      - `mood_level`: stała lista [1, 2, 3, 4, 5]
      - `energy_level`: stała lista [1, 2, 3]

## 4. Przepływ danych
1. Klient wysyła żądanie GET z identyfikatorem szablonu jako część ścieżki.
2. Warstwa kontrolera wywołuje logikę serwisową odpowiedzialną za pobranie rekordu z bazy danych (np. poprzez Supabase).
3. Serwis:
   - Waliduje parametr `id` (musi być poprawną liczbą).
   - Wysyła zapytanie do bazy danych, pobierając rekord typu **TaskTemplateDTO**.
   - Jeśli rekord zostanie znaleziony, transformuje dane:
     - Mapowanie pola `title` na `name`.
     - Dodaje pole `constraints` z ustalonymi zakresami dla `mood_level` i `energy_level`.
4. Ostatecznie, kontroler zwraca odpowiedź JSON z kodem statusu 200.

## 5. Względy bezpieczeństwa
- **Autoryzacja**: Jeśli endpoint ma być chroniony, należy sprawdzić uprawnienia użytkownika (np. przy pomocy middleware lub mechanizmu RLS w Supabase).
- **Walidacja**: Upewnić się, że przekazany identyfikator jest poprawnego formatu (liczba).
- **Row Level Security**: Korzystanie z RLS zapewnione przez konfigurację Supabase.

## 6. Obsługa błędów
- **Błąd walidacji**:
  - Jeśli `id` nie jest poprawną liczbą → zwrócić 400 Bad Request.
- **Nie znaleziono zasobu**:
  - Jeśli żaden rekord nie został znaleziony → zwrócić 404 Not Found.
- **Błąd serwera**:
  - W przypadku błędów po stronie bazy danych lub nieoczekiwanych wyjątków → zwrócić 500 Internal Server Error oraz zalogować błąd.

## 7. Rozważania dotyczące wydajności
- **Indeksowanie**: Zapewnienie, że kolumna `id` w tabeli task_templates ma indeks (domyślnie PRIMARY KEY), co przyspieszy wyszukiwanie.
- **Caching**: Rozważyć cache’owanie odpowiedzi dla często pobieranych szablonów, jeśli obciążenie jest wysokie.
- **Optymalizacja zapytań**: Ograniczyć zwracane pola tylko do tych wymaganych do wyświetlenia odpowiedzi.

## 8. Etapy wdrożenia
1. **Walidacja identyfikatora**:
   - Sprawdzenie, czy parametr `id` jest poprawnie sformatowaną liczbą.
2. **Implementacja logiki serwisowej**:
   - Utworzenie (lub modyfikacja) serwisu `TaskTemplateService` z metodą `getTaskTemplateById(id: number)`.
   - Pobranie rekordu z bazy danych oraz transformacja danych (mapowanie `title` na `name` i dodanie `constraints`).
3. **Implementacja warstwy kontrolera**:
   - Utworzenie nowego endpointa w `/src/pages/api/task-templates/[id].ts` lub odpowiedniej lokalizacji.
   - Integracja z logiką serwisową oraz obsługa zwracania odpowiednich kodów statusu.
4. **Obsługa błędów**:
   - Implementacja obsługi błędów i zwracanie prawidłowych kodów statusu.
   - Logowanie wszelkich nieoczekiwanych błędów.
5. **Testowanie**:
   - Utworzenie testów jednostkowych dla serwisu oraz endpointa.
   - Manualne testowanie żądania GET z prawidłowym ID oraz scenariuszy, w których występują błędy (np. invalid id, brak rekordu).
6. **Dokumentacja i code review**:
   - Zaktualizowanie dokumentacji API.
   - Przeprowadzenie code review i integracja z systemem CI/CD.

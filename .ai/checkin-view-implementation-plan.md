# Plan implementacji widoku CheckIn

## 1. Przegląd

Widok służy do zebrania od użytkownika poziomu nastroju (1–5), poziomu energii (1–3) oraz opcjonalnych notatek. Na podstawie tych danych zostanie utworzony nowy check-in i (opcjonalnie) wygenerowane spersonalizowane zadanie.

## 2. Routing widoku

Ścieżka: `/checkin`

## 3. Struktura komponentów

- CheckInPage
  - CheckInForm
    - MoodSelector
    - EnergySelector
    - NotesInput
    - SubmitButton

## 4. Szczegóły komponentów

### CheckInPage

- Opis komponentu: Kontener widoku, inicjalizuje stan i ładuje niezbędne konteksty.
- Główne elementy: `CheckInForm`
- Obsługiwane interakcje: Brak własnych, przekazuje propsy do formularza
- Warunki walidacji: Brak (delegowane do formularza)
- Typy: Brak
- Propsy: Brak
- Warunek wyświetlania: formularz dostępny tylko, gdy użytkownik nie ma aktywnego zadania (`activeTask == null`)

### CheckInForm

- Opis komponentu: Formularz zbierający dane od użytkownika.
- Główne elementy:
  - MoodSelector (radiogroup ARIA)
  - EnergySelector (radiogroup ARIA)
  - NotesInput (textarea z ARIA-label)
  - SubmitButton (Shadcn/ui Button z loading state)
- Obsługiwane interakcje:
  - Zmiana wartości mood i energy
  - Wpisywanie notatek
  - Kliknięcie przycisku wyślij
- Obsługiwana walidacja:
  - mood_level: wartość wybrana (required)
  - energy_level: wartość wybrana (required)
  - notes (opcjonalne): max 500 znaków
- Typy:
  - CreateCheckInViewModel { mood_level: number; energy_level: number; notes?: string }
- Propsy:
  - onSubmit(data: CreateCheckInViewModel): void

### MoodSelector

- Opis komponentu: Zestaw ikon reprezentujących poziomy nastroju w radiogroup.
- Główne elementy: Shadcn/ui RadioGroup z 5 opcji, każda zawiera ikonę i label.
- Obsługiwane interakcje: Wybór opcji
- Warunki walidacji: Wymagana wartość
- Typy:
  - { value: number; label: string; icon: ReactNode }[]
- Propsy:
  - selected: number
  - onChange(value: number): void

### EnergySelector

- Opis komponentu: Zestaw ikon reprezentujących poziomy energii w radiogroup.
- Główne elementy: Shadcn/ui RadioGroup z 3 opcji, każda zawiera ikonę i label.
- Obsługiwane interakcje: Wybór opcji
- Warunki walidacji: Wymagana wartość
- Typy:
  - { value: number; label: string; icon: ReactNode }[]
- Propsy:
  - selected: number
  - onChange(value: number): void

### NotesInput

- Opis komponentu: Pole textarea na dodatkowe notatki.
- Główne elementy: HTML `<textarea>`
- Obsługiwane interakcje: Wpisywanie tekstu
- Warunki walidacji: maxLength=500
- Typy: none
- Propsy:
  - value?: string
  - onChange(value: string): void

### SubmitButton

- Opis komponentu: Przycisk wysyłający formularz.
- Główne elementy: Shadcn/ui `<Button>`
- Obsługiwane interakcje: Kliknięcie
- Warunki walidacji: Disabled gdy formularz niepoprawny lub wysyłanie w toku
- Typy: none
- Propsy:
  - isLoading: boolean
  - disabled: boolean

## 5. Typy

- CreateCheckInViewModel:
  ```ts
  interface CreateCheckInViewModel {
    mood_level: number; // 1-5
    energy_level: number; // 1-3
    notes?: string; // max 500
  }
  ```

## 6. Zarządzanie stanem

- Użycie React Context (`CheckInContext`) do przechowywania i udostępniania `activeTask` oraz operacji związanych z pobieraniem statusu aktywnego zadania.
- Opcjonalny hook `useOfflineQueue` do kolejkowania żądań offline.

## 7. Integracja API

- Wywołanie `POST /api/checkins` z `fetch` lub `axios`.
- Body: `CreateCheckInViewModel`, nagłówki: `Content-Type: application/json`.
- Oczekiwany response: `CheckInDTO`.
- Obsługa statusu 201: przekierowanie do widoku zadania lub głównego ekranu z komunikatem.

## 8. Interakcje użytkownika

- Wybór nastroju i energii: aktualizacja stanu
- Wpisanie notatek: aktualizacja stanu
- Kliknięcie Wyślij: walidacja, wywołanie API, pokazanie loadera, po sukcesie przekierowanie lub komunikat sukcesu

## 9. Warunki i walidacja

- mood_level i energy_level muszą być ustawione przed wysłaniem
- Brak aktywnego zadania (`activeTask == null`) jest wymagany do wykonania check-inu
- notes <= 500 zn
- Formularz disabled, gdy walidacja nie przejdzie

## 10. Obsługa błędów

- 400: wyświetlić walidacyjne komunikaty pod odpowiednimi polami
- 401: przekierowanie do logowania
- 500: ogólny komunikat błędu toast/alert

## 11. Kroki implementacji

1. Utworzyć plik `src/pages/checkin.astro` i osadzić komponent `CheckInPage`, dodając logikę pobierania aktywnego zadania i warunkową prezentację formularza
2. Stworzyć React Context `CheckInContext`, który zapewnia `activeTask` oraz funkcję `refreshActiveTask()` do ładowania statusu zadania.
3. Owinąć `CheckInPage` w `CheckInContext.Provider` w pliku `src/pages/checkin.astro`.
4. Zaimportować i skonfigurować Shadcn/ui w projekcie
5. Stworzyć komponenty `CheckInForm`, `MoodSelector`, `EnergySelector`, `NotesInput`, `SubmitButton`
6. Zaimportować typ `CreateCheckInViewModel`, `CheckInDTO` z `src/types.ts`
7. Dodać stan w `CheckInForm` za pomocą `useState` i opcjonalnie `useOfflineQueue`
8. Implementować UI z Tailwind zgodnie z design system
9. Dodać walidację i zabezpieczenie przed wielokrotnym wysłaniem
10. Zaimplementować wywołanie API w `onSubmit`
11. Obsłużyć odpowiedzi i błędy, przekierowania lub komunikaty
12. Napisać testy integracyjne dla `CheckInForm`

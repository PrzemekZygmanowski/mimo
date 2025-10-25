# Przewodnik testowania - Widok Check-In

## Uwaga dotycząca testów automatycznych

Testy automatyczne w `CheckInForm.test.ts` wymagają **Node.js 18+**. Obecnie projekt działa na Node 14.17.4, co uniemożliwia uruchomienie Vitest i @testing-library/react.

**Aby uruchomić testy automatyczne:**

```bash
# Zaktualizuj Node.js do wersji 18 lub wyższej
# Następnie uruchom:
npm install
npx vitest run src/components/CheckInForm.test.ts
```

## Testy manualne - Przewodnik krok po kroku

### Przygotowanie środowiska testowego

1. **Uruchom serwer deweloperski:**

   ```bash
   npm run dev
   ```

2. **Otwórz przeglądarkę:**
   - Przejdź do `http://localhost:4321/checkin`
   - Otwórz DevTools (F12)

---

## Test 1: Podstawowy przepływ użytkownika (Happy Path)

### Kroki testowe:

1. ✅ Otwórz stronę `/checkin`
2. ✅ Sprawdź czy formularz się wyświetla
3. ✅ Kliknij na ikonę nastroju "3 - Neutralnie"
4. ✅ Sprawdź wizualne zaznaczenie (border-primary, bg-accent)
5. ✅ Kliknij na ikonę energii "2 - Średnia energia"
6. ✅ Sprawdź wizualne zaznaczenie
7. ✅ Wpisz w notatki: "Test check-in"
8. ✅ Kliknij przycisk "Wyślij"
9. ✅ Sprawdź czy przycisk zmienia się na "Wysyłanie..."
10. ✅ Sprawdź response w Network tab (DevTools)

### Oczekiwany rezultat:

- Request POST do `/api/checkins` z body:
  ```json
  {
    "mood_level": 3,
    "energy_level": 2,
    "notes": "Test check-in"
  }
  ```
- Status 201 (Created) lub przekierowanie
- Brak błędów w konsoli

---

## Test 2: Walidacja wymaganych pól

### Kroki testowe:

1. ✅ Otwórz stronę `/checkin`
2. ✅ NIE wybieraj nastroju ani energii
3. ✅ Kliknij "Wyślij"

### Oczekiwany rezultat:

- Komunikat błędu: "Wybierz poziom nastroju"
- Formularz nie jest wysyłany
- Button NIE zmienia się na "Wysyłanie..."

### Warianty:

**2a. Wybrano tylko nastrój:**

- Błąd: "Wybierz poziom energii"

**2b. Wybrano tylko energię:**

- Błąd: "Wybierz poziom nastroju"

---

## Test 3: Walidacja długości notatek

### Kroki testowe:

1. ✅ Wybierz nastrój: 4
2. ✅ Wybierz energię: 3
3. ✅ Wpisz w notatki tekst dłuższy niż 500 znaków:
   ```
   // Możesz użyć: "a".repeat(501)
   // Lub wkleić długi tekst
   ```
4. ✅ Spróbuj wysłać formularz

### Oczekiwany rezultat:

- Komunikat błędu: "Notatki mogą mieć maksymalnie 500 znaków"
- Formularz nie jest wysyłany
- Czerwony tekst pod polem notatek

---

## Test 4: Responsywność mobile

### Kroki testowe:

1. ✅ Otwórz DevTools (F12)
2. ✅ Włącz Device Toolbar (Ctrl+Shift+M / Cmd+Shift+M)
3. ✅ Wybierz "iPhone SE" (375px)
4. ✅ Sprawdź layout selektorów nastroju:
   - Powinny być w 3 kolumnach (nie 5)
   - Górny rząd: 3 ikony
   - Dolny rząd: 2 ikony
5. ✅ Sprawdź selektor energii (powinien być w 3 kolumnach)
6. ✅ Sprawdź czy wszystkie elementy są czytelne
7. ✅ Wypełnij i wyślij formularz

### Oczekiwany rezultat:

- Layout nie jest złamany
- Ikony są wystarczająco duże do kliknięcia (min 44x44px)
- Tekst jest czytelny
- Formularz działa identycznie jak na desktop

### Dodatkowe rozmiary do przetestowania:

- iPad (768px) - powinno być 5 kolumn dla nastroju
- Desktop (1920px) - powinno być 5 kolumn dla nastroju

---

## Test 5: Keyboard Navigation (Dostępność)

### Kroki testowe:

1. ✅ Otwórz stronę `/checkin`
2. ✅ **Schowaj mysz** (nie używaj jej w tym teście!)
3. ✅ Naciśnij **Tab** - focus powinien przejść na pierwszy przycisk nastroju
4. ✅ Naciśnij **Space** lub **Enter** - zaznacz opcję
5. ✅ Naciśnij **Tab** - focus przechodzi do następnej opcji/grupy
6. ✅ Zaznacz energię używając **Space**/**Enter**
7. ✅ **Tab** do pola notatek
8. ✅ Wpisz tekst
9. ✅ **Tab** do przycisku Submit
10. ✅ **Enter** aby wysłać

### Oczekiwany rezultat:

- Widoczny focus ring (niebieski/purpurowy outline) na każdym elemencie
- Możliwe zaznaczenie wszystkich opcji bez myszy
- Możliwe wypełnienie i wysłanie formularza
- Logiczna kolejność focus

---

## Test 6: Animacje i interakcje

### Kroki testowe:

1. ✅ Najedź myszą na ikonę nastroju (bez klikania)
2. ✅ Sprawdź efekt hover:
   - Powiększenie (scale-105)
   - Cień (shadow-md)
   - Zmiana koloru bordera (border-primary/50)
3. ✅ Kliknij na ikonę
4. ✅ Sprawdź efekt active (scale-95)
5. ✅ Sprawdź efekt selected:
   - Border-primary
   - bg-accent
   - Ikona powiększona (scale-110)
6. ✅ Sprawdź że animacje są płynne (transition-all duration-200)

### Oczekiwany rezultat:

- Hover daje wyraźny feedback
- Active state jest natychmiastowy
- Selected state jest trwały i wyraźny
- Brak "jumpów" czy migotania

---

## Test 7: Puste notatki i edge cases

### Test 7a: Formularz bez notatek

1. ✅ Wybierz nastrój: 2
2. ✅ Wybierz energię: 1
3. ✅ NIE wpisuj notatek (zostaw puste)
4. ✅ Wyślij formularz

**Oczekiwany rezultat:**

- Request body: `{ mood_level: 2, energy_level: 1 }` (bez `notes` lub `notes: undefined`)
- Status 201

### Test 7b: Notatki z samymi spacjami

1. ✅ Wpisz tylko spacje w notatki: " "
2. ✅ Wyślij formularz

**Oczekiwany rezultat:**

- Notes są trimowane, więc `notes: undefined` w request (puste po trim)

### Test 7c: Notatki ze znakami specjalnymi

1. ✅ Wpisz: "Test 123 !@# €$% 😊🎉"
2. ✅ Wyślij formularz

**Oczekiwany rezultat:**

- Notatki są wysłane poprawnie z wszystkimi znakami

---

## Test 8: Zmiana wyboru

### Kroki testowe:

1. ✅ Wybierz nastrój: 1 (Bardzo źle)
2. ✅ Sprawdź że jest zaznaczony
3. ✅ Wybierz nastrój: 5 (Bardzo dobrze)
4. ✅ Sprawdź że:
   - Poprzednie zaznaczenie zniknęło (1 nie jest już zaznaczone)
   - Nowe zaznaczenie jest aktywne (5 jest zaznaczone)
5. ✅ Powtórz dla selektora energii

### Oczekiwany rezultat:

- Tylko jedna opcja może być zaznaczona jednocześnie (radio behavior)
- Zmiana wyboru działa płynnie
- Poprzednie zaznaczenie jest usuwane

---

## Test 9: Błędy API (Error Handling)

### Test 9a: Symulacja błędu 401 (Unauthorized)

**Wymaga mockowania lub wylogowania użytkownika**

1. ✅ Wyloguj się z aplikacji (jeśli to możliwe)
2. ✅ Wypełnij formularz
3. ✅ Wyślij

**Oczekiwany rezultat:**

- Przekierowanie do strony logowania
- Lub komunikat: "Musisz być zalogowany"

### Test 9b: Symulacja błędu 500 (Server Error)

**Wymaga mockowania lub wyłączenia backendu**

1. ✅ Zatrzymaj backend (jeśli lokalny)
2. ✅ Wypełnij formularz
3. ✅ Wyślij

**Oczekiwany rezultat:**

- Komunikat błędu: "Wystąpił błąd serwera"
- Formularz pozostaje wypełniony (nie traci danych)
- Button wraca do stanu "Wyślij"

---

## Test 10: Multiple submissions (Double-click protection)

### Kroki testowe:

1. ✅ Wypełnij formularz prawidłowo
2. ✅ Kliknij "Wyślij"
3. ✅ SZYBKO kliknij ponownie wielokrotnie

### Oczekiwany rezultat:

- Przycisk jest disabled po pierwszym kliknięciu
- Tylko JEDEN request jest wysłany (sprawdź Network tab)
- Brak duplikacji check-inów

---

## Test 11: Kontrast kolorów (WCAG)

### Narzędzia:

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- DevTools Lighthouse > Accessibility

### Kroki testowe:

1. ✅ Uruchom Lighthouse audit (DevTools)
2. ✅ Sprawdź sekcję "Accessibility"
3. ✅ Sprawdź czy:
   - Contrast ratio dla tekstu: min 4.5:1
   - Contrast ratio dla UI elements: min 3:1
   - Focus indicators są widoczne

### Oczekiwany rezultat:

- Lighthouse score: min 90/100 dla Accessibility
- Brak ostrzeżeń o kontraście kolorów

---

## Test 12: Screen Reader (Opcjonalny ale zalecany)

### Narzędzia:

- **Windows**: NVDA (darmowy) - https://www.nvaccess.org/download/
- **macOS**: VoiceOver (wbudowany) - Cmd+F5
- **Chrome**: ChromeVox extension

### Kroki testowe:

1. ✅ Włącz screen reader
2. ✅ Nawiguj przez formularz używając Tab
3. ✅ Sprawdź co jest ogłaszane:
   - "Jak się dzisiaj czujesz?" - label grupy nastroju
   - "Wybierz poziom nastroju, radiogroup, 5 opcji"
   - "1 - Bardzo źle, radio button, nie zaznaczony"
   - Po kliknięciu: "Zaznaczony"

### Oczekiwany rezultat:

- Wszystkie elementy są ogłaszane
- Opisyłożne są ich role i stany
- Komunikaty błędów są ogłaszane

---

## Checklist szybkiego testowania

Użyj tej checklisty przed każdym commitem:

- [ ] Formularz wyświetla się poprawnie
- [ ] Można wybrać nastrój i energię
- [ ] Walidacja działa (brak nastroju/energii = błąd)
- [ ] Można wysłać prawidłowy formularz
- [ ] Button pokazuje "Wysyłanie..." podczas wysyłki
- [ ] Mobile layout działa (3 kolumny dla nastroju na <640px)
- [ ] Keyboard navigation działa (Tab, Space, Enter)
- [ ] Focus indicators są widoczne
- [ ] Animacje hover/active działają płynnie
- [ ] Brak błędów w konsoli przeglądarki

---

## Raportowanie błędów

Jeśli znajdziesz błąd, zgłoś go z następującymi informacjami:

```
**Opis błędu:**
(Krótki opis co nie działa)

**Kroki reprodukcji:**
1. ...
2. ...
3. ...

**Oczekiwane zachowanie:**
(Co powinno się stać)

**Aktualne zachowanie:**
(Co się dzieje)

**Środowisko:**
- Browser: (np. Chrome 120, Firefox 121)
- Device: (Desktop/Mobile, rozmiar ekranu)
- System: (Windows 11, macOS, etc.)

**Screenshots/Video:**
(Jeśli możliwe)

**Console errors:**
(Błędy z konsoli przeglądarki, jeśli są)
```

---

**Data utworzenia**: 2025-10-25
**Ostatnia aktualizacja**: 2025-10-25
**Wersja**: 1.0

# Architektura UI dla Mimo

## 1. Przegląd struktury UI

Aplikacja Mimo jest podzielona na dwie główne strefy:

- Publiczna (Logowanie/Rejestracja)
- Chroniona (po zalogowaniu) z dolnym paskiem nawigacji lub zakładkami: Check-in, Moje Zadanie, Ogród Postępów, Ustawienia

Struktura oparta na dwuwarstwowym layoutcie z dedykowanymi routami dla każdej sekcji, zarządzaniem sesją przez React Context i SWR oraz obsługą stanu offline.

## 2. Lista widoków

### 2.1 Logowanie/Rejestracja

- Ścieżka: `/login`
- Cel: Uwierzytelnienie użytkownika (anonimowe lub e-mail)
- Kluczowe informacje: pola e-mail/hasło, przyciski przełączania trybu (taby)
- Kluczowe komponenty: Taby logowania, formularz, walidacja, toasty błędów, spinner przy ładowaniu
- UX/dostępność/bezpieczeństwo: etykiety ARIA, focus management, szyfrowanie komunikacji HTTPS, maskowanie haseł

### 2.2 Check-in

- Ścieżka: `/checkin`
- Cel: Zbieranie poziomu nastroju i energii
- Kluczowe informacje: skala 1–5 nastroju, skala 1–3 energii, pole notatek opcjonalnych
- Kluczowe komponenty: zestaw przycisków z ikonami i opisami (Shadcn/ui), formularz, CTA „Wyślij” z loading state
- UX/dostępność/bezpieczeństwo: role radiogroup/grid, ARIA-labels, zabezpieczenie przed wielokrotnym wysłaniem, offline queue

### 2.3 Moje Zadanie

- Ścieżka: `/task`
- Cel: Wyświetlenie wygenerowanego zadania, akcje użytkownika
- Kluczowe informacje: treść zadania, instrukcje, czas wygaśnięcia
- Kluczowe komponenty: karta zadania (Card), przyciski: Wykonaj, Pomiń, Nowe zadanie; modal potwierdzenia pominięcia lub limitu
- UX/dostępność/bezpieczeństwo: feedback toast, blokada akcji po osiągnięciu limitu (max 3 nowe zadania/dzień), ARIA dla buttonów

### 2.4 Ogród Postępów

- Ścieżka: `/garden`
- Cel: Wizualizacja nagród jako rosnący ogródek (5×6)
- Kluczowe informacje: stan siatki SVG, data ostatniej aktualizacji
- Kluczowe komponenty: siatka grid (role=grid), komórki gridcell z SVG, skeleton podczas fetchowania
- UX/dostępność/bezpieczeństwo: ARIA roles, kontrast kolorów, dostępność keyboard

### 2.5 Ustawienia

- Ścieżka: `/settings`
- Cel: Edycja profilu i preferencji użytkownika
- Kluczowe informacje: dane użytkownika (email), opcje logout, tryb anonimowy
- Kluczowe komponenty: formularz profile, przycisk Zapisz, przycisk Wyloguj, spinner podczas zapisu
- UX/dostępność/bezpieczeństwo: walidacja, ochrona przed CSRF, ponowny login przy 401

## 3. Mapa podróży użytkownika

1. Użytkownik otwiera aplikację → automatyczne przekierowanie na `/login` (publiczny layout)
2. Loguje się (anonimowo lub e-mail) → token JWT zapisywany w React Context i lokalnie
3. Przekierowanie do `/checkin` → użytkownik wybiera nastrój i energię → POST `/api/checkins` → otrzymuje generated_task → redirect do `/task`
4. Na `/task` wykonuje jedną z akcji: Wykonaj → PATCH `/api/user-tasks/:id`, POST `/api/user-events`, PATCH `/api/plants-progress` → opcjonalnie GET `/api/plants-progress` → redirect do `/garden`
   - lub Pomiń/new → analogiczne ścieżki z odpowiednimi limitami i eventami
5. Użytkownik przegląda `/garden` → widzi zaktualizowany ogródek
6. W dowolnym momencie może przejść do `/settings` lub ponownie do `/checkin` po 24h/po wykonaniu/pominięciu zadania

## 4. Układ i struktura nawigacji

- Publiczny layout: prosty header i centralny formularz logowania
- Chroniony layout: dolny pasek nawigacji / boczny panel (desktop) z zakładkami: Check-in, Moje Zadanie, Ogród Postępów, Ustawienia
- Breadcrumbs lub nagłówek z nazwą widoku + globalny przycisk Wyloguj

## 5. Kluczowe komponenty

- Formularz logowania i taby (Shadcn/ui)
- Rzędowe przyciski wyboru nastroju i energii (Button Group)
- Karta zadania (Card) z CTA oraz modale potwierdzenia
- Siatka 5×6 (Grid) z SVG i skeleton loaders
- Toasty i spinnery (Toast, Skeleton)
- Layouty (PublicLayout, ProtectedLayout)
- React Context dla sesji i SWR hooks dla fetchowania danych

---


# Architektura UI dla Mimo

## 1. Przegląd struktury UI

Aplikacja Mimo jest podzielona na trzy główne strefy:

- Publiczna otwarta (Strona Główna)
- Publiczna uwierzytelniająca (Logowanie/Rejestracja)
- Chroniona (po zalogowaniu) z dolnym paskiem nawigacji lub zakładkami: Check-in, Moje Zadanie, Ogród Postępów, Ustawienia

Struktura oparta na wielowarstwowym layoutcie z dedykowanymi routami dla każdej sekcji, zarządzaniem sesją przez React Context i SWR oraz obsługą stanu offline.

## 2. Lista widoków

### 2.1 Strona Główna (US-001)

- Ścieżka: `/` (root)
- Cel: Punkt wejścia do aplikacji, routing do odpowiedniego widoku na podstawie stanu użytkownika
- Kluczowe informacje:
  - Tytuł aplikacji Mimo i krótki opis wartości aplikacji
  - Przycisk głównego CTA z inteligentnym routingiem
  - Stan uwierzytelnienia użytkownika
  - Stan dzisiejszego check-inu (jeśli zalogowany)
- Logika routingu:
  - **Użytkownik niezalogowany**: Wyświetla przycisk "Zacznij" → przekierowanie do `/login`
  - **Użytkownik zalogowany bez dzisiejszego check-inu**: Wyświetla przycisk "Wykonaj Check-in" → przekierowanie do `/checkin`
  - **Użytkownik zalogowany z dzisiejszym check-inem**: Wyświetla przycisk "Zobacz Moje Zadanie" → przekierowanie do `/task`
- Kluczowe komponenty:
  - Hero sekcja z tytułem i opisem
  - Główny przycisk CTA z dynamicznym tekstem i akcją
  - Opcjonalny przycisk logowania w prawym górnym rogu (dla niezalogowanych)
  - Loading state podczas weryfikacji stanu użytkownika
  - Skeleton loader podczas fetchowania danych
- UX/dostępność/bezpieczeństwo:
  - Czytelna hierarchia wizualna z dużym CTA
  - ARIA labels dla wszystkich interaktywnych elementów
  - Focus management na głównym CTA
  - Responsive design dla mobile-first
  - Optymistyczne ładowanie z graceful degradation
  - Brak wymuszania logowania - przyjazne wejście
- Przypadki brzegowe:
  - Błąd połączenia podczas sprawdzania stanu → pokazanie przycisku "Zacznij" z fallbackiem do logowania
  - Token wygasł → automatyczne wylogowanie i pokazanie stanu niezalogowanego
  - Check-in wykonany, ale brak zadania → przekierowanie do `/checkin` z komunikatem
- Mapowanie do API:
  - GET `/api/user-tasks` (z filtrem na dzisiejszą datę) - sprawdzenie czy istnieje zadanie z dzisiaj
  - Opcjonalnie: sprawdzenie stanu sesji przez kontekst autentykacji (token JWT)

### 2.2 Logowanie/Rejestracja

- Ścieżka: `/login`
- Cel: Uwierzytelnienie użytkownika (e-mail)
- Kluczowe informacje: pola e-mail/hasło, przyciski przełączania trybu (taby: Logowanie/Rejestracja/Odzyskiwanie hasła)
- Kluczowe komponenty: Taby logowania, formularz, walidacja, toasty błędów, spinner przy ładowaniu, link do odzyskiwania hasła
- UX/dostępność/bezpieczeństwo: etykiety ARIA, focus management, szyfrowanie komunikacji HTTPS, maskowanie haseł, walidacja po stronie klienta i serwera

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

### 3.1 Główna ścieżka użytkownika (User Story US-001, US-002, US-003)

1. **Punkt wejścia - Strona Główna** (US-001)
   - Użytkownik otwiera aplikację → ląduje na `/` (strona główna)
   - System sprawdza stan uwierzytelnienia:
     - Jeśli brak tokenu → wyświetla CTA "Zacznij"
     - Jeśli token istnieje → weryfikuje sesję i sprawdza dzisiejszy check-in (GET `/api/user-tasks?date=today`)
   - Dynamiczny routing na podstawie stanu

2. **Scenariusz A: Nowy użytkownik (niezalogowany)**
   - Strona główna wyświetla: "Zacznij" → kliknięcie → przekierowanie do `/login`
   - Użytkownik rejestruje się lub loguje (e-mail) → POST `/api/users` lub uwierzytelnienie przez Supabase
   - Token JWT zapisywany w React Context i localStorage
   - Po pomyślnym logowaniu → przekierowanie do `/` → system wykrywa brak dzisiejszego check-inu → automatyczne przekierowanie do `/checkin`

3. **Scenariusz B: Użytkownik zalogowany bez dzisiejszego check-inu** (US-002)
   - Strona główna wyświetla: "Wykonaj Check-in" → kliknięcie → przekierowanie do `/checkin`
   - Użytkownik wybiera nastrój (1-5) i energię (1-3) → POST `/api/checkins`
   - Backend generuje zadanie dopasowane do check-inu → zwraca `generated_task`
   - System loguje event → POST `/api/user-events` (CHECKIN_CREATED)
   - Przekierowanie do `/task` z ID nowo wygenerowanego zadania

4. **Scenariusz C: Użytkownik zalogowany z dzisiejszym check-inem** (US-003, US-004)
   - Strona główna wyświetla: "Zobacz Moje Zadanie" → kliknięcie → przekierowanie do `/task`
   - Wyświetlenie aktywnego zadania z opcjami:
     - **Wykonaj** → PATCH `/api/user-tasks/:id` (status: completed) → POST `/api/user-events` (TASK_DONE) → PATCH `/api/plants-progress` (aktualizacja ogródka) → przekierowanie do `/garden`
     - **Pomiń** → modal potwierdzenia → PATCH `/api/user-tasks/:id` (status: skipped) → POST `/api/user-events` (TASK_SKIPPED) → przekierowanie do `/garden` lub `/`
     - **Nowe zadanie** → walidacja limitu (max 3/dzień) → jeśli OK: PATCH `/api/user-tasks/:id` (increment new_task_requests) + generowanie nowego → refresh strony; jeśli limit: modal z neutralnym komunikatem

5. **Ogród Postępów**
   - W dowolnym momencie użytkownik może przejść do `/garden` → GET `/api/plants-progress`
   - Wyświetlenie siatki 5×6 z rosnącymi roślinami (SVG)
   - Breadcrumb lub przycisk powrotu do strony głównej

6. **Ustawienia i wylogowanie**
   - Przejście do `/settings` → edycja profilu, opcje użytkownika
   - Wylogowanie → czyszczenie tokenu → przekierowanie do `/` (stan niezalogowany)

### 3.2 Pętle i iteracje

- **Codziennie rano**: Użytkownik wraca na `/` → system wykrywa brak dzisiejszego check-inu → przekierowanie do `/checkin` → nowe zadanie → cykl się powtarza
- **Wielokrotne wykonanie zadań**: Użytkownik może wykonać do 3 zadań dziennie (zgodnie z US-003) → każde wykonanie aktualizuje ogródek
- **Po 24h od przydzielenia zadania**: Zadanie wygasa → użytkownik może wykonać nowy check-in

### 3.3 Alternatywne ścieżki

- **Użytkownik pomija zadanie wielokrotnie**: System loguje eventy, ale nie blokuje dostępu
- **Błąd API podczas check-inu**: Toast z komunikatem błędu → użytkownik może ponowić próbę
- **Token wygasł podczas sesji**: 401 response → automatyczne wylogowanie → przekierowanie do `/login` z komunikatem
- **Tryb offline**: Dane w kolejce (offline queue) → synchronizacja po powrocie połączenia

## 4. Układ i struktura nawigacji

### 4.1 Hierarchia layoutów

1. **Root Layout** (bazowy dla całej aplikacji)
   - Globalny nagłówek z logo Mimo (link do `/`)
   - Przycisk logowania/wylogowania w prawym górnym rogu (warunkowy)
   - Kontener dla child routes

2. **Public Home Layout** (dla strony głównej `/`)
   - Minimalistyczny design bez zbędnych elementów nawigacji
   - Hero sekcja z tytułem i głównym CTA
   - Opcjonalny przycisk "Zaloguj się" w nagłówku (dla niezalogowanych)
   - Brak dolnego paska nawigacji

3. **Public Auth Layout** (dla `/login`)
   - Prosty header z logo (link do `/`)
   - Centralny formularz logowania/rejestracji
   - Brak dolnego paska nawigacji

4. **Protected Layout** (dla wszystkich chronionych tras)
   - Dolny pasek nawigacji (mobile) / boczny panel (desktop) z zakładkami:
     - Check-in (`/checkin`)
     - Moje Zadanie (`/task`)
     - Ogród Postępów (`/garden`)
     - Ustawienia (`/settings`)
   - Breadcrumbs lub nagłówek z nazwą widoku
   - Globalny przycisk Wyloguj w prawym górnym rogu

### 4.2 Struktura nawigacji

```
/ (Strona Główna)
├── /login (Logowanie/Rejestracja)
└── [Protected Routes]
    ├── /checkin (Check-in)
    ├── /task (Moje Zadanie)
    ├── /garden (Ogród Postępów)
    └── /settings (Ustawienia)
```

### 4.3 Reguły nawigacji

- **Niezalogowani użytkownicy**:
  - Mają dostęp do: `/`, `/login`
  - Próba dostępu do chronionych tras → automatyczne przekierowanie do `/login`

- **Zalogowani użytkownicy**:
  - Mają dostęp do wszystkich tras
  - Kliknięcie logo w nagłówku → powrót do `/` (dynamiczny routing)
  - Dolny pasek nawigacji zawsze widoczny w chronionych trasach

- **Inteligentny routing z `/`**:
  - System automatycznie kieruje użytkownika do najbardziej odpowiedniego widoku
  - Zapobiega ręcznej nawigacji przez URL-e (middleware sprawdza stan)

### 4.4 Dostępność nawigacji

- Wszystkie elementy nawigacji mają role ARIA (navigation, link, button)
- Keyboard navigation: Tab, Enter, Escape
- Focus trap w modalach
- Skip links dla screenreaders
- Aktywny element nawigacji wyróżniony wizualnie i przez `aria-current="page"`

## 5. Kluczowe komponenty

### 5.1 Komponenty strony głównej

- **HeroSection**
  - Tytuł aplikacji (h1)
  - Krótki opis wartości (p)
  - Główny CTA button z dynamicznym tekstem
  - Loading state podczas weryfikacji

- **DynamicCTAButton**
  - Smart button z logiką routingu
  - Trzy stany: "Zacznij", "Wykonaj Check-in", "Zobacz Moje Zadanie"
  - Loading spinner podczas fetchowania
  - Ikony dla lepszej czytelności

- **AuthStatusIndicator** (opcjonalny w nagłówku)
  - Pokazuje czy użytkownik jest zalogowany
  - Link/przycisk do logowania dla niezalogowanych

### 5.2 Komponenty uwierzytelniania

- **LoginForm / RegisterForm**
  - Taby przełączania (Shadcn/ui Tabs)
  - Pola formularza z walidacją (Input, Label)
  - Maskowanie hasła z przyciskiem show/hide
  - Spinner przy ładowaniu
  - Toast dla błędów i sukcesów

- **PasswordRecoveryForm**
  - Dedykowany formularz odzyskiwania hasła
  - Email input z walidacją
  - Komunikat potwierdzenia

### 5.3 Komponenty check-inu

- **MoodEnergySelector**
  - Rzędowe przyciski wyboru nastroju (1-5) i energii (1-3)
  - Button Group z ikonami i opisami
  - Radio group accessibility (role, aria-labels)
  - Wizualne wskazanie wybranej opcji

- **CheckInForm**
  - Integracja z MoodEnergySelector
  - Opcjonalne pole notatek (Textarea)
  - CTA "Wyślij" z loading state
  - Zabezpieczenie przed wielokrotnym wysłaniem

### 5.4 Komponenty zadań

- **TaskCard**
  - Wyświetlenie treści zadania (Card z Shadcn/ui)
  - Instrukcje i czas wygaśnięcia
  - Trzy przyciski akcji: Wykonaj, Pomiń, Nowe zadanie
  - Status badge (aktywne/wygasłe)

- **TaskActionButtons**
  - Trzy osobne przyciski z odpowiednimi ikonami
  - Loading states dla każdej akcji
  - Disabled state przy osiągnięciu limitu

- **TaskLimitModal**
  - Modal potwierdzenia przy limicie (max 3 nowe zadania/dzień)
  - Neutralny komunikat wspierający
  - Przycisk zamknięcia

- **TaskSkipConfirmationModal**
  - Modal potwierdzenia pominięcia zadania
  - Dwa przyciski: Tak, pomiń / Anuluj

### 5.5 Komponenty ogrodu

- **GardenGrid**
  - Siatka 5×6 (Grid layout)
  - Role grid dla dostępności
  - Komórki gridcell z SVG roślin
  - Skeleton loader podczas fetchowania

- **PlantCell**
  - Pojedyncza komórka z SVG
  - Animacja wzrostu przy dodaniu
  - Tooltip z informacją o postępie
  - Kontrast kolorów dla dostępności

### 5.6 Komponenty ustawień

- **SettingsForm**
  - Edycja danych użytkownika (email)
  - Przycisk "Zapisz" z loading state
  - Walidacja pól

- **LogoutButton**
  - Przycisk wylogowania
  - Potwierdzenie w modalnej (opcjonalne)
  - Czyszczenie sesji i przekierowanie

### 5.7 Komponenty layoutu

- **RootLayout**
  - Globalny header z logo
  - Auth button (warunkowy)
  - Kontener dla child routes

- **PublicHomeLayout**
  - Minimalistyczny layout dla strony głównej
  - Hero sekcja

- **PublicAuthLayout**
  - Layout dla logowania/rejestracji
  - Prosty header z logo

- **ProtectedLayout**
  - Dolny pasek nawigacji (BottomNav)
  - Breadcrumbs
  - Wyloguj button w nagłówku

- **BottomNav / SideNav**
  - Responsive nawigacja
  - Aktywny element wyróżniony
  - ARIA roles i keyboard navigation

### 5.8 Komponenty wspólne

- **Toast / Toaster** (Shadcn/ui)
  - Komunikaty sukcesu, błędów, informacji
  - Automatyczne zamykanie
  - ARIA live regions

- **Spinner / Skeleton** (Shadcn/ui)
  - Loading states dla fetchowania
  - Skeleton dla ContentLoader

- **Modal / Dialog** (Shadcn/ui)
  - Potwierdzenia akcji
  - Focus trap i keyboard handling
  - Backdrop z możliwością zamknięcia

### 5.9 Zarządzanie stanem i danymi

- **AuthContext** (React Context)
  - Przechowywanie tokenu JWT i informacji o użytkowniku
  - Funkcje logowania, wylogowania, odświeżania tokenu
  - Dostępny globalnie przez useAuth hook

- **SWR Hooks**
  - `useUserTasks` - fetchowanie zadań użytkownika
  - `useCheckIns` - fetchowanie check-inów
  - `usePlantsProgress` - fetchowanie stanu ogrodu
  - Automatyczne cachowanie i revalidation
  - Offline support

- **API Client**
  - Wrapper dla fetch z automatycznym dodawaniem tokenu
  - Obsługa błędów 401 (automatyczne wylogowanie)
  - Retry logic i timeout handling

## 6. Mapowanie historyjek użytkownika do architektury UI

### 6.1 US-001: Strona główna

**Wymagania z PRD:**
- Wejście na stronę jest możliwe dla każdego użytkownika (zalogowanego i niezalogowanego)
- Na stronie pod tytułem jest przycisk przekierowywujący do strony checkin lub do strony z zadaniem (jeśli checkin był w danym dniu wykonany)

**Mapowanie do UI:**
- **Widok**: Strona Główna (ścieżka `/`)
- **Layout**: PublicHomeLayout (minimalistyczny, bez dolnego paska nawigacji)
- **Komponenty**:
  - HeroSection (tytuł + opis)
  - DynamicCTAButton (inteligentny routing)
  - AuthStatusIndicator (opcjonalny w nagłówku)
- **Logika routingu**:
  1. System sprawdza token w localStorage/Context
  2. Jeśli brak tokenu → przycisk "Zacznij" → `/login`
  3. Jeśli token istnieje → GET `/api/user-tasks?date=today`
     - Jeśli brak zadania z dzisiaj → przycisk "Wykonaj Check-in" → `/checkin`
     - Jeśli zadanie istnieje → przycisk "Zobacz Moje Zadanie" → `/task`
- **Przypadki brzegowe**:
  - Błąd API → fallback do przycisku "Zacznij"
  - Token wygasły → automatyczne wylogowanie → stan niezalogowany
  - Check-in wykonany bez zadania → przekierowanie do `/checkin` z komunikatem

**Spełnienie kryteriów akceptacji:**
✅ Wejście na stronę jest możliwe dla każdego użytkownika (brak middleware blokującego)
✅ Przycisk przekierowywuje do `/checkin` lub `/task` w zależności od stanu check-inu

### 6.2 US-002: Wykonanie codziennego check-inu

**Wymagania z PRD:**
- Przeprowadzenie check-inu jest możliwe tylko dla zalogowanych użytkowników
- Użytkownik może wprowadzić dane dotyczące nastroju oraz energii
- System generuje odpowiednie zadanie
- Zadanie wyświetlane na głównym ekranie z komunikatem zachęcającym

**Mapowanie do UI:**
- **Widok**: Check-in (ścieżka `/checkin`)
- **Layout**: ProtectedLayout (z dolnym paskiem nawigacji)
- **Middleware**: Sprawdzenie tokenu JWT → przekierowanie do `/login` jeśli brak
- **Komponenty**:
  - MoodEnergySelector (wybór 1-5 nastroju, 1-3 energii)
  - CheckInForm (formularz z opcjonalnym polem notatek)
  - CTA "Wyślij" z loading state
- **Flow**:
  1. Użytkownik wybiera nastrój i energię
  2. POST `/api/checkins` z body: `{ mood_level, energy_level, notes }`
  3. Backend generuje zadanie i zwraca `generated_task`
  4. POST `/api/user-events` (CHECKIN_CREATED)
  5. Przekierowanie do `/task` z ID zadania
  6. Toast z komunikatem zachęcającym

**Spełnienie kryteriów akceptacji:**
✅ Check-in tylko dla zalogowanych (ProtectedLayout + middleware)
✅ Możliwość wprowadzenia nastroju i energii (MoodEnergySelector)
✅ System generuje zadanie (POST `/api/checkins` → `generated_task`)
✅ Zadanie wyświetlane na głównym ekranie (przekierowanie do `/task`)

### 6.3 US-003: Zadanie dla użytkownika o wysokiej energii

**Wymagania z PRD:**
- Wykonywanie zadań jest możliwe tylko dla zalogowanych użytkowników
- System rozpoznaje scenariusz wysokiej energii na podstawie check-inu
- Zadanie angażujące do bardziej dynamicznej aktywności
- Komunikat motywujący

**Mapowanie do UI:**
- **Widok**: Moje Zadanie (ścieżka `/task`)
- **Layout**: ProtectedLayout
- **Middleware**: Sprawdzenie tokenu JWT
- **Komponenty**:
  - TaskCard (wyświetlenie zadania dopasowanego do energii)
  - TaskActionButtons (Wykonaj, Pomiń, Nowe zadanie)
  - Toast z komunikatem motywującym (warunkowy na podstawie energy_level)
- **Backend logic**: System wybiera template zadania na podstawie `energy_level` z check-inu (reguły w `/api/checkins` endpoint)

**Spełnienie kryteriów akceptacji:**
✅ Zadania tylko dla zalogowanych (ProtectedLayout)
✅ Rozpoznanie wysokiej energii (backend logic w `/api/checkins`)
✅ Dynamiczne zadanie (template matching w bazie danych)
✅ Komunikat motywujący (Toast po załadowaniu zadania)

### 6.4 US-004: Postępowanie w przypadku pominięcia zadania

**Wymagania z PRD:**
- Pominięcie zadania jest możliwe tylko dla zalogowanych użytkowników
- Możliwość wyboru opcji pominięcia
- Neutralny, wspierający komunikat
- Akcja zapisywana dla celów analizy

**Mapowanie do UI:**
- **Widok**: Moje Zadanie (ścieżka `/task`)
- **Komponenty**:
  - TaskActionButtons → przycisk "Pomiń"
  - TaskSkipConfirmationModal (potwierdzenie akcji)
  - Toast z neutralnym komunikatem wspierającym
- **Flow**:
  1. Kliknięcie "Pomiń" → otwarcie modala potwierdzenia
  2. Potwierdzenie → PATCH `/api/user-tasks/:id` (status: skipped)
  3. POST `/api/user-events` (TASK_SKIPPED)
  4. Toast z komunikatem typu "To w porządku, możesz wrócić później"
  5. Przekierowanie do `/garden` lub `/`

**Spełnienie kryteriów akceptacji:**
✅ Pominięcie tylko dla zalogowanych (ProtectedLayout)
✅ Możliwość wyboru opcji pominięcia (przycisk "Pomiń")
✅ Neutralny komunikat (Toast z wspierającym tekstem)
✅ Akcja zapisywana (POST `/api/user-events`)

### 6.5 US-005: Uwierzytelnianie i bezpieczny dostęp

**Wymagania z PRD:**
- Logowanie i rejestracja na dedykowanych stronach
- Metoda logowania przez e-mail
- Dane szyfrowane, procedury bezpieczeństwa
- Dostęp zależny od logowania
- Użytkownik NIE MOŻE korzystać bez logowania (oprócz strony głównej)
- Przycisk logowania/wylogowania w prawym górnym rogu
- Brak zewnętrznych serwisów logowania
- Możliwość odzyskiwania hasła

**Mapowanie do UI:**
- **Widok**: Logowanie/Rejestracja (ścieżka `/login`)
- **Layout**: PublicAuthLayout
- **Komponenty**:
  - LoginForm / RegisterForm (taby Shadcn/ui)
  - PasswordRecoveryForm (dedykowana zakładka)
  - AuthButton w RootLayout (prawy górny róg)
  - LogoutButton w ProtectedLayout
- **Bezpieczeństwo**:
  - HTTPS dla całej komunikacji
  - Token JWT w httpOnly cookie lub localStorage z expiration
  - Input sanitization i walidacja (client + server)
  - CSRF protection przez Supabase
  - Rate limiting na endpointach logowania
- **Middleware**:
  - Sprawdzenie tokenu dla wszystkich chronionych tras
  - Automatyczne przekierowanie do `/login` jeśli brak tokenu
  - Automatyczne wylogowanie przy 401 response
- **Flow logowania**:
  1. POST do Supabase auth endpoint (email + password)
  2. Otrzymanie tokenu JWT
  3. Zapisanie w AuthContext + localStorage
  4. Przekierowanie do `/` (dynamiczny routing do `/checkin` lub `/task`)
- **Flow wylogowania**:
  1. Kliknięcie LogoutButton
  2. Czyszczenie tokenu z Context + localStorage
  3. Invalidation w Supabase
  4. Przekierowanie do `/`

**Spełnienie kryteriów akceptacji:**
✅ Dedykowane strony logowania/rejestracji (`/login`)
✅ Logowanie przez e-mail (LoginForm component)
✅ Dane szyfrowane (HTTPS + Supabase encryption)
✅ Dostęp zależny od logowania (Middleware dla chronionych tras)
✅ Brak korzystania bez logowania (oprócz `/` i `/login`)
✅ Przycisk w prawym górnym rogu (AuthButton w RootLayout)
✅ Brak zewnętrznych serwisów (tylko email/password)
✅ Odzyskiwanie hasła (PasswordRecoveryForm)

## 7. Punkty bólu użytkownika i rozwiązania UI

### 7.1 Problem: Utrata motywacji i poczucia kontroli

**Rozwiązanie UI:**
- Strona główna jako punkt odniesienia - użytkownik zawsze wie, gdzie jest i co dalej
- Inteligentny routing eliminuje decyzje - system prowadzi użytkownika
- Jasny, jeden krok na raz: Check-in → Zadanie → Ogród
- Brak przeciążenia informacyjnego - minimalistyczny design

### 7.2 Problem: Trudność w rozpoczęciu działania

**Rozwiązanie UI:**
- Duży, widoczny CTA na stronie głównej
- Empatyczne komunikaty "Zacznij", "Wykonaj Check-in" zamiast technicznego języka
- Brak barier wejścia - strona główna dostępna bez logowania
- Możliwość anonimowego logowania (opcja w przyszłości)

### 7.3 Problem: Brak poczucia postępu

**Rozwiązanie UI:**
- Wizualizacja w formie ogrodu (5×6 grid z rosnącymi roślinami)
- Natychmiastowy feedback po wykonaniu zadania (aktualizacja ogrodu)
- Historia check-inów i zadań dostępna w ustawieniach
- Animacje wzrostu roślin dla gratyfikacji wizualnej

### 7.4 Problem: Przytłoczenie zbyt dużą liczbą zadań

**Rozwiązanie UI:**
- Jedno zadanie dziennie - focus na wykonalności
- Możliwość pominięcia bez judgment (neutralny komunikat)
- Limit 3 nowych zadań/dzień zapobiega "task hopping"
- Proste akcje: Wykonaj, Pomiń, Nowe zadanie (bez dodatkowych opcji)

### 7.5 Problem: Trudność w utrzymaniu regularności

**Rozwiązanie UI:**
- Strona główna jako daily ritual - zawsze ten sam flow
- Check-in jako pierwszy krok - niski próg wejścia (2 minuty)
- 24h expiry zadania tworzy gentle pressure bez stresu
- Możliwość powrotu w dowolnym momencie (brak kar za pominięcie)

### 7.6 Problem: Brak wsparcia emocjonalnego

**Rozwiązanie UI:**
- Empatyczne komunikaty dostosowane do poziomu nastroju i energii
- Neutralne, wspierające komunikaty przy pominięciu zadania
- Brak negatywnych komunikatów typu "failure" czy "missed"
- Design w ciepłych, uspokajających kolorach (do ustalenia w design system)

### 7.7 Problem: Obawy o prywatność danych emocjonalnych

**Rozwiązanie UI:**
- Jasna informacja o szyfrowaniu danych na stronie logowania
- Możliwość usunięcia konta w ustawieniach
- Brak social features - dane nie są udostępniane innym
- Opcja logowania anonimowego (przyszłość)

## 8. Zgodność z planem API

### 8.1 Endpoints wykorzystywane przez stronę główną

- **GET `/api/user-tasks`** (z query param `date=today`)
  - Cel: Sprawdzenie czy użytkownik ma zadanie z dzisiejszego dnia
  - Wykorzystanie: Logika dynamicznego routingu CTA button
  - Obsługa błędów: Fallback do przycisku "Zacznij" przy błędzie

### 8.2 Endpoints dla pełnego flow

1. **Logowanie**: POST do Supabase auth (nie wymieniony w API plan, ale część Supabase)
2. **Check-in**: POST `/api/checkins` → zwraca `generated_task`
3. **Zadanie**:
   - GET `/api/user-tasks/:id` - pobieranie szczegółów zadania
   - PATCH `/api/user-tasks/:id` - wykonanie/pominięcie/nowe zadanie
4. **Eventy**: POST `/api/user-events` - logowanie akcji
5. **Ogród**:
   - GET `/api/plants-progress` - pobranie stanu
   - PATCH `/api/plants-progress` - aktualizacja po wykonaniu zadania
6. **Ustawienia**: GET/PATCH `/api/users/:id` - edycja profilu

### 8.3 Wymagania na warstwie klienta

- **Token JWT**: Dodawany do każdego requestu w header `Authorization: Bearer <token>`
- **Error handling**:
  - 401 Unauthorized → automatyczne wylogowanie
  - 400 Bad Request → toast z komunikatem błędu
  - 404 Not Found → redirect do `/`
  - 500 Server Error → toast z "Coś poszło nie tak, spróbuj ponownie"
- **Loading states**: Spinner/skeleton dla każdego asynchronicznego zapytania
- **Retry logic**: Automatyczne ponawianie przy błędach sieci (SWR)
- **Offline queue**: Zapisywanie akcji offline, synchronizacja po powrocie połączenia

### 8.4 Dodatkowe wymagania API (nie uwzględnione w planie)

- **GET `/api/user-tasks?date=today`**: Filtrowanie zadań po dzisiejszej dacie (query param)
- **Token refresh**: Endpoint lub mechanizm odświeżania tokenu JWT
- **Session validation**: Endpoint sprawdzający ważność tokenu (opcjonalny - może być realizowany przez 401 na innych endpointach)

---

## 9. Podsumowanie architektury UI

Zaktualizowana architektura UI dla Mimo uwzględnia nowy widok **Strony Głównej (US-001)** jako kluczowy punkt wejścia aplikacji. Główne zmiany:

1. **Strona Główna (`/`)** jako landing page dla wszystkich użytkowników (zalogowanych i niezalogowanych)
2. **Inteligentny routing** oparty na stanie użytkownika i dzisiejszego check-inu
3. **Hierarchia layoutów**: Root → PublicHome/PublicAuth/Protected
4. **Dynamiczny CTA button** jako główny element nawigacyjny
5. **Uproszczona podróż użytkownika**: Strona Główna → Logowanie → Check-in → Zadanie → Ogród
6. **Zgodność z API**: Wykorzystanie GET `/api/user-tasks?date=today` dla logiki routingu
7. **Rozwiązanie punktów bólu**: Minimalistyczny design, jasne kroki, empatyczne komunikaty
8. **Bezpieczeństwo**: Middleware dla chronionych tras, token JWT, HTTPS, walidacja

Architektura jest gotowa do implementacji zgodnie z wymaganiami PRD, planem API i najlepszymi praktykami UX/UI.

---

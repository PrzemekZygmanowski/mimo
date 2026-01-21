# Plan implementacji widoku Strony Głównej

## 1. Przegląd

Strona główna jest punktem wejścia do aplikacji Mimo i służy jako inteligentny router kierujący użytkowników do odpowiednich sekcji aplikacji w zależności od ich aktualnego stanu. Widok dynamicznie dostosowuje się do trzech możliwych scenariuszy: użytkownik niezalogowany, użytkownik zalogowany bez dzisiejszego check-inu oraz użytkownik zalogowany z wykonanym check-inem. Głównym celem jest zapewnienie płynnego i intuicyjnego doświadczenia użytkownika poprzez wyświetlenie odpowiedniego przycisku CTA (Call To Action) z właściwym przekierowaniem.

## 2. Routing widoku

- **Ścieżka**: `/` (root)
- **Plik**: `src/pages/index.astro`

## 3. Struktura komponentów

```
index.astro (HomePage - Astro)
└── Layout.astro
    └── HomePageWrapper.tsx (React - client:load)
        ├── HomePageContent.tsx (React)
        │   ├── HeroSection
        │   │   ├── <h1> - Tytuł aplikacji
        │   │   └── <p> - Opis wartości aplikacji
        │   ├── CTAButton (Shadcn Button)
        │   ├── LoadingSkeleton
        │   └── ErrorMessage
        └── (Opcjonalny) LoginButton w Navigation.astro
```

## 4. Szczegóły komponentów

### 4.1 HomePage (index.astro)

**Opis komponentu:**
Główny plik strony Astro służący jako entry point dla widoku strony głównej. Odpowiada za renderowanie layoutu oraz osadzenie reaktywnego komponentu React.

**Główne elementy:**
- Komponent `Layout.astro` jako wrapper
- Komponent `HomePageWrapper.tsx` z dyrektywą `client:load` dla interaktywności

**Obsługiwane zdarzenia:**
- Brak bezpośrednich zdarzeń (statyczny kontener Astro)

**Warunki walidacji:**
- Brak (komponent kontenerowy)

**Typy:**
- Brak specyficznych typów

**Propsy:**
- Brak

---

### 4.2 HomePageWrapper.tsx

**Opis komponentu:**
Komponent React odpowiedzialny za orkiestrację logiki biznesowej strony głównej. Zarządza stanem, wykonuje wywołania API oraz renderuje odpowiednią zawartość w zależności od stanu użytkownika.

**Główne elementy:**
- Custom hook `useHomePageState()` do zarządzania stanem
- Warunkowe renderowanie `HomePageContent` lub stanów Loading/Error
- Logika sprawdzania autentykacji i stanu check-inu

**Obsługiwane zdarzenia:**
- `useEffect` przy montowaniu komponentu do inicjalizacji stanu

**Warunki walidacji:**
- Sprawdzenie czy użytkownik jest zalogowany (token Supabase)
- Sprawdzenie czy istnieje zadanie z dzisiejszą datą (filtrowanie po `task_date`)

**Typy:**
- `HomePageState`
- `UserTaskDTO[]` (z API)

**Propsy:**
- Brak (top-level component)

---

### 4.3 HomePageContent.tsx

**Opis komponentu:**
Komponent prezentacyjny wyświetlający główną zawartość strony: sekcję hero z tytułem i opisem oraz dynamiczny przycisk CTA. Otrzymuje obliczony stan z komponentu nadrzędnego i renderuje odpowiedni UI.

**Główne elementy:**
- `<section>` z sekcją hero
- `<h1>` - Tytuł "Mimo"
- `<p>` - Opis wartości aplikacji
- `<Button>` (Shadcn) - Dynamiczny przycisk CTA
- Stylizacja Tailwind z responsive design

**Obsługiwane zdarzenia:**
- Kliknięcie przycisku CTA (przekierowanie poprzez `window.location.href` lub Astro navigation)

**Warunki walidacji:**
- Brak walidacji formularzy (czysta prezentacja)

**Typy:**
- `HomePageContentProps`
- `CTAConfig`

**Propsy:**
```typescript
interface HomePageContentProps {
  ctaConfig: CTAConfig;
}
```

---

### 4.4 LoadingSkeleton

**Opis komponentu:**
Komponent wyświetlający stan ładowania podczas pobierania danych użytkownika i sprawdzania stanu check-inu. Zapewnia lepsze UX poprzez wizualne wskazanie trwającego procesu.

**Główne elementy:**
- Skeleton dla tytułu (Shadcn Skeleton lub custom)
- Skeleton dla opisu
- Skeleton dla przycisku
- Animacje pulsujące

**Obsługiwane zdarzenia:**
- Brak

**Warunki walidacji:**
- Brak

**Typy:**
- Brak specyficznych

**Propsy:**
- Brak lub opcjonalne `className`

---

### 4.5 ErrorMessage

**Opis komponentu:**
Komponent wyświetlający przyjazny komunikat błędu w przypadku problemów z połączeniem lub błędów API. Może zawierać opcję ponowienia próby.

**Główne elementy:**
- `<div>` z komunikatem błędu
- Ikona błędu (opcjonalnie z Shadcn)
- Przycisk "Spróbuj ponownie"
- Stylizacja komunikatu błędu (red/destructive theme)

**Obsługiwane zdarzenia:**
- `onClick` na przycisku retry → wywołanie funkcji `onRetry`

**Warunki walidacji:**
- Brak

**Typy:**
- `ErrorMessageProps`

**Propsy:**
```typescript
interface ErrorMessageProps {
  message: string;
  onRetry: () => void;
}
```

---

### 4.6 CTAButton (część HomePageContent)

**Opis komponentu:**
Dynamiczny przycisk głównego Call To Action, który zmienia swój tekst i cel przekierowania w zależności od stanu użytkownika. Wykorzystuje komponent Button z Shadcn/ui.

**Główne elementy:**
- `<Button>` z Shadcn/ui
- Dynamiczny tekst
- Dynamiczny atrybut `href` lub `onClick`

**Obsługiwane zdarzenia:**
- `onClick` → nawigacja do odpowiedniej strony

**Warunki walidacji:**
- Brak bezpośredniej walidacji, ale tekst i link zależą od poprawnie obliczonego stanu

**Typy:**
- `CTAConfig`

**Propsy:**
Wbudowane w `HomePageContent` jako część `CTAConfig`

## 5. Typy

### 5.1 HomePageState

Typ reprezentujący aktualny stan strony głównej, wykorzystywany do zarządzania stanem w komponencie.

```typescript
interface HomePageState {
  // Wskazuje czy trwa ładowanie danych
  isLoading: boolean;

  // Określa czy użytkownik jest zalogowany
  isAuthenticated: boolean;

  // Określa czy użytkownik wykonał dzisiaj check-in (ma aktywne zadanie z dzisiejszą datą)
  hasTodayTask: boolean;

  // Przechowuje komunikat błędu (null jeśli brak błędu)
  error: string | null;

  // Opcjonalne: przechowuje dane zadania jeśli istnieje
  todayTask?: UserTaskDTO | null;
}
```

### 5.2 CTAConfig

Typ konfiguracji dla przycisku Call To Action, określający jego tekst i docelowy URL.

```typescript
interface CTAConfig {
  // Tekst wyświetlany na przycisku
  text: string;

  // URL do którego użytkownik zostanie przekierowany
  href: string;

  // Opcjonalnie: wariant stylu przycisku
  variant?: 'default' | 'secondary' | 'outline';
}
```

### 5.3 HomePageContentProps

Propsy przekazywane do komponentu HomePageContent.

```typescript
interface HomePageContentProps {
  // Konfiguracja przycisku CTA
  ctaConfig: CTAConfig;
}
```

### 5.4 ErrorMessageProps

Propsy dla komponentu wyświetlającego komunikaty błędów.

```typescript
interface ErrorMessageProps {
  // Treść komunikatu błędu do wyświetlenia
  message: string;

  // Funkcja wywoływana przy kliknięciu "Spróbuj ponownie"
  onRetry: () => void;
}
```

### 5.5 Istniejące typy z types.ts

Widok wykorzystuje następujące istniejące typy:

- **UserTaskDTO**: Reprezentuje zadanie użytkownika pobrane z API
  ```typescript
  interface UserTaskDTO {
    id: number;
    check_in_id?: number | null;
    created_at: string | null;
    expires_at: string;
    metadata?: Json | null;
    new_task_requests: number;
    status: string;
    task_date: string; // Kluczowe dla filtrowania po dzisiejszej dacie
    template_id: number;
    updated_at?: string | null;
    user_id: string;
  }
  ```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: useHomePageState

Zaleca się stworzenie custom hooka `useHomePageState` do enkapsulacji logiki zarządzania stanem strony głównej. Hook ten będzie zarządzał:

**Stan lokalny:**
```typescript
const [state, setState] = useState<HomePageState>({
  isLoading: true,
  isAuthenticated: false,
  hasTodayTask: false,
  error: null,
  todayTask: null,
});
```

**Logika hooka:**

1. **Przy montowaniu komponentu (useEffect):**
   - Sprawdź autentykację użytkownika poprzez Supabase client: `supabase.auth.getUser()`
   - Jeśli użytkownik zalogowany, wykonaj GET /api/user-tasks z filtrem na dzisiejszą datę
   - Zaktualizuj stan na podstawie wyników

2. **Funkcja fetchUserState:**
   ```typescript
   const fetchUserState = async () => {
     try {
       setState(prev => ({ ...prev, isLoading: true, error: null }));

       // Sprawdź autentykację
       const { data: { user }, error: authError } = await supabase.auth.getUser();

       if (authError || !user) {
         // Użytkownik niezalogowany
         setState({
           isLoading: false,
           isAuthenticated: false,
           hasTodayTask: false,
           error: null,
           todayTask: null,
         });
         return;
       }

       // Użytkownik zalogowany - sprawdź dzisiejsze zadanie
       const today = new Date().toISOString().split('T')[0];
       const response = await fetch(`/api/user-tasks?task_date=${today}`);

       if (!response.ok) {
         throw new Error('Błąd podczas pobierania zadań');
       }

       const tasks: UserTaskDTO[] = await response.json();
       const todayTask = tasks.length > 0 ? tasks[0] : null;

       setState({
         isLoading: false,
         isAuthenticated: true,
         hasTodayTask: !!todayTask,
         error: null,
         todayTask,
       });

     } catch (error) {
       setState(prev => ({
         ...prev,
         isLoading: false,
         error: 'Nie udało się załadować danych. Spróbuj ponownie.',
       }));
     }
   };
   ```

3. **Funkcja getCTAConfig:**
   ```typescript
   const getCTAConfig = (): CTAConfig => {
     if (!state.isAuthenticated) {
       return {
         text: 'Zacznij',
         href: '/login',
         variant: 'default',
       };
     }

     if (state.hasTodayTask) {
       return {
         text: 'Zobacz Moje Zadanie',
         href: '/task',
         variant: 'default',
       };
     }

     return {
       text: 'Wykonaj Check-in',
       href: '/checkin',
       variant: 'default',
     };
   };
   ```

**Zwracane wartości hooka:**
```typescript
return {
  state,
  ctaConfig: getCTAConfig(),
  retry: fetchUserState,
};
```

### 6.2 Przepływ stanu

1. **Inicjalizacja**: `isLoading: true` → Wyświetl LoadingSkeleton
2. **Sprawdzenie auth**: Wywołaj `supabase.auth.getUser()`
3. **Jeśli niezalogowany**: Ustaw `isAuthenticated: false` → CTA "Zacznij" → /login
4. **Jeśli zalogowany**: Wywołaj API `/api/user-tasks?task_date={today}`
5. **Jeśli zadanie istnieje**: `hasTodayTask: true` → CTA "Zobacz Moje Zadanie" → /task
6. **Jeśli zadanie nie istnieje**: `hasTodayTask: false` → CTA "Wykonaj Check-in" → /checkin
7. **Jeśli błąd**: `error: string` → Wyświetl ErrorMessage z opcją retry

## 7. Integracja API

### 7.1 Endpoint: GET /api/user-tasks

**Cel:** Pobranie listy zadań użytkownika z filtrowaniem po dzisiejszej dacie w celu określenia czy check-in został wykonany.

**URL:** `/api/user-tasks?task_date={YYYY-MM-DD}`

**Metoda:** GET

**Wymagania:**
- Użytkownik musi być zalogowany (token JWT w ciasteczku/header)
- Filtrowanie po parametrze query `task_date`

**Typ żądania:**
```typescript
// Query parameters
interface UserTasksQueryParams {
  task_date?: string; // Format: YYYY-MM-DD
  status?: string; // Opcjonalnie: 'pending', 'completed', 'skipped'
  page?: number;
  limit?: number;
}
```

**Typ odpowiedzi:**
```typescript
// Success (200)
type UserTasksResponse = UserTaskDTO[];

// Error (401)
interface UnauthorizedError {
  error: string;
  message: string;
}

// Error (500)
interface ServerError {
  error: string;
  message: string;
}
```

**Przykład wywołania:**
```typescript
const today = new Date().toISOString().split('T')[0]; // "2026-01-21"
const response = await fetch(`/api/user-tasks?task_date=${today}`, {
  method: 'GET',
  credentials: 'include', // Ważne dla ciasteczek sesji
});

if (!response.ok) {
  if (response.status === 401) {
    // Użytkownik niezalogowany lub token wygasł
    // Przekieruj do logowania lub zaktualizuj stan
  }
  throw new Error('Błąd API');
}

const tasks: UserTaskDTO[] = await response.json();
```

**Obsługa odpowiedzi:**
- **200 OK + tasks.length > 0**: Użytkownik ma zadanie z dzisiaj → hasTodayTask = true
- **200 OK + tasks.length === 0**: Użytkownik nie ma zadania z dzisiaj → hasTodayTask = false
- **401 Unauthorized**: Token wygasł → wyloguj użytkownika → isAuthenticated = false
- **500 Server Error**: Błąd serwera → wyświetl komunikat błędu

### 7.2 Sprawdzenie autentykacji (Supabase)

**Metoda:** `supabase.auth.getUser()`

**Typ odpowiedzi:**
```typescript
interface AuthResponse {
  data: {
    user: User | null;
  };
  error: AuthError | null;
}
```

**Przykład:**
```typescript
import { createClient } from '@/db/supabase.client';

const supabase = createClient();
const { data: { user }, error } = await supabase.auth.getUser();

if (error || !user) {
  // Użytkownik niezalogowany
  return false;
}

// Użytkownik zalogowany
return true;
```

## 8. Interakcje użytkownika

### 8.1 Ładowanie strony głównej

**Akcja użytkownika:** Wejście na stronę główną aplikacji (navigacja do `/`)

**Oczekiwany wynik:**
1. Wyświetlenie komponentu LoadingSkeleton
2. Automatyczne sprawdzenie stanu autentykacji
3. Jeśli zalogowany: pobranie zadań z dzisiejszą datą
4. Wyświetlenie odpowiedniej zawartości:
   - Niezalogowany: "Zacznij" → /login
   - Zalogowany bez zadania: "Wykonaj Check-in" → /checkin
   - Zalogowany z zadaniem: "Zobacz Moje Zadanie" → /task

**Czas ładowania:** Maksymalnie 2-3 sekundy (z uwzględnieniem API calls)

**Graceful degradation:** W przypadku długiego ładowania, skeleton pozostaje widoczny

---

### 8.2 Kliknięcie przycisku CTA (Niezalogowany)

**Akcja użytkownika:** Kliknięcie przycisku "Zacznij"

**Warunki początkowe:**
- Użytkownik nie jest zalogowany
- `isAuthenticated === false`

**Oczekiwany wynik:**
1. Przekierowanie do `/login`
2. Użytkownik widzi stronę logowania

**Implementacja:**
```typescript
<Button onClick={() => window.location.href = '/login'}>
  Zacznij
</Button>
```

---

### 8.3 Kliknięcie przycisku CTA (Zalogowany bez check-inu)

**Akcja użytkownika:** Kliknięcie przycisku "Wykonaj Check-in"

**Warunki początkowe:**
- Użytkownik jest zalogowany (`isAuthenticated === true`)
- Brak zadania z dzisiejszą datą (`hasTodayTask === false`)

**Oczekiwany wynik:**
1. Przekierowanie do `/checkin`
2. Użytkownik widzi stronę z formularzem check-inu

**Implementacja:**
```typescript
<Button onClick={() => window.location.href = '/checkin'}>
  Wykonaj Check-in
</Button>
```

---

### 8.4 Kliknięcie przycisku CTA (Zalogowany z check-inem)

**Akcja użytkownika:** Kliknięcie przycisku "Zobacz Moje Zadanie"

**Warunki początkowe:**
- Użytkownik jest zalogowany (`isAuthenticated === true`)
- Istnieje zadanie z dzisiejszą datą (`hasTodayTask === true`)

**Oczekiwany wynik:**
1. Przekierowanie do `/task`
2. Użytkownik widzi stronę ze swoim dzisiejszym zadaniem

**Implementacja:**
```typescript
<Button onClick={() => window.location.href = '/task'}>
  Zobacz Moje Zadanie
</Button>
```

---

### 8.5 Ponowienie próby po błędzie

**Akcja użytkownika:** Kliknięcie przycisku "Spróbuj ponownie" w komponencie ErrorMessage

**Warunki początkowe:**
- Wystąpił błąd podczas ładowania danych (`error !== null`)
- Wyświetlony jest komponent ErrorMessage

**Oczekiwany wynik:**
1. Ponowne wywołanie funkcji `fetchUserState()`
2. Wyświetlenie LoadingSkeleton
3. Próba ponownego pobrania danych
4. Wyświetlenie odpowiedniej zawartości lub ponownie błędu

**Implementacja:**
```typescript
<ErrorMessage
  message={state.error}
  onRetry={retry}
/>
```

## 9. Warunki i walidacja

### 9.1 Warunek autentykacji

**Komponent:** HomePageWrapper

**Warunek:** Użytkownik musi być uwierzytelniony, aby zobaczyć opcje związane z check-inem i zadaniami.

**Sprawdzenie:**
```typescript
const { data: { user }, error } = await supabase.auth.getUser();
const isAuthenticated = !error && !!user;
```

**Wpływ na UI:**
- `isAuthenticated === false` → Przycisk "Zacznij" → `/login`
- `isAuthenticated === true` → Dalsze sprawdzenie stanu zadania

---

### 9.2 Warunek istnienia dzisiejszego zadania

**Komponent:** HomePageWrapper (useHomePageState hook)

**Warunek:** Sprawdzenie czy użytkownik ma już przydzielone zadanie na dzisiejszy dzień (co oznacza że check-in został wykonany).

**Sprawdzenie:**
```typescript
const today = new Date().toISOString().split('T')[0]; // "2026-01-21"
const response = await fetch(`/api/user-tasks?task_date=${today}`);
const tasks: UserTaskDTO[] = await response.json();
const hasTodayTask = tasks.length > 0;
```

**Wpływ na UI:**
- `hasTodayTask === true` → Przycisk "Zobacz Moje Zadanie" → `/task`
- `hasTodayTask === false` → Przycisk "Wykonaj Check-in" → `/checkin`

---

### 9.3 Warunek błędu API

**Komponent:** HomePageWrapper

**Warunek:** Obsługa błędów podczas wywołań API (błąd sieci, błąd serwera, timeout).

**Sprawdzenie:**
```typescript
try {
  const response = await fetch(`/api/user-tasks?task_date=${today}`);
  if (!response.ok) {
    throw new Error('API Error');
  }
} catch (error) {
  setState(prev => ({
    ...prev,
    error: 'Nie udało się załadować danych. Spróbuj ponownie.'
  }));
}
```

**Wpływ na UI:**
- `error !== null` → Wyświetl komponent ErrorMessage z opcją retry
- `error === null` → Normalne wyświetlanie zawartości

---

### 9.4 Warunek wygasłego tokenu

**Komponent:** HomePageWrapper

**Warunek:** Token użytkownika może wygasnąć między sesjami.

**Sprawdzenie:**
```typescript
const response = await fetch(`/api/user-tasks?task_date=${today}`);
if (response.status === 401) {
  // Token wygasł lub nieprawidłowy
  await supabase.auth.signOut();
  setState({
    isLoading: false,
    isAuthenticated: false,
    hasTodayTask: false,
    error: null,
    todayTask: null,
  });
}
```

**Wpływ na UI:**
- Automatyczne wylogowanie użytkownika
- Wyświetlenie przycisku "Zacznij" → `/login`

---

### 9.5 Warunek ładowania

**Komponent:** HomePageWrapper

**Warunek:** Podczas trwania wywołań API i sprawdzania stanu.

**Sprawdzenie:**
```typescript
if (state.isLoading) {
  return <LoadingSkeleton />;
}
```

**Wpływ na UI:**
- `isLoading === true` → Wyświetl LoadingSkeleton
- `isLoading === false` → Wyświetl właściwą zawartość

## 10. Obsługa błędów

### 10.1 Błąd sieci / timeout

**Scenariusz:** Brak połączenia z internetem lub timeout podczas wywołania API.

**Obsługa:**
1. Przechwycenie błędu w bloku `try-catch`
2. Ustawienie stanu `error` z przyjaznym komunikatem: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
3. Wyświetlenie komponentu ErrorMessage
4. Udostępnienie przycisku "Spróbuj ponownie"

**Implementacja:**
```typescript
catch (error) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: 'Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe.',
    }));
  }
}
```

---

### 10.2 Błąd 401 Unauthorized

**Scenariusz:** Token użytkownika wygasł lub jest nieprawidłowy.

**Obsługa:**
1. Wykrycie statusu 401 w odpowiedzi API
2. Automatyczne wylogowanie użytkownika: `supabase.auth.signOut()`
3. Ustawienie `isAuthenticated = false`
4. Wyświetlenie przycisku "Zacznij" → `/login`
5. Opcjonalnie: wyświetlenie toast notification "Twoja sesja wygasła. Zaloguj się ponownie."

**Implementacja:**
```typescript
if (response.status === 401) {
  await supabase.auth.signOut();
  setState({
    isLoading: false,
    isAuthenticated: false,
    hasTodayTask: false,
    error: null,
    todayTask: null,
  });
  return;
}
```

---

### 10.3 Błąd 500 Internal Server Error

**Scenariusz:** Błąd po stronie serwera podczas przetwarzania żądania.

**Obsługa:**
1. Wykrycie statusu 500 w odpowiedzi API
2. Ustawienie stanu `error` z komunikatem: "Wystąpił problem po stronie serwera. Spróbuj ponownie później."
3. Wyświetlenie ErrorMessage z opcją retry
4. Logowanie błędu do konsoli dla celów debugowania

**Implementacja:**
```typescript
if (response.status === 500) {
  console.error('Server error:', await response.text());
  setState(prev => ({
    ...prev,
    isLoading: false,
    error: 'Wystąpił problem po stronie serwera. Spróbuj ponownie później.',
  }));
  return;
}
```

---

### 10.4 Przypadek brzegowy: Check-in wykonany, ale brak zadania

**Scenariusz:** Użytkownik wykonał check-in, ale z jakiegoś powodu zadanie nie zostało utworzone (błąd w systemie).

**Obsługa:**
1. Sprawdzenie czy odpowiedź API zwraca puste zadania mimo że użytkownik jest zalogowany
2. Traktowanie jako brak check-inu: `hasTodayTask = false`
3. Wyświetlenie przycisku "Wykonaj Check-in"
4. Opcjonalnie: dodanie logiki sprawdzającej istnienie check-inu w tabeli `check_ins` dla dzisiejszej daty

**Uwaga:** W standardowym przepływie aplikacji check-in automatycznie tworzy zadanie, więc ten przypadek powinien być bardzo rzadki.

---

### 10.5 Flash of Incorrect Content (FOIC)

**Scenariusz:** Użytkownik przez krótką chwilę widzi nieprawidłową zawartość podczas ładowania stanu.

**Obsługa:**
1. Inicjalizacja stanu z `isLoading: true`
2. Renderowanie LoadingSkeleton jako pierwsza rzecz w komponencie
3. Unikanie warunkowego renderowania przed zakończeniem ładowania
4. Używanie Suspense boundaries jeśli to możliwe

**Implementacja:**
```typescript
// W komponencie
if (state.isLoading) {
  return <LoadingSkeleton />;
}

// Dalsze renderowanie tylko po zakończeniu ładowania
```

---

### 10.6 Błąd parsowania JSON

**Scenariusz:** API zwraca nieprawidłowy JSON lub nieoczekiwaną strukturę danych.

**Obsługa:**
1. Walidacja odpowiedzi API przed użyciem
2. Przechwycenie błędu podczas `response.json()`
3. Wyświetlenie ogólnego komunikatu błędu

**Implementacja:**
```typescript
try {
  const tasks: UserTaskDTO[] = await response.json();
  if (!Array.isArray(tasks)) {
    throw new Error('Invalid response format');
  }
} catch (error) {
  setState(prev => ({
    ...prev,
    isLoading: false,
    error: 'Otrzymano nieprawidłowe dane z serwera.',
  }));
}
```

## 11. Kroki implementacji

### Krok 1: Przygotowanie typów
1. Otwórz plik `src/types.ts`
2. Dodaj nowe typy na końcu pliku:
   - `HomePageState`
   - `CTAConfig`
   - `HomePageContentProps`
   - `ErrorMessageProps`
3. Zapisz plik

### Krok 2: Utworzenie custom hooka useHomePageState
1. Utwórz nowy plik `src/hooks/useHomePageState.ts` (lub `src/lib/hooks/useHomePageState.ts`)
2. Zaimplementuj hook zgodnie z opisem w sekcji 6.1:
   - Import zależności (React, Supabase client, typy)
   - Definicja stanu lokalnego
   - Funkcja `fetchUserState()`
   - Funkcja `getCTAConfig()`
   - useEffect do inicjalizacji
   - Return hooka
3. Dodaj obsługę błędów w try-catch
4. Przetestuj hook w izolacji (opcjonalnie)

### Krok 3: Utworzenie komponentu ErrorMessage
1. Utwórz plik `src/components/ErrorMessage.tsx`
2. Zaimplementuj komponent:
   - Import Button z Shadcn/ui
   - Definicja props (`ErrorMessageProps`)
   - Renderowanie komunikatu błędu
   - Przycisk "Spróbuj ponownie" z handlerem `onRetry`
3. Stylizacja Tailwind (czerwone tło/tekst, responsywność)
4. Dodaj ARIA labels dla accessibility

### Krok 4: Utworzenie komponentu LoadingSkeleton
1. Utwórz plik `src/components/LoadingSkeleton.tsx`
2. Zaimplementuj komponent:
   - Skeleton dla tytułu (duży prostokąt)
   - Skeleton dla opisu (2-3 mniejsze linie)
   - Skeleton dla przycisku
3. Użyj animacji Tailwind (`animate-pulse`)
4. Upewnij się że skeleton ma podobne wymiary do rzeczywistej zawartości

### Krok 5: Utworzenie komponentu HomePageContent
1. Utwórz plik `src/components/HomePageContent.tsx`
2. Zaimplementuj komponent prezentacyjny:
   - Import Button z Shadcn/ui
   - Definicja props (`HomePageContentProps`)
   - Sekcja hero z tytułem "Mimo" i opisem
   - Renderowanie przycisku CTA z konfiguracją z props
3. Stylizacja Tailwind:
   - Centrowanie zawartości
   - Responsive typography
   - Spacing i padding
4. Dodaj ARIA labels i semantic HTML

### Krok 6: Utworzenie komponentu HomePageWrapper
1. Utwórz plik `src/components/HomePageWrapper.tsx`
2. Zaimplementuj logikę komponentu:
   - Import `useHomePageState` hooka
   - Destrukturyzacja zwracanych wartości: `{ state, ctaConfig, retry }`
   - Warunkowe renderowanie:
     - Jeśli `state.isLoading` → renderuj `LoadingSkeleton`
     - Jeśli `state.error` → renderuj `ErrorMessage` z `retry`
     - W przeciwnym razie → renderuj `HomePageContent` z `ctaConfig`
3. Dodaj dyrektywę eksportu dla React
4. Dodaj podstawowe testy jednostkowe (opcjonalnie)

### Krok 7: Utworzenie strony Astro index.astro
1. Otwórz (lub utwórz) plik `src/pages/index.astro`
2. Zaimplementuj strukturę strony:
   ```astro
   ---
   import Layout from '@/layouts/Layout.astro';
   import HomePageWrapper from '@/components/HomePageWrapper';
   ---

   <Layout title="Mimo - Strona główna">
     <HomePageWrapper client:load />
   </Layout>
   ```
3. Upewnij się że użyto dyrektywy `client:load` dla hydratacji React
4. Dodaj meta tags dla SEO (title, description)

### Krok 8: Dostosowanie Layout.astro (jeśli potrzebne)
1. Otwórz `src/layouts/Layout.astro`
2. Sprawdź czy Navigation.astro zawiera przyciski logowania/wylogowania
3. Upewnij się że layout ma odpowiednie style globalne
4. Dodaj lub zaktualizuj meta tags

### Krok 9: Implementacja endpointu GET /api/user-tasks (jeśli nie istnieje)
1. Sprawdź czy endpoint istnieje w `src/pages/api/user-tasks/index.ts`
2. Jeśli nie, zaimplementuj zgodnie z planem API:
   - Walidacja parametrów query (`task_date`, `status`)
   - Uwierzytelnienie użytkownika (Supabase)
   - Filtrowanie zadań z bazy danych
   - Zwracanie JSON z UserTaskDTO[]
3. Dodaj obsługę błędów (400, 401, 500)
4. Przetestuj endpoint z różnymi parametrami

### Krok 10: Testowanie integracyjne
1. Uruchom aplikację lokalnie: `npm run dev`
2. Przetestuj scenariusze:
   - **Użytkownik niezalogowany**: Sprawdź czy wyświetla się "Zacznij" → /login
   - **Zaloguj się**: Utwórz konto lub zaloguj
   - **Brak check-inu**: Sprawdź czy wyświetla się "Wykonaj Check-in" → /checkin
   - **Wykonaj check-in**: Przejdź przez formularz check-inu
   - **Po check-inie**: Wróć na stronę główną, sprawdź czy wyświetla się "Zobacz Moje Zadanie" → /task
3. Testuj stany błędów:
   - Wyłącz sieć i sprawdź obsługę błędu
   - Sprawdź expired token (symulacja)
4. Sprawdź responsywność na różnych urządzeniach
5. Sprawdź accessibility (screen reader, keyboard navigation)

### Krok 11: Refaktoryzacja i optymalizacja
1. Przejrzyj kod pod kątem:
   - Niepotrzebnych re-renderów (React.memo jeśli potrzebne)
   - Powtarzającego się kodu
   - Brakujących TypeScript typów
2. Dodaj komentarze do skomplikowanej logiki
3. Upewnij się że wszystkie propsy mają poprawne typy
4. Sprawdź czy nie ma unused imports

### Krok 12: Dokumentacja i code review
1. Dodaj komentarze JSDoc do funkcji i komponentów
2. Zaktualizuj dokumentację projektu jeśli potrzebne
3. Utwórz Pull Request z opisem zmian
4. Poproś o code review od zespołu
5. Wprowadź sugerowane poprawki

### Krok 13: Testy jednostkowe (opcjonalne ale zalecane)
1. Utwórz plik `src/components/HomePageWrapper.test.tsx`
2. Napisz testy dla:
   - Renderowania LoadingSkeleton podczas ładowania
   - Wyświetlania odpowiedniego CTA dla różnych stanów
   - Obsługi błędów
   - Funkcji retry
3. Mock wywołań API i Supabase auth
4. Uruchom testy: `npm test`

### Krok 14: Deploy i monitoring
1. Merge do brancha głównego po zatwierdzeniu PR
2. Deploy na środowisko testowe/staging
3. Przeprowadź smoke tests na staging
4. Deploy na produkcję
5. Monitoruj logi błędów i metryki wydajności
6. Zbieraj feedback od użytkowników

---

**Koniec planu implementacji**

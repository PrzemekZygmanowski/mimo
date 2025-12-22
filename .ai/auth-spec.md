# Specyfikacja techniczna modułu autentykacji - MIMO

## 1. Wprowadzenie

Niniejsza specyfikacja techniczna opisuje implementację modułu autentykacji dla aplikacji MIMO, zgodnie z wymaganiem **US-004** z dokumentu PRD. Moduł zapewnia bezpieczne logowanie, rejestrację oraz odzyskiwanie hasła użytkowników, z wykorzystaniem Supabase Auth zintegrowanego z Astro 5.

> **⚠️ WAŻNE:** Specyfikacja jest oparta wyłącznie na **US-004** z PRD, które jest szczegółowym i wiążącym wymaganiem. US-004 wyraźnie określa, że aplikacja wspiera **tylko logowanie przez e-mail/hasło** (linia 79 PRD) i że **użytkownik NIE MOŻE korzystać z funkcji bez logowania** (linia 82 PRD). Wzmianki o logowaniu anonimowym w sekcjach 1 i 3 PRD (linie 11, 28) są traktowane jako przestarzałe lub nieaktualne względem szczegółowego wymagania US-004.

### 1.1. Cele modułu

- Umożliwienie rejestracji użytkowników za pomocą adresu e-mail
- Bezpieczne logowanie użytkowników zarejestrowanych przez e-mail i hasło
- Mechanizm odzyskiwania hasła przez e-mail
- Wylogowanie użytkownika
- Przyciski logowania/wylogowania w prawym górnym rogu Layout.astro
- Ochrona istniejących funkcjonalności aplikacji (check-in, zadania, wizualizacja postępów)
- Wymuszenie logowania - dostęp do wszystkich funkcji aplikacji tylko dla zalogowanych użytkowników

### 1.2. Założenia techniczne

- Aplikacja pracuje w trybie SSR (Server-Side Rendering) zgodnie z `astro.config.mjs` (`output: "server"`)
- Supabase Auth jest podstawowym mechanizmem autentykacji (tylko e-mail/hasło, bez OAuth)
- Middleware Astro (`src/middleware/index.ts`) dostarcza `locals.supabase` i `locals.user` do wszystkich tras
- Row Level Security (RLS) w Supabase wspiera użytkowników uwierzytelnionych (`authenticated`)
- Walidacja danych wejściowych odbywa się przy użyciu biblioteki Zod
- Komponenty React są wykorzystywane wyłącznie do interaktywnych elementów UI
- Komponenty Astro służą do statycznej zawartości i layoutów
- Wszystkie funkcje aplikacji wymagają zalogowania - brak dostępu dla użytkowników niezalogowanych

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Nowe strony Astro

#### 2.1.1. Strona logowania (`src/pages/login.astro`)

**Opis:**
Strona umożliwiająca użytkownikom zalogowanie się do aplikacji za pomocą e-maila i hasła.

**Odpowiedzialności:**

- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (redirect do `/` jeśli tak)
- Server-side: Obsługa przekierowania po udanym logowaniu z linku potwierdzającego e-mail
- Rendering: Renderowanie komponentu `LoginForm` (React)

**Struktura:**

```astro
---
export const prerender = false;

// Sprawdzenie czy użytkownik jest już zalogowany
const user = Astro.locals.user;
if (user) {
  return Astro.redirect("/");
}
---

<Layout title='Logowanie - MIMO'>
  <LoginForm client:load />
</Layout>
```

**Routing:**

- `/login` - wyświetla formularz logowania

---

#### 2.1.2. Strona rejestracji (`src/pages/register.astro`)

**Opis:**
Strona umożliwiająca nowym użytkownikom utworzenie konta za pomocą adresu e-mail i hasła.

**Odpowiedzialności:**

- Server-side: Sprawdzenie czy użytkownik jest już zalogowany (redirect do `/` jeśli tak)
- Rendering: Renderowanie komponentu `RegisterForm` (React)

**Struktura:**

```astro
---
export const prerender = false;

const user = Astro.locals.user;
if (user) {
  return Astro.redirect("/");
}
---

<Layout title='Rejestracja - MIMO'>
  <RegisterForm client:load />
</Layout>
```

**Routing:**

- `/register` - wyświetla formularz rejestracji

---

#### 2.1.3. Strona odzyskiwania hasła (`src/pages/forgot-password.astro`)

**Opis:**
Strona umożliwiająca użytkownikom zainicjowanie procesu resetowania hasła.

**Odpowiedzialności:**

- Server-side: Brak specjalnych warunków (użytkownik niezalogowany może resetować hasło)
- Rendering: Renderowanie komponentu `ForgotPasswordForm` (React)

**Struktura:**

```astro
---
export const prerender = false;
---

<Layout title='Przypomnij hasło - MIMO'>
  <ForgotPasswordForm client:load />
</Layout>
```

**Routing:**

- `/forgot-password` - wyświetla formularz przypomnienia hasła

---

#### 2.1.4. Strona resetowania hasła (`src/pages/reset-password.astro`)

**Opis:**
Strona do której użytkownik zostaje przekierowany z linku w e-mailu w celu ustawienia nowego hasła.

**Odpowiedzialności:**

- Server-side: Walidacja tokenu resetowania hasła z URL
- Rendering: Renderowanie komponentu `ResetPasswordForm` (React) z tokenem

**Struktura:**

```astro
---
export const prerender = false;

const url = new URL(Astro.request.url);
const code = url.searchParams.get("code");

if (!code) {
  return Astro.redirect("/forgot-password");
}
---

<Layout title='Resetuj hasło - MIMO'>
  <ResetPasswordForm client:load code={code} />
</Layout>
```

**Routing:**

- `/reset-password?code=<token>` - wyświetla formularz ustawiania nowego hasła

---

### 2.2. Modyfikacje istniejących stron

#### 2.2.1. Strona główna (`src/pages/index.astro`)

**Obecny stan:**
Wyświetla komponent powitalny `Welcome.astro`.

**Wymagane modyfikacje:**

- Server-side: Sprawdzenie stanu autentykacji użytkownika
- Wyświetlenie różnych wariantów strony głównej w zależności od stanu:
  - Użytkownik niezalogowany: przekierowanie do `/login` lub wyświetlenie strony powitalnej z opcjami logowania/rejestracji
  - Użytkownik zalogowany: przekierowanie do `/checkin` lub `/task` w zależności od stanu aplikacji

**Nowa struktura:**

```astro
---
export const prerender = false;

const user = Astro.locals.user;

if (!user) {
  // Przekierowanie do logowania dla niezalogowanych użytkowników
  return Astro.redirect("/login");
}

// Użytkownik zalogowany - sprawdzamy stan aplikacji
// Jeśli ma aktywne zadanie, przekieruj do /task
// Jeśli nie ma aktywnego zadania i może zrobić check-in, przekieruj do /checkin
const supabase = Astro.locals.supabase;

// Pobierz aktywne zadanie użytkownika
const { data: activeTask } = await supabase
  .from("user_tasks")
  .select("*")
  .eq("user_id", user.id)
  .eq("task_date", new Date().toISOString().split("T")[0])
  .single();

if (activeTask && activeTask.status === "pending") {
  return Astro.redirect("/task");
}

// Brak aktywnego zadania - przekieruj do check-in
return Astro.redirect("/checkin");
---
```

**Uwaga:**
Strona główna wymaga zalogowania zgodnie z US-004. Użytkownicy niezalogowani są automatycznie przekierowywani do `/login`.

---

#### 2.2.2. Strona check-in (`src/pages/checkin.astro`)

**Obecny stan:**
Wyświetla komponent `CheckInPage` (React) z `CheckInProvider`.

**Wymagane modyfikacje:**

- Server-side: Dodanie sprawdzenia autentykacji - jeśli użytkownik nie jest zalogowany, przekierowanie do `/login`
- Server-side: Sprawdzenie czy użytkownik może wykonać check-in (zgodnie z regułami biznesowymi)

**Nowa struktura:**

```astro
---
export const prerender = false;

const user = Astro.locals.user;

// Wymóg autentykacji
if (!user) {
  return Astro.redirect("/login");
}

// Opcjonalnie: sprawdzenie czy użytkownik może wykonać check-in
// (np. czy upłynęło 24h od ostatniego zadania lub zadanie zostało wykonane)
---

<Layout title='Check-In - MIMO'>
  <CheckInProvider client:load>
    <CheckInPage client:load />
  </CheckInProvider>
</Layout>
```

---

#### 2.2.3. Strona zadania (`src/pages/task.astro`)

**Obecny stan:**
Wyświetla komponent `TaskPage` (React) z `TaskProvider`.

**Wymagane modyfikacje:**

- Server-side: Dodanie sprawdzenia autentykacji - jeśli użytkownik nie jest zalogowany, przekierowanie do `/login`
- Server-side: Sprawdzenie czy użytkownik ma aktywne zadanie (jeśli nie, przekierowanie do `/checkin`)

**Nowa struktura:**

```astro
---
export const prerender = false;

const user = Astro.locals.user;

if (!user) {
  return Astro.redirect("/login");
}

// Sprawdzenie czy użytkownik ma aktywne zadanie
const supabase = Astro.locals.supabase;
const { data: activeTask } = await supabase
  .from("user_tasks")
  .select("*")
  .eq("user_id", user.id)
  .eq("task_date", new Date().toISOString().split("T")[0])
  .single();

if (!activeTask || activeTask.status !== "pending") {
  return Astro.redirect("/checkin");
}
---

<Layout title='Twoje zadanie - MIMO'>
  <TaskProvider client:load>
    <TaskPage client:load />
  </TaskProvider>
</Layout>
```

---

### 2.3. Nowe komponenty React (client-side)

#### 2.3.1. LoginForm (`src/components/LoginForm.tsx`)

**Odpowiedzialności:**

- Renderowanie formularza logowania z polami e-mail i hasło
- Walidacja danych wejściowych po stronie klienta
- Obsługa submit - wywołanie API Supabase Auth do zalogowania
- Wyświetlanie komunikatów o błędach (np. nieprawidłowe dane logowania)
- Przekierowanie do strony głównej po udanym logowaniu
- Obsługa potwierdzenia e-mail po rejestracji

**Props:**

- Brak (komponent standalone)

**Stan wewnętrzny:**

- `email: string` - adres e-mail wprowadzony przez użytkownika
- `password: string` - hasło wprowadzone przez użytkownika
- `isLoading: boolean` - flaga wskazująca na trwający proces logowania
- `error: string | null` - komunikat błędu do wyświetlenia

**Scenariusze użycia:**

1. **Logowanie e-mail/hasło:**
   - Użytkownik wprowadza e-mail i hasło
   - Kliknięcie przycisku "Zaloguj się"
   - Walidacja: sprawdzenie czy pola nie są puste, czy e-mail ma poprawny format
   - Jeśli walidacja nie przejdzie: wyświetlenie błędu
   - Jeśli walidacja przejdzie: wywołanie `supabaseClient.auth.signInWithPassword()`
   - W przypadku błędu API: wyświetlenie komunikatu błędu (np. "Nieprawidłowy e-mail lub hasło")
   - W przypadku sukcesu: przekierowanie do `/`

2. **Potwierdzenie e-mail po rejestracji:**
   - Użytkownik klika w link w e-mailu po rejestracji
   - Zostaje przekierowany na `/login` z automatycznym potwierdzeniem konta
   - System wykrywa potwierdzenie i automatycznie loguje użytkownika
   - Przekierowanie do `/`

**Walidacja i komunikaty błędów:**

- E-mail pusty: "Podaj adres e-mail"
- E-mail niepoprawny: "Podaj poprawny adres e-mail"
- Hasło puste: "Podaj hasło"
- Nieprawidłowe dane logowania (z API): "Nieprawidłowy e-mail lub hasło"
- Błąd sieci: "Nie można połączyć się z serwerem. Spróbuj ponownie."
- Konto niezweryfikowane: "Potwierdź swoje konto klikając w link wysłany na e-mail"

**Linki nawigacyjne:**

- Link do `/register` - "Nie masz konta? Zarejestruj się"
- Link do `/forgot-password` - "Zapomniałeś hasła?"

---

#### 2.3.2. RegisterForm (`src/components/RegisterForm.tsx`)

**Odpowiedzialności:**

- Renderowanie formularza rejestracji z polami e-mail, hasło, powtórz hasło
- Walidacja danych wejściowych po stronie klienta
- Obsługa submit - wywołanie API Supabase Auth do rejestracji
- Wyświetlanie komunikatów o błędach i sukcesie
- Informowanie użytkownika o konieczności potwierdzenia adresu e-mail

**Props:**

- Brak (komponent standalone)

**Stan wewnętrzny:**

- `email: string` - adres e-mail
- `password: string` - hasło
- `confirmPassword: string` - powtórzone hasło
- `isLoading: boolean` - flaga wskazująca na trwający proces rejestracji
- `error: string | null` - komunikat błędu
- `success: boolean` - flaga sukcesu (po udanej rejestracji)

**Scenariusze użycia:**

1. **Rejestracja nowego użytkownika:**
   - Użytkownik wprowadza e-mail, hasło i powtarza hasło
   - Kliknięcie przycisku "Zarejestruj się"
   - Walidacja:
     - E-mail ma poprawny format
     - Hasło ma minimum 8 znaków
     - Hasła są identyczne
   - Jeśli walidacja nie przejdzie: wyświetlenie błędu
   - Jeśli walidacja przejdzie: wywołanie `supabaseClient.auth.signUp({ email, password })`
   - W przypadku błędu API (np. e-mail już używany): wyświetlenie komunikatu błędu
   - W przypadku sukcesu: wyświetlenie komunikatu o wysłaniu e-maila weryfikacyjnego
   - Automatyczne przekierowanie do `/login` po 3 sekundach

**Walidacja i komunikaty błędów:**

- E-mail pusty: "Podaj adres e-mail"
- E-mail niepoprawny: "Podaj poprawny adres e-mail"
- Hasło puste: "Podaj hasło"
- Hasło zbyt krótkie: "Hasło musi mieć minimum 8 znaków"
- Hasła nie pasują: "Hasła muszą być identyczne"
- E-mail już używany (z API): "Konto z tym adresem e-mail już istnieje"
- Hasło zbyt słabe (z API): "Hasło jest zbyt słabe. Użyj liter, cyfr i znaków specjalnych"

**Komunikat sukcesu:**
"Konto zostało utworzone! Wysłaliśmy link aktywacyjny na adres {email}. Kliknij w link, aby aktywować konto."

**Linki nawigacyjne:**

- Link do `/login` - "Masz już konto? Zaloguj się"

---

#### 2.3.3. ForgotPasswordForm (`src/components/ForgotPasswordForm.tsx`)

**Odpowiedzialności:**

- Renderowanie formularza z polem e-mail
- Walidacja adresu e-mail
- Obsługa submit - wywołanie API Supabase Auth do wysłania linku resetującego hasło
- Wyświetlanie komunikatów o sukcesie i błędach

**Props:**

- Brak (komponent standalone)

**Stan wewnętrzny:**

- `email: string` - adres e-mail
- `isLoading: boolean` - flaga wskazująca na trwający proces
- `error: string | null` - komunikat błędu
- `success: boolean` - flaga sukcesu

**Scenariusze użycia:**

1. **Resetowanie hasła:**
   - Użytkownik wprowadza adres e-mail
   - Kliknięcie przycisku "Wyślij link resetujący"
   - Walidacja: sprawdzenie czy e-mail ma poprawny format
   - Wywołanie `supabaseClient.auth.resetPasswordForEmail(email, { redirectTo: 'https://app-url/reset-password' })`
   - W przypadku błędu: wyświetlenie komunikatu
   - W przypadku sukcesu: wyświetlenie komunikatu o wysłaniu linku

**Walidacja i komunikaty błędów:**

- E-mail pusty: "Podaj adres e-mail"
- E-mail niepoprawny: "Podaj poprawny adres e-mail"
- Błąd sieci: "Nie można połączyć się z serwerem. Spróbuj ponownie."

**Komunikat sukcesu:**
"Link do resetowania hasła został wysłany na adres {email}. Sprawdź swoją skrzynkę e-mail."

**Linki nawigacyjne:**

- Link do `/login` - "Wróć do logowania"

---

#### 2.3.4. ResetPasswordForm (`src/components/ResetPasswordForm.tsx`)

**Odpowiedzialności:**

- Renderowanie formularza z polami nowe hasło i powtórz hasło
- Walidacja danych wejściowych
- Obsługa submit - wywołanie API Supabase Auth do ustawienia nowego hasła
- Wyświetlanie komunikatów o sukcesie i błędach

**Props:**

- `code: string` - token resetowania hasła z URL

**Stan wewnętrzny:**

- `password: string` - nowe hasło
- `confirmPassword: string` - powtórzone hasło
- `isLoading: boolean` - flaga wskazująca na trwający proces
- `error: string | null` - komunikat błędu
- `success: boolean` - flaga sukcesu

**Scenariusze użycia:**

1. **Ustawienie nowego hasła:**
   - Użytkownik wprowadza nowe hasło i powtarza je
   - Kliknięcie przycisku "Ustaw nowe hasło"
   - Walidacja:
     - Hasło ma minimum 8 znaków
     - Hasła są identyczne
   - Wywołanie `supabaseClient.auth.verifyOtp({ type: 'recovery', token: code })` a następnie `supabaseClient.auth.updateUser({ password })`
   - W przypadku błędu: wyświetlenie komunikatu (np. link wygasł)
   - W przypadku sukcesu: wyświetlenie komunikatu i przekierowanie do `/login`

**Walidacja i komunikaty błędów:**

- Hasło puste: "Podaj hasło"
- Hasło zbyt krótkie: "Hasło musi mieć minimum 8 znaków"
- Hasła nie pasują: "Hasła muszą być identyczne"
- Token wygasły (z API): "Link do resetowania hasła wygasł. Poproś o nowy."
- Token nieprawidłowy: "Link do resetowania hasła jest nieprawidłowy."

**Komunikat sukcesu:**
"Hasło zostało zmienione! Za chwilę zostaniesz przekierowany do strony logowania."

---

#### 2.3.5. AuthProvider (`src/contexts/AuthContext.tsx`)

**Odpowiedzialności:**

- Zarządzanie stanem autentykacji w aplikacji po stronie klienta
- Nasłuchiwanie zmian w sesji użytkownika
- Dostarczanie informacji o aktualnie zalogowanym użytkowniku do komponentów
- Dostarczanie funkcji logowania, wylogowania, rejestracji

**Struktura kontekstu:**

```typescript
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
}
```

**Wykorzystanie w aplikacji:**

- Owinięcie głównego layoutu lub poszczególnych stron w `<AuthProvider>`
- Dostęp do stanu autentykacji w komponentach przez `useAuth()`

**Uwaga:**
W obecnej architekturze, autentykacja jest głównie obsługiwana server-side przez middleware. `AuthProvider` może być używany jako warstwa kliencka do synchronizacji stanu i dostarczania funkcji auth dla komponentów React, ale nie jest obowiązkowy. Można też zdecydować się na bezpośrednie używanie `supabaseClient` w komponentach.

---

### 2.4. Modyfikacje layoutu

#### 2.4.1. Layout główny (`src/layouts/Layout.astro`)

**Wymagane modyfikacje (zgodnie z US-004):**

- **WYMAGANE**: Dodanie przycisków logowania/wylogowania w prawym górnym rogu
- Wyświetlanie przycisku "Zaloguj się" dla użytkowników niezalogowanych
- Wyświetlanie przycisku "Wyloguj się" i adresu e-mail dla użytkowników zalogowanych

**Przykładowa struktura:**

```astro
---
import "../styles/global.css";

interface Props {
  title?: string;
}

const { title = "MIMO" } = Astro.props;
const user = Astro.locals.user;
---

<!doctype html>
<html lang='pl'>
  <head>
    <meta charset='UTF-8' />
    <meta name='viewport' content='width=device-width' />
    <link rel='icon' type='image/png' href='/favicon.png' />
    <meta name='generator' content={Astro.generator} />
    <title>{title}</title>
  </head>
  <body>
    <nav class='top-nav'>
      {
        user ? (
          <div class='user-actions'>
            <span class='user-email'>{user.email}</span>
            <form method='POST' action='/api/auth/logout'>
              <button type='submit' class='btn-logout'>
                Wyloguj się
              </button>
            </form>
          </div>
        ) : (
          <a href='/login' class='btn-login'>
            Zaloguj się
          </a>
        )
      }
    </nav>
    <slot />
  </body>
</html>
```

**Uwaga:**
Przyciski logowania/wylogowania w prawym górnym rogu są wymagane przez US-004 (kryteria akceptacji linie 83-84).

---

### 2.5. Podsumowanie przepływu użytkownika

#### Przepływ dla nowego użytkownika:

1. **Pierwsze wejście na stronę:**
   - Użytkownik wchodzi na `/`
   - Brak autentykacji → przekierowanie do `/login`
   - Użytkownik widzi opcje: "Zaloguj się" lub "Zarejestruj się"

2. **Rejestracja:**
   - Użytkownik klika "Zarejestruj się" → przekierowanie do `/register`
   - Wypełnia formularz (e-mail, hasło, powtórz hasło) i klika "Zarejestruj się"
   - System wysyła e-mail weryfikacyjny
   - Wyświetlenie komunikatu o konieczności potwierdzenia e-maila
   - Użytkownik klika w link w e-mailu
   - Automatyczne potwierdzenie konta i przekierowanie do `/login`
   - Użytkownik loguje się podając e-mail i hasło

3. **Pierwsza sesja (po zalogowaniu):**
   - Użytkownik wykonuje check-in → `/checkin`
   - System generuje zadanie na podstawie nastroju i energii
   - Przekierowanie do `/task`
   - Użytkownik wykonuje lub pomija zadanie
   - Wizualizacja postępu w ogródku

#### Przepływ dla powracającego użytkownika:

1. **Wejście na stronę:**
   - Użytkownik wchodzi na `/`
   - Middleware sprawdza sesję (Astro.locals.user)
   - Jeśli sesja ważna: sprawdzenie stanu aplikacji (czy ma aktywne zadanie)
   - Przekierowanie do odpowiedniej strony (`/task` lub `/checkin`)

2. **Wygaśnięta sesja:**
   - Użytkownik wchodzi na `/`
   - Brak ważnej sesji → przekierowanie do `/login`

#### Przepływ resetowania hasła:

1. Użytkownik klika "Zapomniałeś hasła?" na `/login`
2. Przekierowanie do `/forgot-password`
3. Użytkownik wprowadza e-mail i klika "Wyślij link"
4. System wysyła e-mail z linkiem resetującym
5. Użytkownik klika w link w e-mailu
6. Przekierowanie do `/reset-password?code=<token>`
7. Użytkownik wprowadza nowe hasło
8. Po sukcesie: przekierowanie do `/login`

---

## 3. LOGIKA BACKENDOWA

### 3.1. Endpointy API

Moduł autentykacji wykorzystuje API Supabase Auth, które jest wywoływane bezpośrednio z komponentów React po stronie klienta. Nie wymaga tworzenia dedykowanych endpointów API w Astro, ponieważ Supabase Auth obsługuje wszystkie operacje autentykacyjne.

Jednak dla spójności z architekturą aplikacji i ewentualnej przyszłej rozbudowy, możemy rozważyć utworzenie wrapper endpoints:

#### 3.1.1. POST /api/auth/register (opcjonalnie)

**Cel:**
Wrapper dla rejestracji użytkownika, pozwalający na dodatkową logikę server-side (np. tworzenie rekordu w user_plants_progress).

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Walidacja (Zod):**

```typescript
const registerSchema = z.object({
  email: z.string().email("Nieprawidłowy format e-mail"),
  password: z.string().min(8, "Hasło musi mieć minimum 8 znaków"),
});
```

**Logika:**

1. Walidacja danych wejściowych
2. Wywołanie `supabase.auth.signUp({ email, password })`
3. W przypadku sukcesu: utworzenie rekordu w `user_plants_progress` dla nowego użytkownika
4. Zwrócenie odpowiedzi

**Obsługa błędów:**

- 400: Nieprawidłowe dane wejściowe
- 409: E-mail już używany
- 500: Błąd serwera

**Response:**

```typescript
{
  user: {
    id: string;
    email: string;
  }
  message: string;
}
```

---

#### 3.1.2. POST /api/auth/login (opcjonalnie)

**Cel:**
Wrapper dla logowania użytkownika.

**Request Body:**

```typescript
{
  email: string;
  password: string;
}
```

**Walidacja (Zod):**

```typescript
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format e-mail"),
  password: z.string().min(1, "Hasło jest wymagane"),
});
```

**Logika:**

1. Walidacja danych wejściowych
2. Wywołanie `supabase.auth.signInWithPassword({ email, password })`
3. Zwrócenie odpowiedzi z tokenami sesji

**Obsługa błędów:**

- 400: Nieprawidłowe dane wejściowe
- 401: Nieprawidłowy e-mail lub hasło
- 500: Błąd serwera

---

#### 3.1.3. POST /api/auth/logout

**Cel:**
Wylogowanie użytkownika.

**Request Body:**
Brak

**Logika:**

1. Wywołanie `supabase.auth.signOut()`
2. Usunięcie ciasteczka sesji
3. Zwrócenie odpowiedzi sukcesu

**Obsługa błędów:**

- 500: Błąd serwera

---

**Uwaga:**
Powyższe endpointy są opcjonalne. Supabase Auth może być używany bezpośrednio z klienta, a utworzenie wrapper endpoints ma sens tylko jeśli potrzebujemy dodatkowej logiki server-side (np. inicjalizacja danych użytkownika, logowanie zdarzeń).

---

### 3.2. Modyfikacje middleware

#### 3.2.1. Obecny stan middleware (`src/middleware/index.ts`)

Middleware już pobiera użytkownika z Supabase Auth i umieszcza go w `Astro.locals.user`. To jest fundamentalna część systemu autentykacji.

**Kod:**

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.supabase = supabaseClient;
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();
  context.locals.user = user;
  return next();
});
```

**Propozycje rozszerzeń:**

1. **Zarządzanie ciasteczkami sesji:**
   - Middleware może synchronizować sesję Supabase z ciasteczkami HTTP-only dla większego bezpieczeństwa
   - Przy każdym żądaniu sprawdzać ważność tokenu i ewentualnie odświeżać go

2. **Logowanie zdarzeń autentykacyjnych:**
   - Rejestrowanie w `user_events` informacji o logowaniu/wylogowaniu
   - Tracking aktywności użytkownika dla celów analitycznych

3. **Rate limiting:**
   - Ochrona przed atakami brute-force na endpointy logowania
   - Implementacja limitu prób logowania

**Zmodyfikowana wersja middleware:**

```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // Inicjalizacja klienta Supabase z session cookies
  const accessToken = context.cookies.get("sb-access-token")?.value;
  const refreshToken = context.cookies.get("sb-refresh-token")?.value;

  if (accessToken && refreshToken) {
    // Ustaw sesję w kliencie Supabase
    await supabaseClient.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  context.locals.supabase = supabaseClient;

  // Pobierz użytkownika
  const {
    data: { user },
    error: authError,
  } = await context.locals.supabase.auth.getUser();

  context.locals.user = user;

  // Jeśli sesja jest ważna, zaktualizuj ciasteczka
  if (user) {
    const {
      data: { session },
    } = await context.locals.supabase.auth.getSession();
    if (session) {
      context.cookies.set("sb-access-token", session.access_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60, // 1 godzina
      });
      context.cookies.set("sb-refresh-token", session.refresh_token, {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7, // 7 dni
      });
    }
  } else {
    // Usuń ciasteczka jeśli użytkownik nie jest zalogowany
    context.cookies.delete("sb-access-token");
    context.cookies.delete("sb-refresh-token");
  }

  return next();
});
```

**Uwaga:**
Supabase ma własną bibliotekę `@supabase/ssr` dedykowaną do zarządzania sesją w środowisku SSR. Zaleca się rozważenie jej użycia dla lepszej integracji.

---

### 3.3. Modyfikacje istniejących endpointów API

Wszystkie istniejące endpointy API już implementują sprawdzanie autentykacji przez:

```typescript
const {
  data: { user },
  error: authError,
} = await locals.supabase.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
}
```

**Brak dodatkowych modyfikacji jest wymagany**, ponieważ mechanizm autentykacji działa poprawnie.

**Opcjonalne usprawnienia:**

1. **Wydzielenie middleware dla endpointów:**
   - Utworzenie funkcji pomocniczej `requireAuth()` dla DRY

```typescript
// src/lib/auth-helpers.ts
export async function requireAuth(locals: App.Locals) {
  const {
    data: { user },
    error: authError,
  } = await locals.supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

// Użycie w endpoincie:
export const GET: APIRoute = async ({ locals }) => {
  try {
    const user = await requireAuth(locals);
    // ... reszta logiki
  } catch (error) {
    if (error.message === "Unauthorized") {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    // ... obsługa innych błędów
  }
};
```

2. **Różnicowanie użytkowników anonimowych i zarejestrowanych:**
   - W niektórych endpointach możemy chcieć ograniczyć dostęp tylko do użytkowników z e-mailem
   - Dodanie sprawdzenia `user.is_anonymous`

---

### 3.4. Inicjalizacja danych użytkownika

Po utworzeniu nowego konta, system powinien zainicjalizować dane użytkownika w bazie danych.

#### 3.4.1. Tworzenie rekordu w user_plants_progress

**Kiedy:**
Bezpośrednio po udanej rejestracji.

**Gdzie:**

- W wrapper endpoincie `/api/auth/register`
- Lub w funkcji pomocniczej wywoływanej z komponentu React po udanej rejestracji
- Alternatywnie: przy pierwszym check-in użytkownika (lazy initialization)

**Logika:**

```typescript
// Po udanej rejestracji
const { data: userData } = await supabase.auth.signUp({ email, password });
if (userData.user) {
  // Utwórz rekord w user_plants_progress
  await supabase.from("user_plants_progress").insert({
    user_id: userData.user.id,
    board_state: JSON.stringify(Array(30).fill(null)), // 5x6 = 30 pól
    last_updated_at: new Date().toISOString(),
  });
}
```

**Obsługa błędów:**

- Jeśli tworzenie rekordu się nie powiedzie, zarejestrować błąd ale nie przerywać rejestracji
- Rekord może być utworzony później przy pierwszym dostępie do funkcjonalności postępów

---

### 3.5. Walidacja danych wejściowych

Wszystkie dane wejściowe z formularzy autentykacyjnych powinny być walidowane zarówno po stronie klienta (React) jak i serwera (endpointy API lub bezpośrednio w Supabase).

#### 3.5.1. Schematy walidacji Zod

```typescript
// src/lib/validation/auth-schemas.ts

import { z } from "zod";

export const emailSchema = z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail");

export const passwordSchema = z
  .string()
  .min(8, "Hasło musi mieć minimum 8 znaków")
  .regex(/[a-z]/, "Hasło musi zawierać małą literę")
  .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
  .regex(/[0-9]/, "Hasło musi zawierać cyfrę");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Hasło jest wymagane"),
});

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Hasła muszą być identyczne",
    path: ["confirmPassword"],
  });
```

**Użycie w komponentach React:**

```typescript
import { loginSchema } from "../lib/validation/auth-schemas";

// W komponencie
try {
  const validated = loginSchema.parse({ email, password });
  // Wywołaj API
} catch (error) {
  if (error instanceof z.ZodError) {
    // Wyświetl błędy walidacji
  }
}
```

---

### 3.6. Obsługa wyjątków

#### 3.6.1. Kategorie błędów

1. **Błędy walidacji (400):**
   - Nieprawidłowy format danych wejściowych
   - Komunikaty powinny być user-friendly i po polsku

2. **Błędy autentykacji (401):**
   - Nieprawidłowe dane logowania
   - Brak tokenu sesji
   - Token wygasły

3. **Błędy autoryzacji (403):**
   - Użytkownik nie ma uprawnień do wykonania operacji
   - (W kontekście autentykacji: np. próba konwersji konta nie-anonimowego)

4. **Błędy aplikacji (409, 422):**
   - E-mail już używany
   - Konto niezweryfikowane

5. **Błędy serwera (500):**
   - Błędy bazy danych
   - Błędy komunikacji z Supabase
   - Niespodziewane błędy

#### 3.6.2. Ustandaryzowany format błędów

```typescript
interface ErrorResponse {
  error: string; // Komunikat błędu po polsku
  code?: string; // Kod błędu dla aplikacji (np. 'EMAIL_ALREADY_EXISTS')
  details?: Record<string, string>; // Szczegóły błędów walidacji
}
```

**Przykład:**

```json
{
  "error": "Nie udało się utworzyć konta",
  "code": "EMAIL_ALREADY_EXISTS",
  "details": {
    "email": "Konto z tym adresem e-mail już istnieje"
  }
}
```

#### 3.6.3. Mapowanie błędów Supabase na komunikaty po polsku

```typescript
// src/lib/error-mapping.ts

export function mapSupabaseError(error: any): string {
  const errorCode = error.code || error.message;

  const errorMap: Record<string, string> = {
    invalid_credentials: "Nieprawidłowy e-mail lub hasło",
    email_exists: "Konto z tym adresem e-mail już istnieje",
    weak_password: "Hasło jest zbyt słabe",
    invalid_email: "Nieprawidłowy adres e-mail",
    email_not_confirmed: "Potwierdź swoje konto klikając w link wysłany na e-mail",
    user_not_found: "Nie znaleziono użytkownika o tym adresie e-mail",
    token_expired: "Link wygasł. Poproś o nowy.",
    invalid_token: "Link jest nieprawidłowy",
  };

  return errorMap[errorCode] || "Wystąpił nieoczekiwany błąd. Spróbuj ponownie.";
}
```

---

### 3.7. Bezpieczeństwo

#### 3.7.1. Zabezpieczenia po stronie serwera

1. **HTTP-only cookies:**
   - Przechowywanie tokenów sesji w ciasteczkach HTTP-only (nie dostępne z JavaScript)
   - Ochrona przed atakami XSS

2. **HTTPS:**
   - Wymuszenie HTTPS dla wszystkich połączeń
   - Ochrona przed podsłuchiwaniem

3. **CSRF protection:**
   - Dodanie CSRF tokens dla formularzy (jeśli używamy server-side form submissions)
   - Supabase automatycznie zabezpiecza przed CSRF przy użyciu własnych mechanizmów

4. **Rate limiting:**
   - Ograniczenie liczby prób logowania z jednego IP
   - Ochrona przed atakami brute-force
   - Implementacja przez middleware lub Supabase Edge Functions

5. **Input sanitization:**
   - Walidacja wszystkich danych wejściowych
   - Ochrona przed SQL injection (Supabase automatycznie zabezpiecza)

#### 3.7.2. Zabezpieczenia po stronie klienta

1. **Walidacja formularzy:**
   - Walidacja po stronie klienta dla lepszego UX
   - Zawsze powtórzona walidacja po stronie serwera

2. **Przechowywanie danych:**
   - Nie przechowywać poufnych danych (haseł, tokenów) w localStorage
   - Supabase automatycznie zarządza tokenami w bezpieczny sposób

3. **Timeout sesji:**
   - Automatyczne wylogowanie po okresie nieaktywności
   - Wyświetlenie komunikatu przed wylogowaniem

---

## 4. SYSTEM AUTENTYKACJI

### 4.1. Supabase Auth - Przegląd

Supabase Auth to kompletne rozwiązanie autentykacyjne oparte na JWT (JSON Web Tokens). W aplikacji MIMO wykorzystujemy:

- Rejestrację i logowanie e-mail/hasło (podstawowa metoda)
- Zarządzanie sesją
- Odświeżanie tokenów
- Resetowanie hasła przez e-mail

**Wyłączone funkcjonalności (zgodnie z US-004):**

- ❌ Logowanie anonimowe
- ❌ OAuth providers (Google, GitHub, etc.)
- ❌ Magic links (passwordless login)

### 4.2. Konfiguracja Supabase Auth

#### 4.2.1. Ustawienia projektu Supabase

**Authentication settings (w Supabase Dashboard):**

1. **Enable Email Provider:**
   - Włączone
   - Confirm email: Tak (wymagane potwierdzenie e-mail po rejestracji)
   - Secure email change: Tak

2. **Enable Anonymous Sign-ins:**
   - **Wyłączone** (zgodnie z US-004 - brak logowania anonimowego)

3. **Disable all OAuth Providers:**
   - Google, GitHub, Facebook - wszystkie **wyłączone**

4. **Site URL:**
   - URL aplikacji produkcyjnej (np. `https://mimo-app.com`)

5. **Redirect URLs:**
   - Whitelist URLs do których użytkownicy mogą być przekierowywani:
     - `https://mimo-app.com/login`
     - `https://mimo-app.com/reset-password`
     - `http://localhost:3000/login` (dla developmentu)
     - `http://localhost:3000/reset-password` (dla developmentu)

6. **Email Templates:**
   - Customize email templates (potwierdzenie rejestracji, reset hasła)
   - Dostosowanie do języka polskiego i stylu aplikacji

**Przykładowy szablon e-mail rejestracji (po polsku):**

```
Witaj w MIMO!

Cieszymy się, że do nas dołączyłeś. Kliknij w poniższy link, aby aktywować swoje konto:

{{ .ConfirmationURL }}

Jeśli nie zakładałeś konta w MIMO, zignoruj tę wiadomość.

Zespół MIMO
```

#### 4.2.2. Konfiguracja zmiennych środowiskowych

**Plik `.env`:**

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key # tylko dla operacji server-side
```

**Uwaga:**
`SUPABASE_SERVICE_KEY` powinien być używany tylko po stronie serwera (w endpointach API, nie w komponentach React) i nigdy nie powinien być eksponowany do klienta.

#### 4.2.3. Inicjalizacja klienta Supabase

**Obecna konfiguracja (`src/db/supabase.client.ts`):**

```typescript
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
export type SupabaseClient = typeof supabaseClient;
```

**Propozycja rozszerzenia dla lepszej obsługi SSR:**

```typescript
// src/db/supabase.client.ts
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type SupabaseClient = typeof supabaseClient;

// Funkcja do tworzenia klienta z custom session (dla SSR)
export function createServerSupabaseClient(accessToken?: string, refreshToken?: string) {
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  if (accessToken && refreshToken) {
    client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  return client;
}
```

---

### 4.3. Przepływy autentykacyjne

#### 4.3.1. Rejestracja z e-mailem

**Krok po kroku:**

1. Użytkownik wypełnia formularz rejestracji (e-mail, hasło)
2. Komponent React wywołuje:
   ```typescript
   const { data, error } = await supabaseClient.auth.signUp({
     email,
     password,
   });
   ```
3. Supabase tworzy użytkownika w tabeli `auth.users`
4. Supabase wysyła e-mail z linkiem potwierdzającym
5. Stan użytkownika: `email_confirmed_at` jest null
6. Użytkownik klika w link w e-mailu
7. Link kieruje do URL: `https://mimo-app.com/login?token=<token>&type=signup`
8. Strona `/login` wykrywa parametry i automatycznie potwierdza e-mail
9. Użytkownik jest zalogowany

**Obsługa potwierdzenia e-mail w komponencie LoginForm:**

```typescript
useEffect(() => {
  const { data: authListener } = supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      // Użytkownik zalogowany po potwierdzeniu e-mail
      navigate("/");
    }
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
```

---

#### 4.3.2. Logowanie z e-mailem i hasłem

**Krok po kroku:**

1. Użytkownik wypełnia formularz logowania (e-mail, hasło)
2. Komponent React wywołuje:
   ```typescript
   const { data, error } = await supabaseClient.auth.signInWithPassword({
     email,
     password,
   });
   ```
3. Supabase weryfikuje dane logowania
4. W przypadku sukcesu: zwraca session z access_token i refresh_token
5. Tokeny są automatycznie przechowywane przez Supabase client
6. Użytkownik jest przekierowany do `/`

---

#### 4.3.3. Resetowanie hasła

**Krok po kroku:**

1. Użytkownik klika "Zapomniałeś hasła?" na `/login`
2. Przekierowanie do `/forgot-password`
3. Użytkownik wprowadza e-mail i klika "Wyślij link"
4. Komponent wywołuje:
   ```typescript
   const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
     redirectTo: "https://mimo-app.com/reset-password",
   });
   ```
5. Supabase wysyła e-mail z linkiem resetującym
6. Link kieruje do URL: `https://mimo-app.com/reset-password?code=<token>&type=recovery`
7. Strona `/reset-password` wyświetla formularz nowego hasła
8. Użytkownik wprowadza nowe hasło i klika "Ustaw hasło"
9. Komponent wywołuje:

   ```typescript
   // Najpierw weryfikuj token
   const { data, error: verifyError } = await supabaseClient.auth.verifyOtp({
     token_hash: code,
     type: "recovery",
   });

   if (data.session) {
     // Następnie ustaw nowe hasło
     const { error: updateError } = await supabaseClient.auth.updateUser({
       password: newPassword,
     });
   }
   ```

10. Po sukcesie: przekierowanie do `/login`

---

#### 4.3.4. Wylogowanie

**Krok po kroku:**

1. Użytkownik klika "Wyloguj się" na `/profile` lub w nawigacji
2. Komponent wywołuje:
   ```typescript
   const { error } = await supabaseClient.auth.signOut();
   ```
3. Supabase usuwa sesję
4. Ciasteczka z tokenami są usuwane (automatycznie lub przez middleware)
5. Użytkownik jest przekierowany do `/login`

---

### 4.4. Zarządzanie sesją

#### 4.4.1. Cykl życia sesji

1. **Utworzenie sesji:**
   - Po udanym logowaniu lub rejestracji
   - Supabase zwraca `access_token` (ważny 1 godzinę) i `refresh_token` (ważny 7 dni)

2. **Przechowywanie tokenów:**
   - Supabase client domyślnie przechowuje tokeny w localStorage
   - Dla lepszego bezpieczeństwa SSR: przechowywanie w HTTP-only cookies (przez middleware)

3. **Odświeżanie tokenów:**
   - Supabase automatycznie odświeża access_token używając refresh_token
   - `autoRefreshToken: true` w konfiguracji klienta

4. **Wygaśnięcie sesji:**
   - Po 7 dniach bez odświeżenia, refresh_token wygasa
   - Użytkownik musi zalogować się ponownie

5. **Inwalidacja sesji:**
   - Przez wylogowanie (signOut)
   - Przez zmianę hasła (opcjonalnie można wylogować wszystkie sesje)

#### 4.4.2. Synchronizacja sesji między klientem a serwerem

**Problem:**
W architekturze SSR (Astro), sesja musi być dostępna zarówno po stronie serwera (middleware, strony Astro) jak i klienta (komponenty React).

**Rozwiązanie:**

1. **Server → Client:**
   - Middleware pobiera sesję z ciasteczek
   - Ustawia `locals.user`
   - Strony Astro przekazują dane użytkownika do komponentów React jako props

2. **Client → Server:**
   - Komponent React wykonuje operację auth (np. logowanie)
   - Supabase client aktualizuje sesję
   - Należy wywołać endpoint API do synchronizacji ciasteczek lub wykonać pełne przeładowanie strony

**Przykład:**

```typescript
// Po udanym logowaniu w komponencie React
const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

if (data.session) {
  // Opcja 1: Przekieruj z pełnym przeładowaniem (proste)
  window.location.href = "/";

  // Opcja 2: Wywołaj endpoint do ustawienia ciasteczek (bardziej złożone)
  await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }),
  });
  navigate("/");
}
```

**Zalecenie:**
Użycie biblioteki `@supabase/ssr` która automatycznie zarządza synchronizacją sesji w środowisku SSR. Wymaga refaktoryzacji `supabase.client.ts` i middleware.

---

### 4.5. Row Level Security (RLS)

RLS w Supabase zapewnia, że użytkownicy mają dostęp tylko do swoich danych.

#### 4.5.1. Polityki RLS dla użytkowników authenticated

Obecne polityki w bazie danych już wspierają użytkowników authenticated:

```sql
create policy check_ins_select_auth on check_ins for select
  to authenticated
  using (user_id = current_setting('app.current_user_id')::uuid);
```

**Problem:**
Polityka używa `current_setting('app.current_user_id')` zamiast `auth.uid()`.

**Rekomendacja:**
Zmodyfikować polityki aby używały wbudowanej funkcji Supabase `auth.uid()`:

```sql
create policy check_ins_select_auth on check_ins for select
  to authenticated
  using (user_id = auth.uid());
```

To samo dla wszystkich innych polityk w tabelach: `user_tasks`, `user_events`, `user_plants_progress`.

**Uzasadnienie:**

- `auth.uid()` automatycznie zwraca ID użytkownika z tokenu JWT
- Nie wymaga ustawienia custom setting
- Jest standardowym podejściem w Supabase

#### 4.5.2. Polityki RLS - usunięcie niepotrzebnych polityk dla roli anon

Aplikacja nie wspiera logowania anonimowego zgodnie z US-004. Wszystkie polityki dla roli `anon` powinny zostać usunięte z bazy danych.

**Rekomendacja:**
Usunąć wszystkie polityki dla roli `anon` i polegać tylko na politykach dla `authenticated`, ponieważ wszyscy użytkownicy aplikacji muszą być uwierzytelnieni przez e-mail i hasło.

#### 4.5.3. Migracja bazy danych - aktualizacja polityk RLS

**Nowa migracja: `20251220000000_update_rls_policies.sql`**

```sql
-- Usunięcie starych polityk dla check_ins
drop policy if exists check_ins_select_anon on check_ins;
drop policy if exists check_ins_select_auth on check_ins;
drop policy if exists check_ins_insert_anon on check_ins;
drop policy if exists check_ins_insert_auth on check_ins;
drop policy if exists check_ins_update_anon on check_ins;
drop policy if exists check_ins_update_auth on check_ins;
drop policy if exists check_ins_delete_anon on check_ins;
drop policy if exists check_ins_delete_auth on check_ins;

-- Utworzenie nowych polityk używających auth.uid()
create policy check_ins_select on check_ins
  for select
  to authenticated
  using (user_id = auth.uid());

create policy check_ins_insert on check_ins
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy check_ins_update on check_ins
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy check_ins_delete on check_ins
  for delete
  to authenticated
  using (user_id = auth.uid());

-- Powtórzyć dla pozostałych tabel: user_tasks, user_events, user_plants_progress
-- ...
```

---

### 4.6. Testowanie systemu autentykacji

#### 4.6.1. Scenariusze testowe

1. **Rejestracja nowego użytkownika:**
   - Wypełnienie formularza z poprawnymi danymi
   - Weryfikacja wysłania e-maila
   - Kliknięcie w link w e-mailu
   - Weryfikacja automatycznego logowania
   - Sprawdzenie utworzenia rekordu w user_plants_progress

2. **Rejestracja z błędami:**
   - E-mail już używany
   - Słabe hasło
   - Nieprawidłowy format e-mail
   - Hasła nie pasują

3. **Logowanie:**
   - Logowanie z poprawnymi danymi
   - Logowanie z nieprawidłowym hasłem
   - Logowanie z nieistniejącym e-mailem
   - Logowanie przed potwierdzeniem e-maila

4. **Resetowanie hasła:**
   - Wysłanie linku resetującego
   - Ustawienie nowego hasła
   - Logowanie z nowym hasłem

5. **Wylogowanie:**
   - Wylogowanie użytkownika przez przycisk w prawym górnym rogu
   - Weryfikacja braku dostępu do chronionych stron
   - Próba dostępu do API bez sesji

6. **Sesja:**
   - Odświeżanie tokenu
   - Wygaśnięcie sesji
   - Synchronizacja sesji między kartami przeglądarki

#### 4.6.2. Narzędzia testowe

1. **Testy jednostkowe:**
   - Vitest dla funkcji pomocniczych (walidacja, mapowanie błędów)

2. **Testy integracyjne:**
   - Playwright dla testów end-to-end przepływów autentykacyjnych

3. **Testy API:**
   - Testy endpointów auth (jeśli tworzone)
   - Weryfikacja odpowiedzi i kodów statusu

---

## 5. MIGRACJA DANYCH I WDROŻENIE

### 5.1. Plan migracji

Aplikacja MIMO prawdopodobnie nie ma jeszcze użytkowników produkcyjnych (jest w fazie MVP), więc migracja danych nie jest konieczna. Jednak dla kompletności:

#### 5.1.1. Scenariusz: Migracja z development do production

1. **Przygotowanie:**
   - Wykonanie backupu bazy danych development
   - Weryfikacja wszystkich migracji SQL

2. **Wdrożenie migracji:**
   - Uruchomienie migracji na bazie produkcyjnej
   - Weryfikacja polityk RLS

3. **Konfiguracja Supabase Auth:**
   - Ustawienie właściwych URL w konfiguracji projektu
   - Dostosowanie szablonów e-mail
   - Włączenie logowania anonimowego

4. **Weryfikacja:**
   - Testy rejestracji i logowania na produkcji
   - Sprawdzenie wysyłki e-maili

### 5.2. Plan wdrożenia modułu autentykacji

#### Faza 1: Przygotowanie infrastruktury (1-2 dni)

- Konfiguracja Supabase Auth w projekcie Supabase
- Aktualizacja polityk RLS w bazie danych
- Przygotowanie szablonów e-mail

#### Faza 2: Implementacja UI (3-5 dni)

- Utworzenie stron: login, register, forgot-password, reset-password, profile
- Implementacja komponentów React: LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm, ProfilePage
- Stylizacja komponentów zgodnie z designem aplikacji

#### Faza 3: Integracja backendu (2-3 dni)

- Modyfikacja middleware dla zarządzania sesją
- Aktualizacja istniejących stron (index, checkin, task) o sprawdzanie autentykacji
- Utworzenie funkcji pomocniczych dla autentykacji

#### Faza 4: Testowanie (2-3 dni)

- Testy manualne wszystkich przepływów autentykacyjnych
- Testy automatyczne (E2E) dla krytycznych scenariuszy
- Testy bezpieczeństwa (próby ataków, CSRF, XSS)

#### Faza 5: Optymalizacja i dokumentacja (1-2 dni)

- Optymalizacja wydajności (czas ładowania stron auth)
- Dokumentacja dla developerów
- Dokumentacja dla użytkowników końcowych (FAQ, Help)

#### Faza 6: Wdrożenie produkcyjne (1 dzień)

- Deploy na środowisko produkcyjne
- Monitorowanie błędów
- Szybkie reakcje na problemy

**Całkowity czas: 10-16 dni roboczych**

---

## 6. BEZPIECZEŃSTWO I ZGODNOŚĆ Z WYMAGANIAMI

### 6.1. Zgodność z US-004

**Wymaganie:** "Aplikacja umożliwia użytkownikowi bezpieczne logowanie poprzez rejestrację za pomocą e-mail, gwarantując ochronę danych osobowych."

**Realizacja:**

- ✅ Rejestracja z e-mailem: implementowana przez Supabase Auth `signUp()`
- ✅ Logowanie e-mail/hasło: implementowane przez Supabase Auth `signInWithPassword()`
- ✅ Bezpieczeństwo: HTTPS, HTTP-only cookies, JWT, RLS
- ✅ Ochrona danych: Supabase jest zgodny z GDPR, dane są szyfrowane
- ✅ Brak zewnętrznych serwisów logowania (Google, GitHub) - zgodnie z US-004

**Kryteria akceptacji:**

- ✅ Logowanie i rejestracja odbywają się na dedykowanych stronach (`/login`, `/register`)
- ✅ Użytkownik ma możliwość logowania przez e-mail (tylko e-mail, bez innych metod)
- ✅ Dane użytkownika są szyfrowane (Supabase szyfruje dane at-rest i in-transit)
- ✅ System stosuje odpowiednie procedury bezpieczeństwa (JWT, RLS, HTTPS)
- ✅ Dostęp do funkcji aplikacji jest zależny od pomyślnego logowania (sprawdzanie w middleware i stronach)
- ✅ Historia wykonywanych zadań jest powiązana z kontem użytkownika (RLS zapewnia izolację danych)
- ✅ Użytkownik NIE MOŻE korzystać z funkcji bez logowania (wszystkie strony wymagają autentykacji)
- ✅ Przyciski logowania/wylogowania w prawym górnym rogu Layout.astro
- ✅ Odzyskiwanie hasła jest możliwe (`/forgot-password`, `/reset-password`)

### 6.2. Zachowanie istniejącej funkcjonalności

**Wymaganie:** Moduł autentykacji nie może naruszyć istniejącego działania aplikacji.

**Sprawdzenie:**

1. **Check-in:**
   - ✅ Strona `/checkin` wymaga autentykacji (dodane sprawdzenie)
   - ✅ Logika check-in pozostaje bez zmian
   - ✅ API endpoint `/api/checkins` już sprawdza autentykację

2. **Zadania:**
   - ✅ Strona `/task` wymaga autentykacji (dodane sprawdzenie)
   - ✅ Logika zadań pozostaje bez zmian
   - ✅ API endpoint `/api/user-tasks` już sprawdza autentykację

3. **Wizualizacja postępów:**
   - ✅ Dane w `user_plants_progress` są powiązane z `user_id`
   - ✅ RLS zapewnia dostęp tylko do własnych danych
   - ✅ API endpoint `/api/plants-progress` już sprawdza autentykację

4. **Polityki RLS:**
   - ✅ Zaktualizowane do używania `auth.uid()`
   - ✅ Wspierają tylko użytkowników uwierzytelnionych przez e-mail (rola `authenticated`)
   - ✅ Usunięte niepotrzebne polityki dla roli `anon`

**Wniosek:**
Moduł autentykacji integruje się z istniejącą aplikacją bez naruszania jej funkcjonalności. Wszystkie istniejące endpointy już sprawdzają autentykację, więc dodanie modułu auth jest naturalnym uzupełnieniem architektury.

---

## 7. WNIOSKI I REKOMENDACJE

### 7.1. Kluczowe decyzje architektoniczne

1. **Supabase Auth jako fundament:**
   - Decyzja: Wykorzystanie Supabase Auth do obsługi wszystkich operacji autentykacyjnych
   - Uzasadnienie: Pełna integracja z bazą danych, bezpieczeństwo, skalowalność, łatwość wdrożenia

2. **Komponenty React dla interaktywności:**
   - Decyzja: Formularze autentykacyjne jako komponenty React
   - Uzasadnienie: Dynamiczna walidacja, lepsze UX, łatwość zarządzania stanem

3. **SSR w Astro dla bezpieczeństwa:**
   - Decyzja: Sprawdzanie autentykacji server-side w stronach Astro
   - Uzasadnienie: Bezpieczeństwo (nie można ominąć sprawdzania po stronie klienta), SEO, performance

4. **HTTP-only cookies dla tokenów:**
   - Decyzja: Przechowywanie tokenów sesji w HTTP-only cookies zamiast localStorage
   - Uzasadnienie: Ochrona przed atakami XSS

5. **Aktualizacja polityk RLS do auth.uid():**
   - Decyzja: Migracja polityk z custom settings do wbudowanej funkcji auth.uid()
   - Uzasadnienie: Standardowe podejście w Supabase, prostsze, bardziej niezawodne

### 7.2. Potencjalne rozszerzenia (poza zakresem MVP)

**Uwaga:** Zgodnie z US-004, OAuth providers (Google, GitHub) nie są używane w pierwszej wersji aplikacji.

1. **Two-factor authentication (2FA):**
   - Dodatkowa warstwa bezpieczeństwa dla użytkowników
   - Supabase wspiera 2FA (TOTP)
   - Zwiększenie ochrony kont

2. **Zarządzanie sesjami:**
   - Dashboard z listą aktywnych sesji użytkownika
   - Możliwość wylogowania ze wszystkich urządzeń naraz
   - Informacje o ostatniej aktywności

3. **Audit log:**
   - Rejestrowanie wszystkich zdarzeń związanych z autentykacją
   - Wykorzystanie istniejącej tabeli `user_events`
   - Monitoring podejrzanej aktywności

4. **Progressive Web App (PWA):**
   - Wsparcie dla offline authentication
   - Service workers do cache'owania sesji
   - Możliwość zainstalowania aplikacji na urządzeniu

5. **Strona profilu użytkownika:**
   - Zarządzanie kontem (zmiana hasła, e-mail)
   - Historia aktywności
   - Ustawienia prywatności

### 7.3. Najlepsze praktyki do zastosowania

1. **Walidacja wszędzie:**
   - Zawsze walidować dane wejściowe zarówno po stronie klienta jak i serwera

2. **User-friendly error messages:**
   - Komunikaty błędów po polsku, zrozumiałe dla użytkownika
   - Nie ujawniać szczegółów technicznych (bezpieczeństwo)

3. **Graceful degradation:**
   - Aplikacja powinna działać nawet jeśli część funkcji auth jest niedostępna
   - Wyświetlanie komunikatów o problemach z połączeniem

4. **Accessibility:**
   - Wszystkie formularze powinny być dostępne dla screen readers
   - Odpowiednie etykiety ARIA
   - Keyboard navigation

5. **Performance:**
   - Optymalizacja czasu ładowania stron auth (critical rendering path)
   - Lazy loading nieistotnych zasobów

6. **Monitoring:**
   - Logowanie błędów autentykacji
   - Monitorowanie współczynnika sukcesu logowań
   - Alerty dla podejrzanej aktywności

### 7.4. Ryzyka i ich mitygacja

| Ryzyko                                        | Prawdopodobieństwo | Wpływ  | Mitygacja                                                |
| --------------------------------------------- | ------------------ | ------ | -------------------------------------------------------- |
| Problemy z integracją Supabase Auth w SSR     | Średnie            | Wysoki | Użycie biblioteki @supabase/ssr, dokładne testy          |
| Problemy z synchronizacją sesji client-server | Średnie            | Średni | Implementacja mechanizmu synchronizacji przez middleware |
| Ataki brute-force na logowanie                | Wysokie            | Średni | Rate limiting, CAPTCHA po kilku nieudanych próbach       |
| Problemy z dostarczalnością e-maili           | Niskie             | Średni | Konfiguracja SPF/DKIM, użycie renomowanego dostawcy SMTP |
| Użytkownicy nie potwierdzają e-maili          | Średnie            | Średni | Jasne komunikaty, możliwość ponownego wysłania linku     |
| Wyciek tokenów sesji                          | Niskie             | Wysoki | HTTP-only cookies, HTTPS, security headers               |

---

## 8. PODSUMOWANIE

Specyfikacja techniczna modułu autentykacji dla aplikacji MIMO obejmuje kompletne rozwiązanie umożliwiające:

1. **Rejestrację użytkowników** z weryfikacją e-mail (tylko e-mail/hasło, bez OAuth)
2. **Logowanie** za pomocą e-maila i hasła
3. **Odzyskiwanie hasła** przez e-mail
4. **Bezpieczne zarządzanie sesją** z wykorzystaniem JWT i HTTP-only cookies
5. **Ochronę danych** przez Row Level Security w Supabase
6. **Przyciski logowania/wylogowania** w prawym górnym rogu interfejsu
7. **Wymuszenie autentykacji** - brak dostępu do funkcji aplikacji bez zalogowania

Moduł integruje się bezproblemowo z istniejącą architekturą aplikacji opartą na Astro 5, React 19 i Supabase. Wszystkie istniejące funkcjonalności (check-in, zadania, wizualizacja postępów) pozostają nienaruszone i są chronione przez mechanizmy autentykacji.

**Czas implementacji:** 10-16 dni roboczych

**Technologie:**

- Supabase Auth (JWT)
- Astro 5 (SSR)
- React 19 (komponenty interaktywne)
- Zod (walidacja)
- TypeScript 5

**Bezpieczeństwo:**

- HTTPS
- HTTP-only cookies
- JWT tokens
- Row Level Security
- Input validation
- Rate limiting (rekomendowane)

**Zgodność z wymaganiami:** ✅ Pełna zgodność z US-004 z PRD

---

## 9. ZAŁĄCZNIKI

### 9.1. Struktura plików do utworzenia

```
src/
├── pages/
│   ├── login.astro                    # Nowa strona
│   ├── register.astro                 # Nowa strona
│   ├── forgot-password.astro          # Nowa strona
│   ├── reset-password.astro           # Nowa strona
│   ├── index.astro                    # Modyfikacja
│   ├── checkin.astro                  # Modyfikacja
│   ├── task.astro                     # Modyfikacja
│   └── api/
│       └── auth/                      # Opcjonalnie
│           ├── register.ts
│           ├── login.ts
│           └── logout.ts
├── components/
│   ├── LoginForm.tsx                  # Nowy komponent
│   ├── RegisterForm.tsx               # Nowy komponent
│   ├── ForgotPasswordForm.tsx         # Nowy komponent
│   └── ResetPasswordForm.tsx          # Nowy komponent
├── contexts/
│   └── AuthContext.tsx                # Opcjonalnie
├── lib/
│   ├── auth-helpers.ts                # Funkcje pomocnicze
│   ├── error-mapping.ts               # Mapowanie błędów
│   └── validation/
│       └── auth-schemas.ts            # Schematy walidacji
├── layouts/
│   └── Layout.astro                   # Modyfikacja (przyciski login/logout)
├── middleware/
│   └── index.ts                       # Modyfikacja
└── db/
    └── supabase.client.ts             # Modyfikacja (opcjonalnie)

supabase/
└── migrations/
    └── 20251220000000_update_rls_policies.sql  # Nowa migracja
```

### 9.2. Zmienne środowiskowe

```
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
```

### 9.3. Zależności npm do dodania

```json
{
  "dependencies": {
    "@supabase/ssr": "^0.0.10"
  }
}
```

### 9.4. Checklist implementacji

- [ ] Konfiguracja Supabase Auth w dashboardzie (wyłączenie logowania anonimowego i OAuth)
- [ ] Dostosowanie szablonów e-mail do języka polskiego
- [ ] Utworzenie migracji aktualizującej polityki RLS (usunięcie polityk dla roli `anon`)
- [ ] Utworzenie stron Astro: login, register, forgot-password, reset-password
- [ ] Utworzenie komponentów React: LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm
- [ ] Utworzenie schematów walidacji Zod
- [ ] Implementacja funkcji pomocniczych auth
- [ ] Modyfikacja middleware dla zarządzania sesją
- [ ] Modyfikacja Layout.astro: dodanie przycisków logowania/wylogowania w prawym górnym rogu (WYMAGANE)
- [ ] Modyfikacja istniejących stron (index, checkin, task) o sprawdzanie autentykacji
- [ ] Opcjonalnie: utworzenie wrapper endpoints dla auth
- [ ] Opcjonalnie: utworzenie AuthContext
- [ ] Testy manualne wszystkich przepływów
- [ ] Testy automatyczne (E2E)
- [ ] Weryfikacja że wszystkie funkcje wymagają logowania (zgodnie z US-004)
- [ ] Optymalizacja wydajności
- [ ] Dokumentacja
- [ ] Deploy na produkcję
- [ ] Monitorowanie i poprawki

---

**Koniec specyfikacji technicznej**

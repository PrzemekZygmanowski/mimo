# Konfiguracja zmiennych środowiskowych

## Wymagane kroki przed uruchomieniem projektu

### 1. Utwórz plik `.env` w głównym katalogu projektu

```bash
# W głównym katalogu projektu (gdzie jest package.json)
touch .env  # lub utwórz ręcznie plik .env
```

### 2. Dodaj następujące zmienne środowiskowe:

```env
# Supabase Configuration (Server-side)
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-anon-key

# Supabase Configuration (Client-side - required for React components)
# These MUST have the PUBLIC_ prefix to be accessible in browser
PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
PUBLIC_SUPABASE_KEY=twoj-anon-key

# OpenRouter API Key (for AI features)
OPENROUTER_API_KEY=twoj-openrouter-api-key
```

### 3. Jak uzyskać klucze Supabase?

1. Zaloguj się do [Supabase Dashboard](https://app.supabase.com/)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → użyj dla `SUPABASE_URL` i `PUBLIC_SUPABASE_URL` (ta sama wartość)
   - **anon public** key → użyj dla `SUPABASE_KEY` i `PUBLIC_SUPABASE_KEY` (ta sama wartość)

**Ważne:** Zmienne z prefiksem `PUBLIC_` są dostępne po stronie klienta (w przeglądarce), dlatego używaj tylko **anon public** key, nigdy service_role key!

### 4. Uruchom projekt

```bash
npm run dev
```

## Uwagi

- Plik `.env` jest dodany do `.gitignore` i nie będzie commitowany
- Bez konfiguracji `.env` projekt nie uruchomi się i wyświetli błąd o brakujących zmiennych
- W trybie development middleware działa w trybie permisywnym - strony publiczne (auth) działają bez sesji

# Plan implementacji widoku Garden

## 1. Przegląd

Widok „Garden” (ścieżka `/garden`) wizualizuje nagrody użytkownika w formie rosnącego ogródka na siatce 5×6. Pokazuje obecny stan planszy SVG oraz czas ostatniej aktualizacji, wspierając dostępność i responsywność.

## 2. Routing widoku

- Ścieżka: `/garden`
- Komponent strony: `GardenPage.astro` (Astro + React)

## 3. Struktura komponentów

```
GardenPage
├─ LastUpdated (wyświetla timestamp)
├─ GardenGridContainer
│  ├─ SkeletonGrid (podczas ładowania)
│  └─ GardenGrid
│     └─ GridCell x30 (role=gridcell)
└─ ErrorBoundary
```

## 4. Szczegóły komponentów

### GardenPage

- Opis: Komponent kontenera strony Astro ładuje dane oraz renderuje stan lub błędy.
- Główne elementy: `<Layout>`, React component `GardenView`
- Zdarzenia: fetch danych on mount
- Walidacja: brak, obsługa błędów API
- Typy: `PlantsProgressResponseDTO`, `BoardStateVM`
- Propsy: brak

### LastUpdated

- Opis: Wyświetla `last_updated_at` sformatowany przez date-fns/TZ
- Elementy: `<time>` z `aria-label`
- Zdarzenia: brak
- Walidacja: sprawdź czy data istnieje
- Typy: `string`
- Propsy: `lastUpdated: string`

### GardenGridContainer

- Opis: Wybiera między skeletonem a siatką
- Elementy: wrapper div z role=grid
- Zdarzenia: brak
- Walidacja: sprawdzenie `isLoading`
- Typy: `boolean`, `BoardStateVM`
- Propsy: `isLoading: boolean`, `boardState: BoardStateVM`

### SkeletonGrid

- Opis: Placeholder grid przy ładowaniu
- Elementy: 5×6 prostokąty z Tailwind shimmer
- Zdarzenia: brak
- Walidacja: brak
- Typy: brak
- Propsy: brak

### GardenGrid

- Opis: Rysuje siatkę z komórek
- Elementy: `<div role="grid" aria-label="Garden grid">` + GridCell
- Zdarzenia: brak
- Walidacja: `boardState.length===6 && each row.length===5`
- Typy: `BoardStateVM`
- Propsy: `boardState`

### GridCell

- Opis: Rysuje SVG w zależności od statusu komórki (puste, sadzonka, roślina)
- Elementy: `<div role="gridcell" tabindex="0">` z `<svg>`
- Zdarzenia: focus, keyboard navigation
- Walidacja: wartości statusu z `PlantCellState`
- Typy: `PlantCellState`
- Propsy: `cell: PlantCellState`

### ErrorBoundary

- Opis: Wyświetla komunikat błędu
- Elementy: `<div role="alert">`
- Zdarzenia: retry button click
- Walidacja: brak
- Typy: `string`
- Propsy: `message`, `onRetry`

## 5. Typy

```ts
// ViewModel
type BoardStateVM = PlantCellState[][]; // 6 rows × 5 cols
interface PlantCellState {
  status: "empty" | "seed" | "sprout" | "grown";
  metadata?: any;
}
// DTO z API
interface PlantsProgressResponseDTO {
  user_id: string;
  board_state: Json;
  last_updated_at: string;
}
```

## 6. Zarządzanie stanem

- Hook `usePlantsProgress`:
  - `data`, `isLoading`, `error`, `refetch`
  - Fetch GET `/api/plants-progress`
- Hook `useUpdatePlantsProgress`:
  - mutation PATCH `/api/plants-progress`

## 7. Integracja API

- GET `/api/plants-progress` → `usePlantsProgress` zwraca `PlantsProgressResponseDTO`
- PATCH `/api/plants-progress` → `useUpdatePlantsProgress(boardState: Json)`
- Obsługa zwracanych kodów: 200, 401 (redirect), 404 (inicjalizacja), 500 (alert)

## 8. Interakcje użytkownika

- Brak edycji bezpośredniej: widok wyłącznie odczyt
- Po ukończeniu zadania (poza widokiem) dane mogą się zaktualizować i wywołać `refetch`
- Retry w przypadku błędu → `refetch`

## 9. Warunki i walidacja

- Sprawdzenie kształtu `board_state` przed renderem
- `boardState.length === 6 && boardState[i].length === 5`
- `last_updated_at` valid ISO string

## 10. Obsługa błędów

- Wyświetlić `ErrorBoundary` z przyciskiem Retry dla error.code 500, 401 redirect do logowania
- Dla 404: pokazać pustą siatkę (status empty)

## 11. Kroki implementacji

1. Stworzyć typy ViewModel w `src/types.ts`
2. Napisać hook `usePlantsProgress` i `useUpdatePlantsProgress` w `src/lib/hooks`
3. Stworzyć komponenty `LastUpdated`, `SkeletonGrid`, `GridCell`, `GardenGrid`, `ErrorBoundary`
4. Utworzyć stronę `src/pages/garden.astro` z importem `GardenView`
5. Dodać style Tailwind do siatki i komórek
6. Dodać testy jednostkowe snapshot dla SVG i skeletonu
7. Przeprowadzić testy integracyjne ładowania danych i błędów

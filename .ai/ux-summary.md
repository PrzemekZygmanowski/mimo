# UX Architecture Planning Summary

<conversation_summary>
<decisions>

1. Zdefiniowano dwa layouty: publiczny (logowanie/rejestracja) oraz chroniony (z zakładkami: Check-in, Moje Zadanie, Ogród Postępów).
2. Po wykonaniu check-inu aplikacja automatycznie nawigować będzie do ekranu „Moje Zadanie” z przekazanym `generated_task`.
3. Interfejs wyboru nastroju i energii oparty na rzędach przycisków z ikonami (mobile) oraz ikonami i opisami (desktop) przy użyciu Shadcn/ui i Tailwind.
4. Akcje zadania (wykonaj, pomiń, nowe) realizowane przez przyciski CTA, modal potwierdzenia, blokady limitu oraz aktualizację przez _PATCH /api/user-tasks/:id_.
5. Widok „Ogród Postępów” jako komponent siatki 5×6 z ikonami SVG, fetchną i aktualizacją stanu z _GET/PATCH /api/plants-progress_.
6. Zarządzanie stanem: SWR do fetchowania, React Context dla sesji/autoryzacji, ewentualnie Zustand w przyszłości.
7. Strategia buforowania: optimistic updates, stale-while-revalidate w SWR, spinnery i skeletony podczas fetchowania.
8. Responsywność: Tailwind z breakpointami md/lg, układ kolumnowy na desktopie, stackowany na mobile (md+ jako mobile).
9. Centralna obsługa błędów w warstwie fetch, toast’y Shadcn/ui oraz przekierowanie na logowanie przy 401.
10. Dostępność: ARIA-labels, role grid/gridcell, nawigacja klawiaturą oraz kontrast zgodny z WCAG 2.1.
11. Dedykowane UI flows dla logowania e-mail vs anonimowego, realizowane za pomocą tabów.
12. Silent refresh tokenów w tle i modal logowania przy wygaśnięciu sesji.
13. Testy e2e z Playwright dla kluczowych przepływów (check-in → zadanie → ogród).
14. UI „Ustawienia” jako sidebar/modal z endpointami _GET/PUT /api/users/:id_.
15. Animacje pojawiania rośliny: Tailwind Transitions z ustalonymi timingami.
16. Design system: design tokens w Tailwind theme.extend, BEM/utility-first.
    </decisions>

<matched_recommendations>

1. Użycie dwóch layoutów z zakładkami w layoutzie chronionym.
2. Automatyczna nawigacja po check-inie do ekranu zadania.
3. Komponenty wyboru nastroju/energii z ikonami i opisami przy użyciu Shadcn/ui + Tailwind.
4. Przyciski CTA, modale i blokady limitów w widoku zadania.
5. Komponent siatki 5×6 dla „Ogrodu Postępów” z fetchem i aktualizacją stanu.
6. SWR + React Context dla zarządzania danymi i autoryzacją.
7. Optimistic updates i stale-while-revalidate oraz skeletony/spinnery.
8. Responsywne breakpointy Tailwind dla mobile i desktop.
9. Centralna warstwa obsługi błędów i toast’y.
10. ARIA i klawiaturowa nawigacja zgodna z WCAG 2.1.
11. Taby dla trybów logowania (e-mail vs anonimowe).
12. Silent refresh tokena i obsługa 401.
13. Playwright dla e2e testów.
14. Sidebar/modal „Ustawienia” z GET/PUT /api/users/:id.
15. Tailwind Transitions dla animacji.
16. Design tokens w Tailwind theme.extend.
    </matched_recommendations>

<ui_architecture_planning_summary>
Podsumowanie architektury UI dla MVP obejmuje dwuwarstwowy layout (publiczny i chroniony) z logicą routingu między ekranami: logowanie, check-in, zadanie dnia, ogród postępów, ustawienia. Dane komunikowane są z backendem przez API (REST: checkins, user-tasks, plants-progress, users) za pomocą SWR i React Context (token JWT). UI korzysta z Shadcn/ui i Tailwind do implementacji przyjaznych komponentów (suwaki/przyciski), responsywnego układu (breakpointy md/lg), a11y (ARIA, role, klawiatura) oraz spójnego design systemu (design tokens, Tailwind theme.extend). Strategia zarządzania stanem uwzględnia optimistic updates i stale-while-revalidate, centralną obsługę błędów z toastami oraz silent refresh tokena. Kluczowe przepływy (check-in → zadanie → ogród) będą pokryte testami e2e z Playwright.
</ui_architecture_planning_summary>

<unresolved_issues>

- Onboarding pierwszego check-inu (wymagane dalsze szczegóły lub instrukcje).
- Tryb offline i buforowanie żądań (obszar deferred).
- Ekran historii check-inów i zadań (zdefiniować w kolejnej iteracji).
- Lokalizacja i wielojęzyczność (deferred).
  </unresolved_issues>
  </conversation_summary>

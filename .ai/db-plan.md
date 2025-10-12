<conversation_summary>
<decisions>

1. Rozdzielenie tabeli tasks na dwie encje: task_templates oraz user_tasks. W tabeli user_tasks dodano kolumny: expires_at (timestamp) oraz new_task_requests (smallint, domyślnie 0) z ograniczeniem new_task_requests <= 3, umożliwiające kontrolę aktywności zadania (ważnych 24h) oraz limit ponownych próśb o nowe zadanie.
2. Utworzenie osobnej tabeli check_ins z kolumnami: user_id, mood_level, energy_level, at (timestamp) oraz opcjonalnie notes.
3. Wydzielenie historii zdarzeń do tabeli user_events (lub task_activity_logs) z kolumnami: id, user_id, event_type, entity_id (opcjonalnie), occurred_at oraz payload jsonb.
4. Użycie typu smallint dla mood_level z CHECK constraint (wartości 1–5) oraz energy_level z CHECK constraint (wartości 1–3).
5. Wdrożenie ograniczeń: unikalność adresu e-mail w users, unikatowy klucz (user_id, task_date) w user_tasks oraz definicje kluczy obcych dla user_id, template_id i check_in_id.
6. Stworzenie odpowiednich indeksów dla tabel: check_ins, user_tasks, user_events oraz task_templates.
7. Zaplanowanie możliwości przyszłego partycjonowania tabel (check_ins, user_events) bez wdrażania na etapie MVP.
8. Włączenie RLS dla tabel users, check_ins, user_tasks, user_events (oraz ewentualnie user_plants_progress) z polityką ograniczającą dostęp do danych użytkownika.
9. Dodanie elastycznych pól metadata (jsonb) w tabelach user_tasks i/lub check_ins oraz zdefiniowanie schematu tabeli user_plants_progress przechowującej stan planszy nagród (5x6), aby umożliwić przyszłe rozszerzenia.
   </decisions>

<matched_recommendations>

1. Osobna encja check_ins umożliwiająca historię oraz analizy.
2. Rozdzielenie danych dotyczących zadań na katalog szablonów (task_templates) i instancje przydzielonych użytkownikom (user_tasks).
3. Wydzielenie historii zdarzeń do osobnej tabeli (user_events) umożliwiającej lepszą analizę zachowań.
4. Zastosowanie małych zakresowych typów danych (smallint) dla wartości nastroju i energii z odpowiednimi CHECK constraint.
5. Implementacja kluczowych ograniczeń, indeksów i kluczy obcych dla zapewnienia integralności danych.
6. Konfiguracja RLS, aby każdy użytkownik miał dostęp tylko do własnych danych.
7. Planowanie możliwości przyszłego partycjonowania przy zachowaniu elastyczności schematu.
8. Pozostawienie pola metadata JSONB na potrzeby przyszłych rozszerzeń.
   </matched_recommendations>

<database_planning_summary>
Główne wymagania dotyczące schematu bazy danych obejmują:

- Rejestrację codziennych check-inów użytkowników (z mood_level, energy_level, timestamp, opcjonalnie notes).
- Przydzielanie i śledzenie mikro zadań poprzez rozdzielenie ich na szablony (task_templates) oraz instancje użytkowników (user_tasks) z odniesieniami do check_ins. Tabela user_tasks została rozszerzona o kolumny expires_at, określającą moment wygaśnięcia zadania (24h od przydzielenia) oraz new_task_requests, umożliwiającą śledzenie liczby ponownych próśb o nowe zadanie (limit 3 dziennie).
- Rejestrowanie działań użytkowników w osobnej tabeli (user_events) z typem zdarzenia oraz dodatkowymi danymi w formacie JSONB dla analityki.
- Nowa tabela user_plants_progress do obsługi systemu nagradzania, zawierająca kolumny: user_id, board_state (jsonb) reprezentujące planszę o wymiarach 5x6, oraz last_updated_at.

Kluczowe encje i relacje:

- Tabela users (użytkownicy) – posiada unikalny e-mail (dla nieanonimowych kont).
- Tabela check_ins – zawiera odniesienie do użytkownika.
- Tabela task_templates – katalog szablonów mikro czynów z opcjonalnymi ograniczeniami dotyczącymi mood_level i energy_level.
- Tabela user_tasks – instancje zadań z relacjami do użytkownika, szablonu oraz (opcjonalnie) check_in, przy czym unikalny klucz (user_id, task_date) gwarantuje jedno zadanie dziennie.
- Tabela user_events – historia zdarzeń (CHECKIN_CREATED, TASK_ASSIGNED, TASK_DONE, TASK_SKIPPED, etc.), co upraszcza audyt i analitykę.

Ważne kwestie bezpieczeństwa i skalowalności:

- Wdrożenie RLS dla tabel użytkowników (users), check_ins, user_tasks, user_events (i ewentualnie user_plants_progress) zapewnia, że każdy użytkownik ma dostęp tylko do własnych danych.
- Ograniczenia i klucze obce zapewniają integralność danych.
- Przewidziane indeksowanie (np. indeksy na user_id, datach) zwiększa wydajność zapytań.
- Możliwość przyszłego partycjonowania tabel (np. według miesięcy lub lat) zapewni skalowalność przy rosnącej liczbie rekordów.
- Elastyczność schematu przez pola JSONB umożliwi łatwe rozszerzenia funkcjonalności, takie jak dodatkowe metryki czy parametry wizualizacji "ogródka".
  </database_planning_summary>

<unresolved_issues>

1. Dokładna struktura tabeli users poza unikalnym e-mailem.
   </unresolved_issues>
   </conversation_summary>

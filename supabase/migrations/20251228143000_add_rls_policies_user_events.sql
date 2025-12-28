-- migration: add rls policies for user_events table
-- date: 2025-12-28 14:30:00 utc
-- purpose: dodanie polityk row level security (rls) dla wszystkich operacji crud w tabeli user_events
-- dotyczy: tabeli user_events
-- uwagi:
--   - tabela user_events już ma włączony rls z poprzedniej migracji
--   - każda operacja (select, insert, update, delete) ma osobne polityki dla ról anon i authenticated
--   - polityki zapewniają, że użytkownicy mają dostęp tylko do własnych eventów
--   - używamy auth.uid() do identyfikacji zalogowanego użytkownika
--   - user_events to tabela do logowania zdarzeń użytkownika (event log)

-- polityka select dla roli anon
-- umożliwia anonimowym użytkownikom odczyt własnych eventów
create policy user_events_select_anon on user_events
  for select
  to anon
  using (user_id = auth.uid());

-- polityka select dla roli authenticated
-- umożliwia zalogowanym użytkownikom odczyt tylko własnych eventów
create policy user_events_select_authenticated on user_events
  for select
  to authenticated
  using (user_id = auth.uid());

-- polityka insert dla roli anon
-- umożliwia anonimowym użytkownikom tworzenie eventów z własnym user_id
create policy user_events_insert_anon on user_events
  for insert
  to anon
  with check (user_id = auth.uid());

-- polityka insert dla roli authenticated
-- umożliwia zalogowanym użytkownikom tworzenie eventów z własnym user_id
create policy user_events_insert_authenticated on user_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- polityka update dla roli anon
-- umożliwia anonimowym użytkownikom aktualizację tylko własnych eventów
-- using - sprawdza czy użytkownik jest właścicielem rekordu przed aktualizacją
-- with check - zapewnia, że user_id nie zostanie zmienione na inne
create policy user_events_update_anon on user_events
  for update
  to anon
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka update dla roli authenticated
-- umożliwia zalogowanym użytkownikom aktualizację tylko własnych eventów
create policy user_events_update_authenticated on user_events
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka delete dla roli anon
-- umożliwia anonimowym użytkownikom usuwanie tylko własnych eventów
create policy user_events_delete_anon on user_events
  for delete
  to anon
  using (user_id = auth.uid());

-- polityka delete dla roli authenticated
-- umożliwia zalogowanym użytkownikom usuwanie tylko własnych eventów
create policy user_events_delete_authenticated on user_events
  for delete
  to authenticated
  using (user_id = auth.uid());

-- koniec migracji

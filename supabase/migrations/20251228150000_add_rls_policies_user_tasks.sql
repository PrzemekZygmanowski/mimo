-- migration: add rls policies for user_tasks table
-- date: 2025-12-28 15:00:00 utc
-- purpose: dodanie polityk row level security (rls) dla wszystkich operacji crud w tabeli user_tasks
-- dotyczy: tabeli user_tasks
-- uwagi:
--   - tabela user_tasks już ma włączony rls z poprzedniej migracji
--   - każda operacja (select, insert, update, delete) ma osobne polityki dla ról anon i authenticated
--   - polityki zapewniają, że użytkownicy mają dostęp tylko do własnych zadań
--   - używamy auth.uid() do identyfikacji zalogowanego użytkownika
--   - user_tasks przechowuje zadania przypisane do użytkowników

-- polityka select dla roli anon
-- umożliwia anonimowym użytkownikom odczyt własnych zadań
create policy user_tasks_select_anon on user_tasks
  for select
  to anon
  using (user_id = auth.uid());

-- polityka select dla roli authenticated
-- umożliwia zalogowanym użytkownikom odczyt tylko własnych zadań
create policy user_tasks_select_authenticated on user_tasks
  for select
  to authenticated
  using (user_id = auth.uid());

-- polityka insert dla roli anon
-- umożliwia anonimowym użytkownikom tworzenie zadań z własnym user_id
create policy user_tasks_insert_anon on user_tasks
  for insert
  to anon
  with check (user_id = auth.uid());

-- polityka insert dla roli authenticated
-- umożliwia zalogowanym użytkownikom tworzenie zadań z własnym user_id
create policy user_tasks_insert_authenticated on user_tasks
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- polityka update dla roli anon
-- umożliwia anonimowym użytkownikom aktualizację tylko własnych zadań
-- using - sprawdza czy użytkownik jest właścicielem rekordu przed aktualizacją
-- with check - zapewnia, że user_id nie zostanie zmienione na inne
create policy user_tasks_update_anon on user_tasks
  for update
  to anon
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka update dla roli authenticated
-- umożliwia zalogowanym użytkownikom aktualizację tylko własnych zadań
create policy user_tasks_update_authenticated on user_tasks
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka delete dla roli anon
-- umożliwia anonimowym użytkownikom usuwanie tylko własnych zadań
create policy user_tasks_delete_anon on user_tasks
  for delete
  to anon
  using (user_id = auth.uid());

-- polityka delete dla roli authenticated
-- umożliwia zalogowanym użytkownikom usuwanie tylko własnych zadań
create policy user_tasks_delete_authenticated on user_tasks
  for delete
  to authenticated
  using (user_id = auth.uid());

-- koniec migracji

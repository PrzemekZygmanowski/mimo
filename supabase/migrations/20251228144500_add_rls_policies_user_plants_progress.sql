-- migration: add rls policies for user_plants_progress table
-- date: 2025-12-28 14:45:00 utc
-- purpose: dodanie polityk row level security (rls) dla wszystkich operacji crud w tabeli user_plants_progress
-- dotyczy: tabeli user_plants_progress
-- uwagi:
--   - tabela user_plants_progress już ma włączony rls z poprzedniej migracji
--   - każda operacja (select, insert, update, delete) ma osobne polityki dla ról anon i authenticated
--   - polityki zapewniają, że użytkownicy mają dostęp tylko do własnego postępu roślin
--   - używamy auth.uid() do identyfikacji zalogowanego użytkownika
--   - user_id jest primary key w tej tabeli

-- polityka select dla roli anon
-- umożliwia anonimowym użytkownikom odczyt własnego postępu roślin
create policy user_plants_progress_select_anon on user_plants_progress
  for select
  to anon
  using (user_id = auth.uid());

-- polityka select dla roli authenticated
-- umożliwia zalogowanym użytkownikom odczyt tylko własnego postępu roślin
create policy user_plants_progress_select_authenticated on user_plants_progress
  for select
  to authenticated
  using (user_id = auth.uid());

-- polityka insert dla roli anon
-- umożliwia anonimowym użytkownikom tworzenie postępu roślin z własnym user_id
-- uwaga: user_id jest primary key, więc każdy użytkownik może mieć tylko jeden rekord
create policy user_plants_progress_insert_anon on user_plants_progress
  for insert
  to anon
  with check (user_id = auth.uid());

-- polityka insert dla roli authenticated
-- umożliwia zalogowanym użytkownikom tworzenie postępu roślin z własnym user_id
create policy user_plants_progress_insert_authenticated on user_plants_progress
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- polityka update dla roli anon
-- umożliwia anonimowym użytkownikom aktualizację tylko własnego postępu roślin
-- using - sprawdza czy użytkownik jest właścicielem rekordu przed aktualizacją
-- with check - zapewnia, że user_id nie zostanie zmienione na inne
create policy user_plants_progress_update_anon on user_plants_progress
  for update
  to anon
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka update dla roli authenticated
-- umożliwia zalogowanym użytkownikom aktualizację tylko własnego postępu roślin
create policy user_plants_progress_update_authenticated on user_plants_progress
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka delete dla roli anon
-- umożliwia anonimowym użytkownikom usuwanie tylko własnego postępu roślin
create policy user_plants_progress_delete_anon on user_plants_progress
  for delete
  to anon
  using (user_id = auth.uid());

-- polityka delete dla roli authenticated
-- umożliwia zalogowanym użytkownikom usuwanie tylko własnego postępu roślin
create policy user_plants_progress_delete_authenticated on user_plants_progress
  for delete
  to authenticated
  using (user_id = auth.uid());

-- koniec migracji

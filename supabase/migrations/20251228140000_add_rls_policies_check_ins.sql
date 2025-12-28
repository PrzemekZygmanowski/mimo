-- migration: add rls policies for check_ins table
-- date: 2025-12-28 14:00:00 utc
-- purpose: dodanie polityk row level security (rls) dla wszystkich operacji crud w tabeli check_ins
-- dotyczy: tabeli check_ins
-- uwagi:
--   - tabela check_ins już ma włączony rls z poprzedniej migracji
--   - każda operacja (select, insert, update, delete) ma osobne polityki dla ról anon i authenticated
--   - polityki zapewniają, że użytkownicy mają dostęp tylko do własnych rekordów check-ins
--   - używamy auth.uid() do identyfikacji zalogowanego użytkownika

-- polityka select dla roli anon
-- umożliwia anonimowym użytkownikom (niezalogowanym) odczyt własnych check-ins
-- w praktyce może być nieużywana jeśli aplikacja wymaga logowania
create policy check_ins_select_anon on check_ins
  for select
  to anon
  using (user_id = auth.uid());

-- polityka select dla roli authenticated
-- umożliwia zalogowanym użytkownikom odczyt tylko własnych check-ins
create policy check_ins_select_authenticated on check_ins
  for select
  to authenticated
  using (user_id = auth.uid());

-- polityka insert dla roli anon
-- umożliwia anonimowym użytkownikom tworzenie check-ins z własnym user_id
create policy check_ins_insert_anon on check_ins
  for insert
  to anon
  with check (user_id = auth.uid());

-- polityka insert dla roli authenticated
-- umożliwia zalogowanym użytkownikom tworzenie check-ins z własnym user_id
create policy check_ins_insert_authenticated on check_ins
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- polityka update dla roli anon
-- umożliwia anonimowym użytkownikom aktualizację tylko własnych check-ins
-- using - sprawdza czy użytkownik jest właścicielem rekordu przed aktualizacją
-- with check - zapewnia, że user_id nie zostanie zmienione na inne
create policy check_ins_update_anon on check_ins
  for update
  to anon
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka update dla roli authenticated
-- umożliwia zalogowanym użytkownikom aktualizację tylko własnych check-ins
create policy check_ins_update_authenticated on check_ins
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- polityka delete dla roli anon
-- umożliwia anonimowym użytkownikom usuwanie tylko własnych check-ins
create policy check_ins_delete_anon on check_ins
  for delete
  to anon
  using (user_id = auth.uid());

-- polityka delete dla roli authenticated
-- umożliwia zalogowanym użytkownikom usuwanie tylko własnych check-ins
create policy check_ins_delete_authenticated on check_ins
  for delete
  to authenticated
  using (user_id = auth.uid());

-- koniec migracji

-- migration: add rls policies for task_templates table
-- date: 2025-12-28 14:15:00 utc
-- purpose: dodanie polityk row level security (rls) dla wszystkich operacji crud w tabeli task_templates
-- dotyczy: tabeli task_templates
-- uwagi:
--   - tabela task_templates już ma włączony rls z poprzedniej migracji
--   - task_templates to publiczne szablony zadań dostępne dla wszystkich użytkowników
--   - polityki select umożliwiają odczyt wszystkich szablonów
--   - polityki insert, update, delete są otwarte (true) - w przyszłości można ograniczyć do administratorów
--   - każda operacja (select, insert, update, delete) ma osobne polityki dla ról anon i authenticated

-- polityka select dla roli anon
-- umożliwia anonimowym użytkownikom odczyt wszystkich szablonów zadań
create policy task_templates_select_anon on task_templates
  for select
  to anon
  using (true);

-- polityka select dla roli authenticated
-- umożliwia zalogowanym użytkownikom odczyt wszystkich szablonów zadań
create policy task_templates_select_authenticated on task_templates
  for select
  to authenticated
  using (true);

-- polityka insert dla roli anon
-- umożliwia anonimowym użytkownikom tworzenie nowych szablonów zadań
-- uwaga: w produkcji można ograniczyć to do roli admin
create policy task_templates_insert_anon on task_templates
  for insert
  to anon
  with check (true);

-- polityka insert dla roli authenticated
-- umożliwia zalogowanym użytkownikom tworzenie nowych szablonów zadań
-- uwaga: w produkcji można ograniczyć to do roli admin
create policy task_templates_insert_authenticated on task_templates
  for insert
  to authenticated
  with check (true);

-- polityka update dla roli anon
-- umożliwia anonimowym użytkownikom aktualizację szablonów zadań
-- uwaga: w produkcji można ograniczyć to do roli admin
create policy task_templates_update_anon on task_templates
  for update
  to anon
  using (true)
  with check (true);

-- polityka update dla roli authenticated
-- umożliwia zalogowanym użytkownikom aktualizację szablonów zadań
-- uwaga: w produkcji można ograniczyć to do roli admin
create policy task_templates_update_authenticated on task_templates
  for update
  to authenticated
  using (true)
  with check (true);

-- polityka delete dla roli anon
-- umożliwia anonimowym użytkownikom usuwanie szablonów zadań
-- uwaga: w produkcji można ograniczyć to do roli admin
create policy task_templates_delete_anon on task_templates
  for delete
  to anon
  using (true);

-- polityka delete dla roli authenticated
-- umożliwia zalogowanym użytkownikom usuwanie szablonów zadań
-- uwaga: w produkcji można ograniczyć to do roli admin
create policy task_templates_delete_authenticated on task_templates
  for delete
  to authenticated
  using (true);

-- koniec migracji

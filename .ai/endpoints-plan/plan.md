# Ścieżka REST API po ukończeniu zadania

Poniżej znajduje się kolejność wywołań endpointów zgodnie z PRD i API-plan:

1. **Rejestracja / logowanie użytkownika**
   - Endpoint: `POST /api/users`
   - Opis: tworzy nowe konto (anonimowe lub e-mailowe) i zwraca JWT

2. **(Opcjonalnie) Pobranie bieżącego stanu zadań i ogródka**
   - `GET /api/user-tasks`
   - `GET /api/plants-progress`

3. **Wykonanie check-inu nastroju i energii**
   - Endpoint: `POST /api/checkins`
   - Payload: `{ mood_level, energy_level, notes? }`
   - Zwraca: obiekt check-in oraz wygenerowane zadanie `generated_task`

4. **(Opcjonalnie) Odświeżenie listy zadań**
   - `GET /api/user-tasks`

5. **Zakończenie zadania**
   - Endpoint: `PATCH /api/user-tasks/:id`
   - Payload: `{ status: "completed" }`

6. **Logowanie zdarzenia zakończenia zadania**
   - Endpoint: `POST /api/user-events`
   - Payload: `{ event_type: "TASK_DONE", user_id, entity_id: "<user-task-id>", payload: {...} }`

7. **Aktualizacja stanu ogródka**
   - Endpoint: `PATCH /api/plants-progress`
   - Payload: `{ board_state: {/* nowa siatka 5×6 */} }`

8. **(Opcjonalnie) Pobranie zaktualizowanego stanu ogródka**
   - `GET /api/plants-progress`

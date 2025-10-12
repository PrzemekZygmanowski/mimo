# REST API Plan

## 1. Resources

- **Users**: Represents application users. Maps to the `users` table (with unique email constraint and additional fields as needed).
- **CheckIns**: Records daily check-ins. Maps to the `check_ins` table with fields: `user_id`, `mood_level` (smallint, 1–5 with CHECK), `energy_level` (smallint, 1–3 with CHECK), `at` (timestamp), and optional `notes`.
- **TaskTemplates**: Repository of micro-task templates. Maps to the `task_templates` table.
- **UserTasks**: Daily tasks assigned to users. Maps to the `user_tasks` table with fields such as reference to the user, associated task template, `expires_at` (timestamp, 24h validity), and `new_task_requests` (smallint with max 3 per day).
- **UserEvents**: Logs user activities/events. Maps to the `user_events` table with fields: `id`, `user_id`, `event_type`, `entity_id`, `occurred_at`, and `payload` (jsonb).
- **PlantsProgress**: Represents the reward system (garden board 5x6). Maps to the `user_plants_progress` table with fields: `user_id`, `board_state` (jsonb), and `last_updated_at`.

## 2. Endpoints

### Users

- **GET /api/users/:id**
  - Description: Retrieves user details.
  - Response: JSON with user information, for example:
    ```json
    {
      "id": "user-id",
      "email": "user@example.com",
      "created_at": "2025-10-12T12:00:00Z",
      "otherData": {}
    }
    ```
  - Success: 200 OK
  - Errors: 404 Not Found, 401 Unauthorized

- **POST /api/users**
  - Description: Registers a new user (supporting both anonymous and email-based registration).
  - Request JSON:
    ```json
    {
      "email": "user@example.com", // Optional for anonymous users
      "password": "securePassword",
      "otherData": {
        /* additional fields */
      }
    }
    ```
  - Response: JSON with user details and authentication token, for example:
    ```json
    {
      "id": "user-id",
      "email": "user@example.com",
      "token": "jwt-token"
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request

### CheckIns

- **POST /api/checkins**
  - Description: Creates a new check-in for the current user.
  - Request JSON:
    ```json
    {
      "mood_level": 3, // integer 1-5
      "energy_level": 2, // integer 1-3
      "notes": "Feeling okay"
    }
    ```
  - Response: JSON with the check-in record and linked generated task (if applicable), for example:
    ```json
    {
      "id": "checkin-id",
      "user_id": "user-id",
      "mood_level": 3,
      "energy_level": 2,
      "at": "2025-10-12T12:05:00Z",
      "notes": "Feeling okay",
      "generated_task": {
        "id": "usertask-id",
        "expires_at": "2025-10-13T12:05:00Z"
      }
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized

- **GET /api/checkins/:id**
  - Description: Retrieves a specific check-in record.
  - Response: JSON with check-in details, for example:
    ```json
    {
      "id": "checkin-id",
      "user_id": "user-id",
      "mood_level": 3,
      "energy_level": 2,
      "at": "2025-10-12T12:05:00Z",
      "notes": "Feeling okay"
    }
    ```
  - Success: 200 OK
  - Errors: 404 Not Found, 401 Unauthorized

### TaskTemplates

_(Typically for admin use)_

- **GET /api/task-templates**
  - Description: Retrieves a list of task templates (can be filtered by mood/energy criteria).
  - Query Parameters: `mood_level`, `energy_level` (optional filtering)
  - Response: JSON array of task templates, for example:
    ```json
    [
      {
        "id": "template-id",
        "name": "Gentle Walk",
        "constraints": {
          "mood_level": [1, 2, 3, 4, 5],
          "energy_level": [1, 2, 3]
        }
      }
    ]
    ```
  - Success: 200 OK

- **GET /api/task-templates/:id**
  - Description: Retrieves details of a specific task template.
  - Response: JSON with template details, for example:
    ```json
    {
      "id": "template-id",
      "name": "Gentle Walk",
      "description": "A gentle walk to boost mood.",
      "constraints": { "mood_level": [1, 2, 3, 4, 5], "energy_level": [1, 2, 3] }
    }
    ```
  - Success: 200 OK

- **POST /api/task-templates**
  - Description: Creates a new task template.
  - Request JSON: Template details including mood/energy constraints.
  - Response: JSON with created template details.
  - Success: 201 Created
  - Errors: 400 Bad Request

- **PUT/PATCH /api/task-templates/:id**
  - Description: Updates an existing task template.

- **DELETE /api/task-templates/:id**
  - Description: Deletes a task template.

### UserTasks

- **GET /api/user-tasks**
  - Description: Retrieves a list of tasks assigned to the authenticated user.
  - Query Parameters: Pagination (`page`, `limit`), filtering by status (e.g., pending, completed) and date.
  - Response: JSON array of user tasks, for example:
    ```json
    [
      {
        "id": "task-id",
        "user_id": "user-id",
        "template_id": "template-id",
        "expires_at": "2025-10-13T12:05:00Z",
        "status": "pending",
        "new_task_requests": 0
      }
    ]
    ```
  - Success: 200 OK

- **GET /api/user-tasks/:id**
  - Description: Retrieves details of a specific user task.
  - Response: JSON with task details, for example:
    ```json
    {
      "id": "task-id",
      "user_id": "user-id",
      "template_id": "template-id",
      "expires_at": "2025-10-13T12:05:00Z",
      "status": "pending",
      "new_task_requests": 0
    }
    ```
  - Success: 200 OK

- **POST /api/user-tasks**
  - Description: Assigns a new task to a user (triggered after check-in or on manual request).
  - Request JSON:
    ```json
    {
      "template_id": "template-id",
      "user_id": "user-id",
      "check_in_id": "checkin-id" // Optional, if generated from a check-in
    }
    ```
  - Response: JSON with task details, for example:
    ```json
    {
      "id": "task-id",
      "user_id": "user-id",
      "template_id": "template-id",
      "expires_at": "2025-10-13T12:05:00Z",
      "status": "pending",
      "new_task_requests": 0
    }
    ```
  - Success: 201 Created
  - Errors: 400 Bad Request, 401 Unauthorized

- **PATCH /api/user-tasks/:id**
  - Description: Updates a user task (e.g., marking as completed, skipped, or requesting a new task).
  - Request JSON (example for marking as completed):
    ```json
    {
      "status": "completed"
    }
    ```
  - Response: JSON with updated task details, for example:
    ```json
    {
      "id": "task-id",
      "status": "completed",
      "completed_at": "2025-10-12T15:00:00Z"
    }
    ```
  - Success: 200 OK
  - Errors: 400 Bad Request (if new task request limit exceeded), 401 Unauthorized

### UserEvents

- **POST /api/user-events**
  - Description: Logs an event for the user (e.g., TASK_DONE, TASK_SKIPPED, CHECKIN_CREATED).
  - Request JSON:
    ```json
    {
      "event_type": "TASK_DONE",
      "user_id": "user-id",
      "entity_id": "entity-id",
      "payload": { "details": "Task completed successfully." }
    }
    ```
  - Response: JSON with event details, for example:
    ```json
    {
      "id": "event-id",
      "user_id": "user-id",
      "event_type": "TASK_DONE",
      "occurred_at": "2025-10-12T15:05:00Z",
      "payload": { "details": "Task completed successfully." }
    }
    ```
  - Success: 201 Created

- **GET /api/user-events**
  - Description: Retrieves a log of events for the authenticated user.
  - Response: JSON array of events, for example:
    ```json
    [
      {
        "id": "event-id",
        "user_id": "user-id",
        "event_type": "TASK_DONE",
        "occurred_at": "2025-10-12T15:05:00Z",
        "payload": { "details": "Task completed successfully." }
      }
    ]
    ```
  - Success: 200 OK

### PlantsProgress

- **GET /api/plants-progress**
  - Description: Retrieves the current state of the user's garden board (reward system).
  - Response: JSON with plants progress details, for example:
    ```json
    {
      "user_id": "user-id",
      "board_state": {
        /* 5x6 grid state as JSON */
      },
      "last_updated_at": "2025-10-12T16:00:00Z"
    }
    ```
  - Success: 200 OK

- **PATCH /api/plants-progress**
  - Description: Updates the garden board state. For example, after task completion, the board may be updated.
  - Request JSON:
    ```json
    {
      "board_state": {
        /* updated 5x6 grid state as JSON */
      }
    }
    ```
  - Response: JSON with updated board state, for example:
    ```json
    {
      "user_id": "user-id",
      "board_state": {
        /* updated state */
      },
      "last_updated_at": "2025-10-12T16:05:00Z"
    }
    ```
  - Success: 200 OK
  - Errors: 400 Bad Request, 401 Unauthorized

## 3. Authentication and Authorization

- **Authentication Mechanism**: JWT-based authentication (leveraging Supabase or custom JWT implementation).
  - Endpoints require an `Authorization: Bearer <token>` header.
  - Both anonymous and email-based sessions are supported.

- **Authorization**: Implement Role-Level Security (RLS) in the database. On the API layer, ensure that endpoints validate the token and only allow access to resources corresponding to the authenticated user.

## 4. Validation and Business Logic

- **Validation Rules**:
  - **CheckIns**: Validate `mood_level` is within 1–5 and `energy_level` within 1–3 (as enforced by the DB schema).
  - **UserTasks**: Enforce one task per day per user via a unique key on `(user_id, task_date)`. When processing new task requests, ensure that `new_task_requests` does not exceed 3 per day.
  - **Users**: Validate unique email when provided.

- **Business Logic Implementation**:
  - **Check-In and Task Generation**: After a successful check-in, the system automatically assigns a task based on the user’s mood and energy (select appropriate template matching check-in data) and logs the event.
  - **Task Request Limit**: When a user requests a new task (via a PATCH to `/api/user-tasks/:id` or a dedicated endpoint), check the current `new_task_requests` count and reject if limit (3 per day) is exceeded.
  - **Task Expiry**: Each `user_task` has an `expires_at` timestamp (24 hours from assignment). The API should check the expiry against the current time and mark tasks as expired if necessary.
  - **Logging**: All critical operations (check-ins, task assignments, completions, skips) are logged in `user_events` for audit and analytics purposes.

- **Pagination, Filtering, and Sorting**:
  - List endpoints (e.g., GET `/api/user-tasks`, GET `/api/user-events`) will support pagination parameters (`page`, `limit`), and allow filtering by date ranges or status.

- **Rate Limiting and Security**:
  - Apply rate limiting to prevent abuse.
  - Use HTTPS, input sanitization, and proper error handling to ensure security and robustness.

---

_Assumptions_

- Some endpoints (especially for task templates) might be restricted to administrative roles.
- The authentication layer integrates with Supabase JWT tokens and leverages RLS for data protection.
- The API will be implemented using technologies from the stack (Astro, TypeScript, React for frontend consumption) along with Supabase as the backend database.

This REST API plan provides a comprehensive blueprint, mapping the product requirements and database schema directly to well-defined API endpoints with clear validation, business logic, and security measures.

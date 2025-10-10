# REST API Plan

This document outlines the design of the REST API for the application. The API is built to support daily check-ins, task assignment, and event logging based on the database schema, product requirements document (PRD), and the specified tech stack.

---

## 1. Resources

- **Users**: Represents the application users. In the database, the `users` table holds unique user data (e.g., unique email for non-anonymous accounts).
- **Check-Ins**: Captures daily mood and energy check-ins. Mapped to the `check_ins` table with fields such as `user_id`, `mood_level` (smallint, 1–5), `energy_level` (smallint, 1–3), `at` (timestamp), and optional `notes`.
- **Task Templates**: A catalogue of predefined tasks. Corresponds to the `task_templates` table and may have conditions (e.g., mood/energy thresholds).
- **User Tasks**: Represents tasks assigned to each user daily. This resource is based on the `user_tasks` table with a unique constraint on `(user_id, task_date)` ensuring one task per day. May reference both `task_templates` and an optional `check_in`.
- **User Events**: Logs activities such as check-in creation, task assignment, and task status changes (e.g., completed, skipped). Corresponds to the `user_events` table with event metadata in JSONB format.

---

## 2. Endpoints

Endpoints are grouped primarily around CRUD operations for the above resources alongside business-specific actions.

### 2.1 Users

- **Register User**
  - **Method:** POST
  - **URL:** `/api/users/register`
  - **Description:** Register a new user via email or opt for anonymous login.
  - **Request Payload:**
    ```json
    {
      "email": "user@example.com", // optional for anonymous
      "password": "securePassword!",
      "isAnonymous": false
    }
    ```
  - **Response:**
    ```json
    { "userId": "uuid", "message": "Registration successful" }
    ```
  - **Errors:** Duplicate email, invalid credentials

- **Login User**
  - **Method:** POST
  - **URL:** `/api/users/login`
  - **Description:** Authenticate an existing user.
  - **Request Payload:**
    ```json
    { "email": "user@example.com", "password": "securePassword!" }
    ```
  - **Response:**
    ```json
    {
      "userId": "uuid",
      "token": "jwt-token",
      "message": "Login successful"
    }
    ```
  - **Errors:** Invalid credentials

### 2.2 Check-Ins

- **Create Daily Check-In**
  - **Method:** POST
  - **URL:** `/api/check-ins`
  - **Description:** Submit a daily check-in with mood and energy levels. Generates the daily task as part of the response.
  - **Request Payload:**
    ```json
    {
      "userId": "uuid",
      "mood_level": 2, // must be between 1 and 5
      "energy_level": 3, // must be between 1 and 3
      "notes": "Optional additional notes"
    }
    ```
  - **Response:**
    ```json
    {
      "checkInId": "uuid",
      "assignedTask": {
        "taskId": "uuid",
        "taskDetails": "Do a 10 minute walk",
        "message": "Based on your energy, we suggest a light activity."
      }
    }
    ```
  - **Errors:** Validation errors if mood is not in the range of 1–5 or energy is not in the range of 1–3, unauthorized errors

- **Get User Check-Ins**
  - **Method:** GET
  - **URL:** `/api/check-ins?userId={userId}&page=1&limit=20`
  - **Description:** Retrieve paginated check-in records for a user.
  - **Response:** Array of check-in objects
  - **Errors:** Unauthorized, not found

### 2.3 Task Templates

- **List Task Templates**
  - **Method:** GET
  - **URL:** `/api/task-templates`
  - **Description:** Retrieve all available task templates.
  - **Response:** Array of task template objects

- **Get Single Task Template**
  - **Method:** GET
  - **URL:** `/api/task-templates/{templateId}`
  - **Description:** Retrieve details for a specific task template
  - **Response:** Task template object

### 2.4 User Tasks

- **List User Tasks**
  - **Method:** GET
  - **URL:** `/api/user-tasks?userId={userId}&page=1&limit=20`
  - **Description:** Retrieve paginated tasks assigned to the user.
  - **Response:** Array of user task objects, including status (pending, completed, skipped)

- **Get User Task**
  - **Method:** GET
  - **URL:** `/api/user-tasks/{taskId}`
  - **Description:** Retrieve details for a specific user task
  - **Response:** User task object

- **Update User Task (Mark Complete/Skip)**
  - **Method:** PATCH
  - **URL:** `/api/user-tasks/{taskId}`
  - **Description:** Update a user task status (e.g., task done or task skipped)
  - **Request Payload:**
    ```json
    { "status": "completed" } // or "skipped"
    ```
  - **Response:** Updated user task object
  - **Errors:** Constraint violation (e.g., updating a task that doesn't belong to the user)

### 2.5 User Events

- **List User Events**
  - **Method:** GET
  - **URL:** `/api/user-events?userId={userId}&page=1&limit=20`
  - **Description:** Retrieve an audit log of user events like check-in creation, task assignment, and task updates.
  - **Response:** Array of event objects

- **Log Event (Internal Use)**
  - **Method:** POST
  - **URL:** `/api/user-events`
  - **Description:** Log an event related to a user action. Usually handled internally by the API services.
  - **Request Payload:**
    ```json
    {
      "userId": "uuid",
      "event_type": "TASK_DONE",
      "entity_id": "uuid",
      "payload": { "additional": "info" }
    }
    ```
  - **Response:** Confirmation message

---

## 3. Authentication and Authorization

- The API uses JSON Web Tokens (JWT) provided by Supabase for authentication. Endpoints require a valid JWT in the `Authorization` header to access protected resources.
- Role-Level Security (RLS) policies are enforced at the database level for tables like `users`, `check_ins`, `user_tasks`, and `user_events` to ensure users can only access their own data.

---

## 4. Validation and Business Logic

- **Validation:**
  - Mood must be integers between 1 and 5 and energy levels must be integers between 1 and 3, enforced both via API validation and in the database using CHECK constraints.
  - Unique constraints such as one task per day (`user_id, task_date`) are verified in the API before assignment.

- **Business Logic:**
  - **Daily Check-In & Task Assignment:** When a user creates a check-in, the system evaluates the mood and energy levels to assign an appropriate task from `task_templates`. The response returns the newly created check-in along with the generated task.
  - **Task Updates:** Users can complete or skip tasks. A completed task triggers a `TASK_DONE` event, while a skipped task triggers a `TASK_SKIPPED` event which are logged into `user_events` for audit and retention analysis.

- **Paging, Filtering, and Sorting:**
  - List endpoints support pagination via `page` and `limit` query parameters.
  - Filtering can be extended via additional query parameters (e.g., status for tasks, date ranges for check-ins).
  - Sorting defaults to recent entries first unless specified.

---

## Assumptions

- Where details were ambiguous, default patterns (such as standard CRUD and HTTP status codes) have been adopted.
- Supabase is used for both authentication and database operations, ensuring seamless integration between authentication and RLS policies.

---

## 5. HTTP Status Codes and Error Handling

- **200 OK:** Successful GET operations.
- **201 Created:** Successful creation of resources.
- **400 Bad Request:** Input validation failures.
- **401 Unauthorized:** Missing or invalid authentication tokens.
- **403 Forbidden:** Attempting to access resources not owned by the user.
- **404 Not Found:** Resource not available.
- **500 Internal Server Error:** Unhandled errors.

---

This plan lays a solid foundation for the REST API. Further iterations can include more detailed definitions for each endpoint as the application evolves.

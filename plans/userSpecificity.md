# make the app user specific

1.  **Add Database Tables and Columns:**
    *   Create a `User` table: `id`, `email`, `hashed_password`, `name`, `created_at`, `last_login`.
    *   Add a `user_id` foreign key (non-nullable) to `Expense`, `RecurringExpense`, `Budget`, and `SavingGoal` tables.

2.  **Implement Authentication Backend (`service/auth_service.py` and `main.py`):**
    *   Utilize `passlib` for password hashing and `python-jose` for JWT generation.
    *   **New File:** `service/auth_service.py` will contain functions for:
        *   Registering new users (hashing passwords).
        *   Authenticating users (verifying passwords).
        *   Creating and verifying JWTs.
        *   A FastAPI dependency to extract `user_id` from a valid JWT.
    *   **Modified `main.py`:**
        *   Add new API endpoints for user registration (`/auth/register`) and login (`/auth/token`).
        *   These endpoints will leverage `auth_service.py`.

3.  **Integrate User ID in Existing API Functionality (`main.py`):**
    *   For all data-related API endpoints (e.g., `create_expense`, `read_expenses`, `get_saving_goals`), add a FastAPI dependency to obtain the `current_user_id` from the authenticated JWT.
    *   Modify all database queries within these endpoints to filter results by `user_id`.
    *   Ensure new records created via these APIs are associated with the `current_user_id`.

4.  **Frontend Integration (`expense-tracker-frontend/src/services/api.ts`):**
    *   Add new functions in `api.ts` for `login` and `register`.
    *   Implement an Axios interceptor to automatically attach the JWT to the `Authorization` header of all subsequent API requests.
    *   Securely store the JWT (e.g., `localStorage`).

5.  **Service Layer Updates (`service/*`):**
    *   Modify functions in `service/statementExtractor.py`, `service/mail_service.py`, etc., that interact with database data to accept and utilize the `user_id` for user-specific operations.

6.  **Data Migration:**
    *   Create a test user (e.g., with ID `0000`).
    *   Migrate all existing data in the `Expense`, `RecurringExpense`, `Budget`, and `SavingGoal` tables to be associated with this test user. This ensures existing data remains accessible to the initial user after the changes.

7.  **Frontend Authentication & User Experience:**

    *   **Landing/Home Page:**
        *   Create an elegant and informative static home page that showcases the app's features and value proposition.
        *   Prominently display clear "Login" and "Sign Up" buttons.

    *   **Sign-Up Flow (`/signup`):**
        *   Design a user-friendly sign-up form asking for `Name`, `Email`, and `Password`.
        *   Implement **real-time inline validation** for all input fields (e.g., "Email already registered," "Password too short/weak," "Invalid email format," "Passwords do not match").
        *   Include a **password strength indicator** to guide users in creating secure passwords.
        *   On successful registration, **automatically log the user in** and redirect them to the main dashboard. Display a brief, positive feedback message (e.g., "Welcome! Your account has been created.").
        *   Display clear, user-friendly error messages for failed registrations (e.g., "Failed to register. Please try again.").
        *   Show a loading state during form submission.

    *   **Login Flow (`/login`):**
        *   Design a login form for `Email` and `Password`.
        *   On successful login, redirect the user to the current main dashboard screen.
        *   Display clear, user-friendly error messages for failed login attempts (e.g., "Invalid email or password," "Account locked").
        *   Show a loading state during form submission.

    *   **Forgot Password Flow:**
        *   Add a "Forgot Password?" link on the login page.
        *   **Request Email Page:** Prompt the user to enter their registered email address. Send a password reset link to this email. Provide a non-committal success message (e.g., "If an account with that email exists, a password reset link has been sent to your inbox.") for security.
        *   **Reset Password Page:** The link in the email will direct the user to a page where they can set a `New Password` and `Confirm New Password`.
        *   Implement input validation for password fields similar to signup.
        *   **Backend:** The backend will handle token validation from the reset link and update the hashed password in the `User` table upon successful new password submission.
        *   After successful password reset, redirect the user to the login page with a success notification (e.g., "Password successfully reset. Please log in with your new password.").

    *   **General UI/UX:**
        *   Ensure consistent styling and clear navigation across all authentication-related pages.
        *   Consider adding a "Logout" functionality that clears the JWT from `localStorage`.


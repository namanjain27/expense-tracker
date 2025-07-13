# Brief summary of changes made

Structure:
## time, Date
very concise and crisp details of the changes made.

Example:
## 01:50, 12-07-2025
fixed date warning in addExpense Dialog and Fixed dashboard theme

## 02:15, 13-07-2025
Implemented Phase 1 refresh token mechanism: Added RefreshToken model, auth service functions for token creation/validation/rotation, updated login endpoint to set HttpOnly cookies, added /auth/refresh and /auth/logout endpoints with token rotation security

## 02:30, 13-07-2025
Implemented Phase 2 refresh token mechanism: Added axios response interceptor for automatic 401 handling and token refresh, implemented queue system for simultaneous requests, updated login/logout functions to handle cookies, enabled withCredentials for CORS 
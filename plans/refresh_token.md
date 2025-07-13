# refresh token for authorization

## Goal: 
Implement a secure session management system using JWT access tokens and dedicated refresh tokens. If a user is active after access token expiry, a new access token and a new refresh token is issued without requiring a full re-login.

On Access Token Expiry (Reactive Approach):
User sends a request with an expired JWT → server returns 401 Unauthorized.
Frontend catches this and sends a POST /refresh request with the refresh token.
On success, frontend retries the original request with the new access token.

## Key Components & Concepts:
Access Token: Short-lived (e.g., 30 minutes), sent with every authenticated request.

Refresh Token: Long-lived (e.g., 7 days or more), used only to obtain new access tokens. It should be stored securely (e.g., HttpOnly cookie).

Token Rotation (Optional but Recommended for Security): Each time a refresh token is used to get a new access token, a new refresh token is also issued, and the old one is invalidated. This helps prevent replay attacks if a refresh token is compromised.

Implementation Steps
1. Backend (FastAPI)
    a. Models & Schemas
        Define Pydantic models for:
            Token responses (access, refresh)
            Refresh request payload
    b. Token Generation & Storage
        Implement functions to:
            Generate JWT access tokens (short expiry) - DONE
            Generate refresh tokens (long expiry, random string or JWT)
            Store refresh tokens securely (DB table: user_id, token, expiry, revoked flag, etc.)
    c. Authentication Middleware
        Update authentication dependency to:
            Validate access token on each request
            Return 401 if expired/invalid
    d. Refresh Endpoint
        POST /refresh endpoint:
            Accepts refresh token (from HttpOnly cookie or request body)
            Validates token (existence, expiry, not revoked)
            Issues new access and refresh tokens (token rotation)
            Revokes old refresh token
            Returns new tokens (set refresh token as HttpOnly cookie)
    e. Security Best Practices
        Use HttpOnly, Secure cookies for refresh tokens (prevents JS access)

2. Frontend (React + TypeScript)
    a. Token Storage
        Store refresh token in HttpOnly cookie (set by backend)
    b. API Service Layer
        Intercept 401 responses in API calls
        On 401:
            Call /refresh endpoint
            If successful, retry original request with new access token
            If refresh fails, tell user that the session has expired and please login `<login link>`
    c. Login/Logout Flow
        On login: receive and store tokens appropriately
        On logout: clear tokens, call backend to revoke refresh token
    d. TypeScript Types
        Define interfaces for token responses and API payloads
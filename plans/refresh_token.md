# refresh token for authorization

## Goal: 
Implement a secure session management system using JWT access tokens and dedicated refresh tokens. If a user is active after access token expiry, a new access token and a new refresh token is issued without requiring a full re-login.

Current State Analysis

  Backend (FastAPI):
  - JWT tokens with 30-minute expiry
  - Uses jose library for JWT handling
  - OAuth2PasswordBearer scheme
  - No refresh token mechanism currently

  Frontend (React):
  - Access tokens stored in localStorage
  - Simple axios interceptor adds Bearer token to requests
  - No 401 error handling for token refresh

  Implementation Plan

  Phase 1: Backend Changes

  1. Database Schema Updates
  - Add RefreshToken model in models.py:
    - id, user_id, token, expires_at, created_at, is_active
    - Foreign key to User table

  2. Auth Service Enhancements
  - Add refresh token creation/validation functions in
  auth_service.py:
    - create_refresh_token() - generates secure random token, 7-day        
  expiry
    - validate_refresh_token() - checks token validity and expiry
    - revoke_refresh_token() - marks token as inactive for rotation        
  - Update ACCESS_TOKEN_EXPIRE_MINUTES to 30 minutes (already correct)     
  - Add REFRESH_TOKEN_EXPIRE_DAYS = 7

  3. API Endpoints
  - Modify /auth/token endpoint to return both access + refresh tokens     
  - Add /auth/refresh endpoint:
    - Accepts refresh token from HttpOnly cookie
    - Returns new access token + new refresh token (rotation)
    - Sets new refresh token as HttpOnly cookie
  - Add logout endpoint to revoke refresh tokens

  Phase 2: Frontend Changes

  4. API Service Updates
  - Add response interceptor to handle 401 errors
  - Implement refresh token flow:
    - On 401: call /auth/refresh
    - If successful: retry original request
    - If refresh fails: redirect to login
  - Remove refresh token handling from localStorage (server handles        
  via cookies)

  5. Auth Flow Updates
  - Update login to handle refresh token cookies
  - Add logout API call to revoke server-side tokens
  - Handle edge cases (multiple simultaneous 401s)

  Phase 3: Security Enhancements

  6. Token Rotation
  - Implement refresh token rotation (new refresh token on each use)       
  - Invalidate old refresh tokens
  - Add token family tracking for compromise detection

  7. Cookie Security
  - Set HttpOnly, Secure, SameSite cookies for refresh tokens
  - Configure CORS for credentials
  - Add CSRF protection considerations

  Implementation Order

  1. Backend Models & DB - Add RefreshToken model, run migration
  2. Backend Auth Service - Add refresh token functions
  3. Backend API Endpoints - Modify login, add refresh endpoint
  4. Frontend API Interceptors - Add 401 handling and retry logic
  5. Frontend Auth Flow - Update login/logout components
  6. Security Hardening - Implement rotation and cookie security
  7. Testing - Test token expiry, refresh, and edge cases

a. Token Storage
    Store refresh token in HttpOnly cookie (set by backend)
b. API Service Layer
    Intercept 401 responses in API calls
    On 401:
        Call /refresh endpoint
        If successful, retry original request with new access token
        If refresh fails, tell user that the session has expired and please login `<login link>`
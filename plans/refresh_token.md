# refresh auth token

## Goal: 
Implement a secure session management system using JWT access tokens and dedicated refresh tokens. If a user is active near the access token expiry, a new access token (and optionally a new refresh token) can be issued without requiring a full re-login. If not active, the session will expire gracefully. "Session Timeout reached. Please <login link>login</link> again." 

## Key Components & Concepts:
Access Token: Short-lived (e.g., 30 minutes), sent with every authenticated request.

Refresh Token: Long-lived (e.g., 7 days or more), used only to obtain new access tokens. It should be stored securely (e.g., HttpOnly cookie).

User Activity Tracking: We need a way to determine if the user has been "active" recently. A simple way is to update a last_activity_at timestamp in the User model on every authenticated API call.

Token Rotation (Optional but Recommended for Security): Each time a refresh token is used to get a new access token, a new refresh token is also issued, and the old one is invalidated. This helps prevent replay attacks if a refresh token is compromised.

update_user_last_activity - NOT NEEDED in current scope
when the JWT token expiration time - x mins hit, the refresh token request must be made.
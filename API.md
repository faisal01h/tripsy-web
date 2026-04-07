# Tripsy API Documentation

## Overview
This API mirrors the current web features and is exposed under `/api/v1`.

- Auth type: JWT Bearer token
- Token header: `Authorization: Bearer <token>`
- Content type: `application/json`

## Base URL
- Local: `http://localhost:8000`
- API prefix: `/api/v1`

## Authentication Endpoints

### Register
- `POST /api/v1/auth/register`
- Body:
```json
{
  "name": "API User",
  "email": "api-user@example.com",
  "password": "password",
  "password_confirmation": "password"
}
```

### Login
- `POST /api/v1/auth/login`
- Body:
```json
{
  "email": "api-user@example.com",
  "password": "password"
}
```

### Current User
- `GET /api/v1/auth/me`
- Auth required: Yes

### Logout
- `POST /api/v1/auth/logout`
- Auth required: Yes
- Behavior: Revokes current JWT

## Feature Endpoints

### Dashboard
- `GET /api/v1/dashboard`
- Auth required: Yes

### Trips
- `GET /api/v1/trips`
- `POST /api/v1/trips`
- `GET /api/v1/trips/{trip}`
- `PATCH /api/v1/trips/{trip}`
- `DELETE /api/v1/trips/{trip}`

### Trip Members
- `POST /api/v1/trips/{trip}/members`
- `DELETE /api/v1/trips/{trip}/members/{user}`

### Trip Itineraries
- `POST /api/v1/trips/{trip}/itineraries`

### Trip Expenses
- `POST /api/v1/trips/{trip}/expenses`
- `PATCH /api/v1/trips/{trip}/expenses/{tripExpense}`

### Friendships
- `GET /api/v1/friends`
- `POST /api/v1/friendships`
- `PATCH /api/v1/friendships/{friendship}/accept`
- `DELETE /api/v1/friendships/{friendship}`

### Settings Profile
- `GET /api/v1/settings/profile`
- `PATCH /api/v1/settings/profile`
- `DELETE /api/v1/settings/profile`

### Settings Security
- `GET /api/v1/settings/security`
- `PUT /api/v1/settings/password`

## Common Error Responses

### Unauthenticated
```json
{
  "message": "Unauthenticated.",
  "error": "Missing bearer token."
}
```

### Validation Error
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "field_name": ["Validation message"]
  }
}
```

## Notes
- JWT settings are in `config/jwt.php`.
- Default JWT TTL: `60` minutes.
- Security endpoint `PUT /settings/password` is throttled (`6` requests per minute).

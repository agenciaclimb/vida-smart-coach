# Get Google Credentials - Google OAuth Configuration

## Overview
Edge Function that provides Google OAuth credentials and configuration for authentication integration. Used for Google login and API access setup.

## Features
- ✅ Google OAuth configuration
- ✅ Credential information (sanitized)
- ✅ Scope definitions
- ✅ No authentication required
- ✅ CORS support
- ✅ Error handling

## Environment Variables
```env
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-domain.com/auth/callback
```

## API Endpoints
- **GET** `/` - Get Google OAuth credentials
- **OPTIONS** `/` - CORS preflight handling

## Response Format
```json
{
  "credentials": {
    "client_id": "your_google_client_id.apps.googleusercontent.com",
    "client_secret": "[REDACTED]",
    "redirect_uri": "https://your-domain.com/auth/callback",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
```

## Default Values (Development)
```json
{
  "credentials": {
    "client_id": "your-google-client-id",
    "client_secret": "not-configured",
    "redirect_uri": "http://localhost:3000/auth/callback",
    "scopes": [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile"
    ]
  }
}
```

## Error Responses
```json
{
  "error": "Method not allowed"
}
```

## Testing
```bash
# Test Google credentials
curl -X GET http://localhost:54321/functions/v1/get-google-credentials
```

## OAuth Scopes
- **userinfo.email**: Access to user's email address
- **userinfo.profile**: Access to user's basic profile information

## Security
- Client secret is redacted in responses
- Public endpoint for OAuth configuration
- CORS origin restrictions
- Method validation (GET only)

## Integration
Used by frontend applications to configure Google OAuth flow:
1. Fetch credentials from this endpoint
2. Initialize Google OAuth with client_id
3. Redirect to Google with appropriate scopes
4. Handle callback at redirect_uri

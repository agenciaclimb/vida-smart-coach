# Get Google Calendar Credentials - Google Calendar OAuth Configuration

## Overview
Edge Function that provides Google Calendar OAuth credentials and configuration for calendar integration. Used for Google Calendar API access and event management.

## Features
- ✅ Google Calendar OAuth configuration
- ✅ Calendar-specific credentials (sanitized)
- ✅ Calendar scope definitions
- ✅ Authorization URL generation
- ✅ No authentication required
- ✅ CORS support
- ✅ Error handling

## Environment Variables
```env
GOOGLE_CALENDAR_CLIENT_ID=your_calendar_client_id.apps.googleusercontent.com
GOOGLE_CALENDAR_CLIENT_SECRET=your_calendar_client_secret
GOOGLE_CALENDAR_REDIRECT_URI=https://your-domain.com/auth/calendar/callback
```

## API Endpoints
- **GET** `/` - Get Google Calendar OAuth credentials
- **OPTIONS** `/` - CORS preflight handling

## Response Format
```json
{
  "calendar_credentials": {
    "client_id": "your_calendar_client_id.apps.googleusercontent.com",
    "client_secret": "[REDACTED]",
    "redirect_uri": "https://your-domain.com/auth/calendar/callback",
    "scopes": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ],
    "auth_url": "https://accounts.google.com/o/oauth2/auth"
  }
}
```

## Default Values (Development)
```json
{
  "calendar_credentials": {
    "client_id": "your-google-calendar-client-id",
    "client_secret": "not-configured",
    "redirect_uri": "http://localhost:3000/auth/calendar/callback",
    "scopes": [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events"
    ],
    "auth_url": "https://accounts.google.com/o/oauth2/auth"
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
# Test Google Calendar credentials
curl -X GET http://localhost:54321/functions/v1/get-google-calendar-credentials
```

## OAuth Scopes
- **calendar**: Full access to Google Calendar
- **calendar.events**: Access to calendar events (read/write)

## Security
- Client secret is redacted in responses
- Public endpoint for OAuth configuration
- CORS origin restrictions
- Method validation (GET only)

## Integration
Used by frontend applications to configure Google Calendar OAuth flow:
1. Fetch credentials from this endpoint
2. Initialize Google Calendar OAuth with client_id
3. Redirect to Google with calendar scopes
4. Handle callback at redirect_uri
5. Use access token for Calendar API calls

## Calendar Features
- Event creation and management
- Calendar access and synchronization
- Health appointment scheduling
- Reminder and notification setup

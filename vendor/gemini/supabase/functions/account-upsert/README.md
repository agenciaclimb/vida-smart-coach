# Account Upsert - User Creation and Profile Management

## Overview
Edge Function for creating new users and managing user profiles in the Vida Smart system. Handles both email and phone-based registration with automatic profile creation and error recovery.

## Features
- ✅ Email and phone registration support
- ✅ Automatic profile creation with auth.users trigger fallback
- ✅ Improved AuthApiError handling
- ✅ Duplicate user detection and prevention
- ✅ Referral token generation
- ✅ CORS support
- ✅ Comprehensive error handling

## Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
APP_BASE_URL=your_app_base_url
```

## API Endpoints
- **POST** `/` - Create or update user account
- **OPTIONS** `/` - CORS preflight handling

## Request Format
```json
{
  "phone": "5511999999999",
  "fullName": "João Silva",
  "email": "joao@example.com",
  "password": "optional_password"
}
```

## Response Format
```json
{
  "ok": true,
  "userId": "user-uuid",
  "phone": "5511999999999",
  "email": "joao@example.com",
  "referralUrl": "https://app.com/register?ref=token"
}
```

## Validation Rules
- **phone OR email**: At least one is required
- **fullName**: Optional, defaults to "Usuário"
- **password**: Optional, auto-generated if not provided

## Error Responses
```json
{
  "ok": false,
  "error": "phone or email required"
}
```

```json
{
  "ok": false,
  "error": "User creation failed",
  "code": "unexpected_failure",
  "type": "AuthApiError"
}
```

## Key Improvements
- **AuthApiError Handling**: Proper try/catch blocks prevent syntax errors
- **Profile Creation Fallback**: Manual profile creation if trigger fails
- **Error Isolation**: User creation and profile creation errors handled separately
- **Detailed Error Reporting**: Includes error type and code for debugging

## Testing
```bash
# Test user creation
curl -X POST http://localhost:54321/functions/v1/account-upsert \
  -H "Content-Type: application/json" \
  -d '{"phone": "5511999999999", "fullName": "Test User", "email": "test@example.com"}'
```

## Security
- Service role database access
- Input validation and sanitization
- CORS origin restrictions
- Password auto-generation for security
- Referral token generation for tracking

## Database Integration
- Creates users in `auth.users` table
- Creates profiles in `public.user_profiles` table
- Handles referral token generation
- Integrates with app settings for base URL

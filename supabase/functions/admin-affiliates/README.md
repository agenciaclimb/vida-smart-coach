# Admin Affiliates - Affiliate Management

## Overview
Edge Function for managing affiliate partners in the Vida Smart system. Provides listing functionality for authenticated admin users.

## Features
- ✅ Authenticated access only
- ✅ User token validation
- ✅ Affiliate listing
- ✅ CORS support
- ✅ Error handling

## Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints
- **GET** `/` - List all affiliates
- **OPTIONS** `/` - CORS preflight handling

## Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer your_jwt_token
```

## Response Format
```json
{
  "success": true,
  "user_id": "user-uuid",
  "affiliates": [
    {
      "id": 1,
      "name": "João Silva",
      "email": "joao@example.com",
      "commission": 10
    }
  ]
}
```

## Error Responses
```json
{
  "error": "Usuário não autenticado."
}
```

## Testing
```bash
# Test with valid token
curl -X GET http://localhost:54321/functions/v1/admin-affiliates \
  -H "Authorization: Bearer your_jwt_token"
```

## Security
- JWT token validation
- User authentication check
- CORS origin restrictions
- Service role database access

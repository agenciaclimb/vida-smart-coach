# Admin Create Affiliate - Affiliate Creation

## Overview
Edge Function for creating new affiliate partners in the Vida Smart system. Provides secure affiliate creation functionality for authenticated admin users.

## Features
- ✅ Authenticated access only
- ✅ User token validation
- ✅ Input data validation
- ✅ Affiliate creation
- ✅ CORS support
- ✅ Error handling

## Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints
- **POST** `/` - Create new affiliate
- **OPTIONS** `/` - CORS preflight handling

## Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer your_jwt_token
```

## Request Format
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "commission": 15
}
```

## Response Format
```json
{
  "success": true,
  "message": "Afiliado criado com sucesso",
  "affiliate": {
    "id": 1693747200000,
    "name": "João Silva",
    "email": "joao@example.com",
    "commission": 15,
    "created_by": "user-uuid",
    "created_at": "2025-09-04T01:00:00.000Z"
  }
}
```

## Validation Rules
- **name**: Required, non-empty string
- **email**: Required, valid email format
- **commission**: Required, numeric value

## Error Responses
```json
{
  "error": "Usuário não autenticado."
}
```

```json
{
  "error": "Dados obrigatórios: name, email, commission"
}
```

## Testing
```bash
# Test affiliate creation
curl -X POST http://localhost:54321/functions/v1/admin-create-affiliate \
  -H "Authorization: Bearer your_jwt_token" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "email": "test@example.com", "commission": 10}'
```

## Security
- JWT token validation
- User authentication check
- Input data validation
- CORS origin restrictions
- Service role database access

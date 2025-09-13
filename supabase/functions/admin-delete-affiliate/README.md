# Admin Delete Affiliate - Affiliate Removal

## Overview
Edge Function for removing affiliate partners from the Vida Smart system. Provides secure affiliate deletion functionality for authenticated admin users.

## Features
- ✅ Authenticated access only
- ✅ User token validation
- ✅ URL parameter validation
- ✅ Affiliate deletion
- ✅ CORS support
- ✅ Error handling

## Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## API Endpoints
- **DELETE** `/?id=affiliate_id` - Delete affiliate by ID
- **OPTIONS** `/` - CORS preflight handling

## Authentication
Requires valid JWT token in Authorization header:
```
Authorization: Bearer your_jwt_token
```

## Request Format
```
DELETE /admin-delete-affiliate?id=123
```

## Response Format
```json
{
  "success": true,
  "message": "Afiliado 123 deletado com sucesso",
  "deleted_by": "user-uuid"
}
```

## Validation Rules
- **id**: Required URL parameter, affiliate ID

## Error Responses
```json
{
  "error": "Usuário não autenticado."
}
```

```json
{
  "error": "ID do afiliado é obrigatório"
}
```

## Testing
```bash
# Test affiliate deletion
curl -X DELETE "http://localhost:54321/functions/v1/admin-delete-affiliate?id=123" \
  -H "Authorization: Bearer your_jwt_token"
```

## Security
- JWT token validation
- User authentication check
- URL parameter validation
- CORS origin restrictions
- Service role database access
- Audit trail with deleted_by tracking

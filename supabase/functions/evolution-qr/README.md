# Evolution QR - WhatsApp QR Code Generation

## Overview
Edge Function for generating WhatsApp QR codes via Evolution API integration. Used for WhatsApp instance connection and authentication.

## Features
- ✅ QR code generation
- ✅ Instance ID validation
- ✅ Phone number association
- ✅ Expiration handling
- ✅ CORS support
- ✅ Error handling

## Environment Variables
None required for basic QR generation (uses mock data for development).

## API Endpoints
- **POST** `/` - Generate QR code for WhatsApp instance
- **OPTIONS** `/` - CORS preflight handling

## Request Format
```json
{
  "instance_id": "vida_smart_instance",
  "phone_number": "5511999999999"
}
```

## Response Format
```json
{
  "qr_data": {
    "qr_code": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    "instance_id": "vida_smart_instance",
    "phone_number": "5511999999999",
    "expires_at": "2025-09-04T01:05:00.000Z",
    "status": "pending"
  }
}
```

## Validation Rules
- **instance_id**: Required, non-empty string
- **phone_number**: Optional, phone number format

## Error Responses
```json
{
  "error": "Instance ID is required"
}
```

```json
{
  "error": "Method not allowed"
}
```

## Testing
```bash
# Test QR code generation
curl -X POST http://localhost:54321/functions/v1/evolution-qr \
  -H "Content-Type: application/json" \
  -d '{"instance_id": "test_instance", "phone_number": "5511999999999"}'
```

## QR Code Properties
- **Format**: Base64 encoded PNG image
- **Expiration**: 5 minutes from generation
- **Status**: "pending" until scanned
- **Instance Association**: Linked to specific WhatsApp instance

## Security
- Instance ID validation
- CORS origin restrictions
- Method validation (POST only)
- Expiration time limits

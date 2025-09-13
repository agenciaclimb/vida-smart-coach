# Get Active Provider - Provider Status

## Overview
Edge Function that returns information about the active service provider for the Vida Smart system. Used for system status checks and provider information display.

## Features
- ✅ Provider status information
- ✅ Service availability check
- ✅ No authentication required
- ✅ CORS support
- ✅ Error handling

## Environment Variables
None required - this is a utility function.

## API Endpoints
- **GET** `/` - Get active provider information
- **OPTIONS** `/` - CORS preflight handling

## Response Format
```json
{
  "provider": {
    "id": "provider_001",
    "name": "Vida Smart Provider",
    "status": "active",
    "services": [
      "health_tracking",
      "ai_coaching", 
      "nutrition_planning"
    ],
    "last_updated": "2025-09-04T01:00:00.000Z"
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
# Test provider status
curl -X GET http://localhost:54321/functions/v1/get-active-provider
```

## Use Cases
- System health monitoring
- Service availability checks
- Provider information display
- Integration status verification

## Security
- Public endpoint (no authentication required)
- CORS origin restrictions
- Method validation (GET only)

# Hello World - Test Function

## Overview
Simple Edge Function for testing and health checks. Provides basic functionality testing and system verification.

## Features
- ✅ Basic request/response handling
- ✅ JSON parameter processing
- ✅ Timestamp generation
- ✅ CORS support
- ✅ Error handling

## Environment Variables
None required - this is a test function.

## API Endpoints
- **POST** `/` - Process hello world request
- **OPTIONS** `/` - CORS preflight handling

## Request Format
```json
{
  "name": "Test User"
}
```

## Response Format
```json
{
  "message": "Hello Test User!",
  "timestamp": "2025-09-04T01:00:00.000Z"
}
```

## Default Response (no name provided)
```json
{
  "message": "Hello World!",
  "timestamp": "2025-09-04T01:00:00.000Z"
}
```

## Error Responses
```json
{
  "error": "Invalid JSON format"
}
```

## Testing
```bash
# Test with name parameter
curl -X POST http://localhost:54321/functions/v1/hello-world \
  -H "Content-Type: application/json" \
  -d '{"name": "Devin"}'

# Test without parameters
curl -X POST http://localhost:54321/functions/v1/hello-world \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Use Cases
- Function deployment testing
- System health checks
- API connectivity verification
- Development environment validation

## Security
- Public endpoint (no authentication required)
- CORS origin restrictions
- Basic input validation

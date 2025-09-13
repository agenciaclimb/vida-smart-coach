# Evolution Webhook - WhatsApp Integration

## Overview
Core Edge Function that processes WhatsApp messages via Evolution API webhook and generates AI responses using OpenAI GPT-3.5.

## Features
- ✅ WhatsApp message processing
- ✅ OpenAI GPT-3.5 integration
- ✅ User context awareness
- ✅ Health coaching responses
- ✅ Message history tracking
- ✅ Error handling and logging

## Environment Variables
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
EVOLUTION_API_URL=your_evolution_api_url
EVOLUTION_API_KEY=your_evolution_api_key
EVOLUTION_INSTANCE_ID=your_instance_id
```

## API Endpoints
- **POST** `/` - Process incoming WhatsApp messages
- **OPTIONS** `/` - CORS preflight handling

## Request Format
```json
{
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Como posso melhorar minha alimentação?"
    },
    "messageTimestamp": 1693747200
  }
}
```

## Response Format
```json
{
  "success": true,
  "message": "Message processed successfully",
  "ai_response": "Ótima pergunta! Para melhorar sua alimentação..."
}
```

## AI System Prompt
The function uses a comprehensive system prompt that defines the AI as "Vida Smart Coach" with specific personality traits and health coaching expertise.

## Error Handling
- Invalid webhook format
- Missing required fields
- OpenAI API failures
- Evolution API communication errors
- Database connection issues

## Testing
```bash
# Local testing
curl -X POST http://localhost:54321/functions/v1/evolution-webhook \
  -H "Content-Type: application/json" \
  -d '{"data": {"key": {"remoteJid": "test@s.whatsapp.net"}, "message": {"conversation": "Hello"}}}'
```

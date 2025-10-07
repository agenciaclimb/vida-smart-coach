import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { cors } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = cors(req.headers.get('origin'))
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers })
  }

  try {
    if (req.method === 'GET') {
      const calendarCredentials = {
        client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') || 'your-google-calendar-client-id',
        client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') ? '[REDACTED]' : 'not-configured',
        redirect_uri: Deno.env.get('GOOGLE_CALENDAR_REDIRECT_URI') || 'http://localhost:3000/auth/calendar/callback',
        scopes: [
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/calendar.events'
        ],
        auth_url: 'https://accounts.google.com/o/oauth2/auth'
      }
      
      return new Response(
        JSON.stringify({ calendar_credentials: calendarCredentials }),
        { 
          headers: { 
            ...headers,
            'Content-Type': 'application/json' 
          } 
        },
      )
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json' 
        }, 
        status: 405 
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...headers,
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      },
    )
  }
})

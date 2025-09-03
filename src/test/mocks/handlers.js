import { http, HttpResponse } from 'msw'

export const handlers = [
  http.post('https://api.openai.com/v1/chat/completions', () => {
    return HttpResponse.json({
      choices: [{
        message: {
          content: 'Olá! Sou sua IA Coach e estou aqui para te ajudar em sua jornada de bem-estar! 🌟'
        }
      }]
    })
  }),

  http.post('*/message/sendText/*', () => {
    return HttpResponse.json({
      success: true,
      message: 'Message sent successfully'
    })
  }),

  http.post('*/auth/v1/signup', () => {
    return HttpResponse.json({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        created_at: new Date().toISOString()
      }
    })
  }),

  http.post('*/auth/v1/token', () => {
    return HttpResponse.json({
      access_token: 'mock-access-token',
      user: {
        id: 'test-user-id',
        email: 'test@example.com'
      }
    })
  }),

  http.get('*/rest/v1/profiles*', () => {
    return HttpResponse.json([{
      id: 'test-user-id',
      role: 'client',
      name: 'Test User',
      created_at: new Date().toISOString()
    }])
  }),

  http.post('*/rest/v1/profiles', () => {
    return HttpResponse.json({
      id: 'test-user-id',
      role: 'client',
      name: 'Test User',
      created_at: new Date().toISOString()
    })
  }),

  http.get('*/rest/v1/gamification*', () => {
    return HttpResponse.json([{
      user_id: 'test-user-id',
      total_points: 100,
      current_streak: 5,
      longest_streak: 10,
      level: 2,
      badges: ['first_checkin', 'week_warrior'],
      weekly_goal_progress: 75,
      monthly_goal_progress: 60
    }])
  }),

  http.get('*/rest/v1/daily_checkins*', () => {
    return HttpResponse.json([{
      id: 'checkin-id',
      user_id: 'test-user-id',
      date: new Date().toISOString().split('T')[0],
      mood: 4,
      energy_level: 3,
      sleep_hours: 7.5,
      water_intake: 8,
      exercise_minutes: 30,
      notes: 'Feeling great today!',
      ai_feedback: 'Excellent progress! Keep it up!'
    }])
  }),

  http.get('*/rest/v1/conversations*', () => {
    return HttpResponse.json([{
      id: 'conversation-id',
      user_id: 'test-user-id',
      role: 'user',
      content: 'Hello AI Coach!',
      created_at: new Date().toISOString()
    }, {
      id: 'conversation-id-2',
      user_id: 'test-user-id',
      role: 'assistant',
      content: 'Hello! How can I help you today?',
      created_at: new Date().toISOString()
    }])
  }),

  http.post('*/rest/v1/whatsapp_messages', () => {
    return HttpResponse.json({
      id: 'message-id',
      phone_number: '+5511999999999',
      message_content: 'Test message',
      message_type: 'text',
      received_at: new Date().toISOString()
    })
  })
]

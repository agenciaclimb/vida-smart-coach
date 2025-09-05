import { mockSupabaseClient } from './test-utils'

export const createTestUser = async (userData = {}) => {
  const defaultUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    ...userData
  }

  mockSupabaseClient.auth.signUp.mockResolvedValue({
    data: { user: defaultUser },
    error: null
  })

  return defaultUser
}

export const createTestProfile = async (profileData = {}) => {
  const defaultProfile = {
    id: 'test-user-id',
    role: 'client',
    name: 'Test User',
    age: 30,
    goals: ['weight_loss'],
    activity_level: 'intermediate',
    created_at: new Date().toISOString(),
    ...profileData
  }

  mockSupabaseClient.from.mockReturnValue({
    insert: vi.fn(() => Promise.resolve({ data: defaultProfile, error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: defaultProfile, error: null }))
      }))
    }))
  })

  return defaultProfile
}

export const createTestGamification = async (gamificationData = {}) => {
  const defaultGamification = {
    user_id: 'test-user-id',
    total_points: 100,
    current_streak: 5,
    longest_streak: 10,
    level: 2,
    badges: ['first_checkin', 'week_warrior'],
    weekly_goal_progress: 75,
    monthly_goal_progress: 60,
    updated_at: new Date().toISOString(),
    ...gamificationData
  }

  mockSupabaseClient.from.mockReturnValue({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: defaultGamification, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ data: defaultGamification, error: null }))
    }))
  })

  return defaultGamification
}

export const createTestCheckIn = async (checkInData = {}) => {
  const defaultCheckIn = {
    id: 'checkin-id',
    user_id: 'test-user-id',
    date: new Date().toISOString().split('T')[0],
    mood: 4,
    energy_level: 3,
    sleep_hours: 7.5,
    water_intake: 8,
    exercise_minutes: 30,
    notes: 'Feeling great today!',
    ai_feedback: 'Excellent progress! Keep it up!',
    created_at: new Date().toISOString(),
    ...checkInData
  }

  mockSupabaseClient.from.mockReturnValue({
    insert: vi.fn(() => Promise.resolve({ data: defaultCheckIn, error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [defaultCheckIn], error: null }))
      }))
    }))
  })

  return defaultCheckIn
}

export const createTestConversation = async (conversationData = {}) => {
  const defaultConversation = {
    id: 'conversation-id',
    user_id: 'test-user-id',
    role: 'user',
    content: 'Hello AI Coach!',
    created_at: new Date().toISOString(),
    ...conversationData
  }

  mockSupabaseClient.from.mockReturnValue({
    insert: vi.fn(() => Promise.resolve({ data: defaultConversation, error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [defaultConversation], error: null }))
      }))
    }))
  })

  return defaultConversation
}

export const createTestWhatsAppMessage = async (messageData = {}) => {
  const defaultMessage = {
    id: 'message-id',
    phone_number: '+5511999999999',
    message_content: 'Test message',
    message_type: 'text',
    webhook_data: {},
    received_at: new Date().toISOString(),
    instance_id: 'test-instance',
    ...messageData
  }

  mockSupabaseClient.from.mockReturnValue({
    insert: vi.fn(() => Promise.resolve({ data: defaultMessage, error: null })),
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [defaultMessage], error: null }))
      }))
    }))
  })

  return defaultMessage
}

export const resetMocks = () => {
  vi.clearAllMocks()
  
  mockSupabaseClient.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null
  })
  
  mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } }
  })
}

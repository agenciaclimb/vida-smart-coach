import { describe, it, expect, vi } from 'vitest'
import { mockSupabaseClient } from '@/test/utils/test-utils'

describe('Daily Check-ins System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should validate check-in data', () => {
    const validCheckIn = {
      mood: 4,
      energy_level: 3,
      sleep_hours: 7.5,
      water_intake: 8,
      exercise_minutes: 30,
      notes: 'Feeling great today!'
    }

    const invalidCheckIn = {
      mood: 6,
      energy_level: 0,
      sleep_hours: -1,
      water_intake: -5,
      exercise_minutes: -10
    }

    const validateCheckIn = (data) => {
      const errors = []
      
      if (data.mood < 1 || data.mood > 5) {
        errors.push('Mood must be between 1 and 5')
      }
      
      if (data.energy_level < 1 || data.energy_level > 5) {
        errors.push('Energy level must be between 1 and 5')
      }
      
      if (data.sleep_hours < 0 || data.sleep_hours > 24) {
        errors.push('Sleep hours must be between 0 and 24')
      }
      
      if (data.water_intake < 0) {
        errors.push('Water intake cannot be negative')
      }
      
      if (data.exercise_minutes < 0) {
        errors.push('Exercise minutes cannot be negative')
      }
      
      return errors
    }

    expect(validateCheckIn(validCheckIn)).toHaveLength(0)
    expect(validateCheckIn(invalidCheckIn).length).toBeGreaterThan(0)
  })

  it('should prevent duplicate check-ins for same date', async () => {
    const today = new Date().toISOString().split('T')[0]
    
    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { id: 'existing-checkin', date: today }, 
              error: null 
            }))
          }))
        }))
      }))
    })

    const checkExistingCheckIn = async (userId, date) => {
      const { data } = await mockSupabaseClient
        .from('daily_checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single()
      
      return data !== null
    }

    const hasExistingCheckIn = await checkExistingCheckIn('test-user-id', today)
    expect(hasExistingCheckIn).toBe(true)
  })

  it('should calculate wellness score', () => {
    const checkInData = {
      mood: 4,
      energy_level: 3,
      sleep_hours: 7.5,
      water_intake: 8,
      exercise_minutes: 30
    }

    const calculateWellnessScore = (data) => {
      const moodScore = (data.mood / 5) * 25
      const energyScore = (data.energy_level / 5) * 25
      const sleepScore = Math.min((data.sleep_hours / 8) * 25, 25)
      const waterScore = Math.min((data.water_intake / 8) * 15, 15)
      const exerciseScore = Math.min((data.exercise_minutes / 30) * 10, 10)
      
      return Math.round(moodScore + energyScore + sleepScore + waterScore + exerciseScore)
    }

    const score = calculateWellnessScore(checkInData)
    expect(score).toBe(83)
  })

  it('should generate AI feedback based on check-in', () => {
    const excellentCheckIn = {
      mood: 5,
      energy_level: 5,
      sleep_hours: 8,
      water_intake: 10,
      exercise_minutes: 45
    }

    const poorCheckIn = {
      mood: 2,
      energy_level: 1,
      sleep_hours: 4,
      water_intake: 2,
      exercise_minutes: 0
    }

    const generateAIFeedback = (data) => {
      const score = (data.mood + data.energy_level) / 2
      
      if (score >= 4) {
        return 'Excelente! Você está no caminho certo! 🌟'
      } else if (score >= 3) {
        return 'Bom progresso! Vamos continuar melhorando! 💪'
      } else {
        return 'Vamos cuidar melhor de você hoje. Pequenos passos fazem diferença! 🤗'
      }
    }

    expect(generateAIFeedback(excellentCheckIn)).toContain('Excelente')
    expect(generateAIFeedback(poorCheckIn)).toContain('Vamos cuidar')
  })

  it('should track check-in streaks', () => {
    const checkInDates = [
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-04',
      '2024-01-05'
    ]

    const calculateStreak = (dates) => {
      if (dates.length === 0) return 0
      
      dates.sort((a, b) => new Date(b) - new Date(a))
      
      let streak = 1
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1])
        const currentDate = new Date(dates[i])
        const dayDiff = (prevDate - currentDate) / (1000 * 60 * 60 * 24)
        
        if (dayDiff === 1) {
          streak++
        } else {
          break
        }
      }
      
      return streak
    }

    expect(calculateStreak(checkInDates)).toBe(5)
    expect(calculateStreak(['2024-01-01', '2024-01-03'])).toBe(1)
    expect(calculateStreak([])).toBe(0)
  })
})

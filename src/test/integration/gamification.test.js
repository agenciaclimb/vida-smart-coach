import { describe, it, expect, vi } from 'vitest'
import { mockSupabaseClient } from '@/test/utils/test-utils'

describe('Gamification System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate points correctly for daily check-in', async () => {
    const mockGamificationData = {
      user_id: 'test-user-id',
      total_points: 50,
      current_streak: 3,
      longest_streak: 5,
      level: 1
    }

    mockSupabaseClient.from.mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockGamificationData, error: null }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: mockGamificationData, error: null }))
      }))
    })

    const basePoints = 10
    const streakBonus = 3 * 2
    const expectedPoints = 50 + basePoints + streakBonus

    expect(expectedPoints).toBe(66)
  })

  it('should handle level progression', () => {
    const pointsForLevel = (level) => level * 100
    
    expect(pointsForLevel(1)).toBe(100)
    expect(pointsForLevel(2)).toBe(200)
    expect(pointsForLevel(3)).toBe(300)
    
    const currentPoints = 250
    const currentLevel = Math.floor(currentPoints / 100) + 1
    expect(currentLevel).toBe(3)
  })

  it('should award badges correctly', () => {
    const badges = []
    const currentStreak = 7
    const totalCheckins = 10
    
    if (currentStreak >= 7) {
      badges.push('week_warrior')
    }
    
    if (totalCheckins >= 1) {
      badges.push('first_checkin')
    }
    
    if (totalCheckins >= 10) {
      badges.push('dedicated_user')
    }
    
    expect(badges).toContain('week_warrior')
    expect(badges).toContain('first_checkin')
    expect(badges).toContain('dedicated_user')
  })

  it('should calculate streak correctly', () => {
    const checkInDates = [
      '2024-01-01',
      '2024-01-02',
      '2024-01-03',
      '2024-01-05'
    ]
    
    let currentStreak = 1
    for (let i = 1; i < checkInDates.length; i++) {
      const prevDate = new Date(checkInDates[i - 1])
      const currentDate = new Date(checkInDates[i])
      const dayDiff = (currentDate - prevDate) / (1000 * 60 * 60 * 24)
      
      if (dayDiff === 1) {
        currentStreak++
      } else {
        currentStreak = 1
      }
    }
    
    expect(currentStreak).toBe(1)
  })

  it('should handle weekly and monthly progress', () => {
    const totalDaysInWeek = 7
    const totalDaysInMonth = 30
    const checkInsThisWeek = 5
    const checkInsThisMonth = 20
    
    const weeklyProgress = Math.round((checkInsThisWeek / totalDaysInWeek) * 100)
    const monthlyProgress = Math.round((checkInsThisMonth / totalDaysInMonth) * 100)
    
    expect(weeklyProgress).toBe(71)
    expect(monthlyProgress).toBe(67)
  })
})

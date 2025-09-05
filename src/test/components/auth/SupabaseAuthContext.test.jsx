import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'

const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn()
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    }))
  }))
}

const mockAuthContext = {
  user: null,
  session: null,
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateUserProfile: vi.fn(),
  refetchUser: vi.fn(),
  supabase: mockSupabaseClient
}

const MockAuthProvider = ({ children }) => {
  return React.createElement(
    'div',
    { 'data-testid': 'mock-auth-provider' },
    children
  )
}

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useAuth: () => mockAuthContext,
  AuthProvider: MockAuthProvider
}))

const wrapper = ({ children }) => (
  <BrowserRouter>
    <MockAuthProvider>{children}</MockAuthProvider>
  </BrowserRouter>
)

describe('SupabaseAuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthContext.signUp = vi.fn()
    mockAuthContext.signIn = vi.fn()
    mockAuthContext.signOut = vi.fn()
    mockAuthContext.updateUserProfile = vi.fn()
  })

  it('should provide auth context', () => {
    const { result } = renderHook(() => mockAuthContext, { wrapper })
    
    expect(result.current).toBeDefined()
    expect(result.current.signUp).toBeDefined()
    expect(result.current.signIn).toBeDefined()
    expect(result.current.signOut).toBeDefined()
  })

  it('should handle signup', async () => {
    const mockSignUpResponse = {
      data: { user: { id: 'test-id', email: 'test@example.com' } },
      error: null
    }
    
    mockAuthContext.signUp.mockResolvedValue(mockSignUpResponse)

    const { result } = renderHook(() => mockAuthContext, { wrapper })
    
    await act(async () => {
      await result.current.signUp('test@example.com', 'password123', {})
    })

    expect(mockAuthContext.signUp).toHaveBeenCalledWith('test@example.com', 'password123', {})
  })

  it('should handle signin', async () => {
    const mockSignInResponse = {
      data: { 
        user: { id: 'test-id', email: 'test@example.com' },
        session: { access_token: 'token' }
      },
      error: null
    }
    
    mockAuthContext.signIn.mockResolvedValue(mockSignInResponse)

    const { result } = renderHook(() => mockAuthContext, { wrapper })
    
    await act(async () => {
      await result.current.signIn('test@example.com', 'password123')
    })

    expect(mockAuthContext.signIn).toHaveBeenCalledWith('test@example.com', 'password123')
  })

  it('should handle signout', async () => {
    mockAuthContext.signOut.mockResolvedValue({ error: null })

    const { result } = renderHook(() => mockAuthContext, { wrapper })
    
    await act(async () => {
      await result.current.signOut()
    })

    expect(mockAuthContext.signOut).toHaveBeenCalled()
  })

  it('should handle profile update', async () => {
    const mockProfile = { name: 'Updated Name', age: 30 }
    
    mockAuthContext.updateUserProfile.mockResolvedValue({ data: mockProfile, error: null })

    const { result } = renderHook(() => mockAuthContext, { wrapper })
    
    await act(async () => {
      await result.current.updateUserProfile(mockProfile)
    })

    expect(mockAuthContext.updateUserProfile).toHaveBeenCalledWith(mockProfile)
  })
})

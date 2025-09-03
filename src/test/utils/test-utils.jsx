import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Tabs } from '@/components/ui/tabs'
import { vi } from 'vitest'

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

vi.mock('@/core/supabase', () => ({
  supabase: mockSupabaseClient
}))

vi.mock('@/lib/customSupabaseClient', () => ({
  supabase: mockSupabaseClient
}))

const MockAuthContext = React.createContext({
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    profile: {
      id: 'test-user-id',
      role: 'client',
      name: 'Test User'
    }
  },
  session: { access_token: 'mock-token' },
  loading: false,
  signUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  updateUserProfile: vi.fn(),
  refetchUser: vi.fn(),
  supabase: mockSupabaseClient
})

const MockAuthProvider = ({ children }) => {
  const mockAuthValue = {
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      profile: {
        id: 'test-user-id',
        role: 'client',
        name: 'Test User'
      }
    },
    session: { access_token: 'mock-token' },
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateUserProfile: vi.fn(),
    refetchUser: vi.fn(),
    supabase: mockSupabaseClient
  }

  return (
    <MockAuthContext.Provider value={mockAuthValue}>
      {children}
    </MockAuthContext.Provider>
  )
}

const MockChatProvider = ({ children }) => {
  const mockChatValue = {
    messages: [],
    loading: false,
    sendMessage: vi.fn(),
    fetchMessages: vi.fn(),
    refetchMessages: vi.fn(),
    addMessage: vi.fn()
  }

  return React.createElement(
    'div',
    { 'data-testid': 'mock-chat-provider' },
    children
  )
}

const MockAdminProvider = ({ children }) => {
  const mockAdminValue = {
    appSettings: {
      ai_system_prompt_full: 'Test AI prompt configuration'
    },
    loadingAppSettings: false,
    updateAppSettings: vi.fn()
  }

  return React.createElement(
    'div',
    { 'data-testid': 'mock-admin-provider' },
    children
  )
}

const AllTheProviders = ({ children, tabValue = "chat" }) => {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <TooltipProvider>
          <MockAuthProvider>
            <MockChatProvider>
              <MockAdminProvider>
                <Tabs value={tabValue} defaultValue={tabValue}>
                  {children}
                </Tabs>
              </MockAdminProvider>
            </MockChatProvider>
          </MockAuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </HelmetProvider>
  )
}

const customRender = (ui, options = {}) => {
  const { tabValue, ...renderOptions } = options
  const Wrapper = ({ children }) => <AllTheProviders tabValue={tabValue}>{children}</AllTheProviders>
  return render(ui, { wrapper: Wrapper, ...renderOptions })
}

vi.mock('@/contexts/SupabaseAuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      profile: {
        id: 'test-user-id',
        role: 'client',
        name: 'Test User'
      }
    },
    session: { access_token: 'mock-token' },
    loading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateUserProfile: vi.fn(),
    refetchUser: vi.fn(),
    supabase: mockSupabaseClient
  }),
  AuthProvider: ({ children }) => children
}))

const mockChatContextValue = {
  messages: [],
  loading: false,
  sendMessage: vi.fn(),
  fetchMessages: vi.fn(),
  refetchMessages: vi.fn(),
  addMessage: vi.fn()
}

vi.mock('@/contexts/data/ChatContext', () => ({
  useChat: () => mockChatContextValue,
  ChatProvider: ({ children }) => children
}))

export { mockChatContextValue }

const mockAdminContextValue = {
  appSettings: {
    ai_system_prompt_full: 'Test AI prompt configuration'
  },
  loadingAppSettings: false,
  updateAppSettings: vi.fn()
}

vi.mock('@/contexts/data/AdminContext', () => ({
  useAdmin: () => mockAdminContextValue,
  AdminProvider: ({ children }) => children
}))

export { mockAdminContextValue }

export * from '@testing-library/react'
export { customRender as render }
export { mockSupabaseClient }

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, mockChatContextValue } from '@/test/utils/test-utils'
import ChatTab from '@/components/client/ChatTab'

describe('ChatTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChatContextValue.messages = []
    mockChatContextValue.loading = false
    mockChatContextValue.sendMessage = vi.fn()
    mockChatContextValue.fetchMessages = vi.fn()
    mockChatContextValue.refetchMessages = vi.fn()
    mockChatContextValue.addMessage = vi.fn()
  })
  it('should render chat interface', () => {
    render(<ChatTab />, { tabValue: "chat" })
    
    expect(screen.getByText('Sua IA Coach')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Digite sua mensagem...')).toBeInTheDocument()
  })

  it('should display messages', () => {
    render(<ChatTab />, { tabValue: "chat" })
    
    expect(screen.getByText('Comece uma conversa com sua IA Coach!')).toBeInTheDocument()
  })

  it('should handle message sending', async () => {
    render(<ChatTab />, { tabValue: "chat" })
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    const sendButton = screen.getByRole('button')
    
    fireEvent.change(input, { target: { value: 'Test message' } })
    fireEvent.click(sendButton)
    
    await waitFor(() => {
      expect(mockChatContextValue.sendMessage).toHaveBeenCalledWith('Test message', expect.objectContaining({
        id: 'test-user-id',
        role: 'client',
        name: 'Test User'
      }))
    })
  })

  it('should show empty state when no messages', () => {
    mockChatContextValue.messages = []
    
    render(<ChatTab />, { tabValue: "chat" })
    
    expect(screen.getByText('Comece uma conversa com sua IA Coach!')).toBeInTheDocument()
  })

  it('should show loading state', () => {
    mockChatContextValue.loading = true
    
    render(<ChatTab />, { tabValue: "chat" })
    
    expect(screen.getByText('Digitando...')).toBeInTheDocument()
  })

  it('should disable input during loading', () => {
    mockChatContextValue.loading = true
    
    render(<ChatTab />, { tabValue: "chat" })
    
    const input = screen.getByPlaceholderText('Digite sua mensagem...')
    expect(input).toBeDisabled()
  })
})

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, mockAdminContextValue } from '@/test/utils/test-utils'
import AiConfigTab from '@/components/admin/AiConfigTab'

describe('AiConfigTab', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAdminContextValue.appSettings = {
      ai_system_prompt_full: 'Test AI prompt configuration'
    }
    mockAdminContextValue.loadingAppSettings = false
    mockAdminContextValue.updateAppSettings = vi.fn()
  })
  it('should render AI configuration interface', () => {
    render(<AiConfigTab />, { tabValue: "ai-config" })
    
    expect(screen.getByText('Configuração da IA')).toBeInTheDocument()
    expect(screen.getByText('Comportamento e Prompt do Sistema')).toBeInTheDocument()
    expect(screen.getByLabelText(/Prompt Principal do Sistema/)).toBeInTheDocument()
  })

  it('should display current AI prompt', () => {
    render(<AiConfigTab />, { tabValue: "ai-config" })
    
    const textarea = screen.getByLabelText(/Prompt Principal do Sistema/)
    expect(textarea.value).toBe('Test AI prompt configuration')
  })

  it('should handle prompt updates', async () => {
    render(<AiConfigTab />, { tabValue: "ai-config" })
    
    const textarea = screen.getByLabelText(/Prompt Principal do Sistema/)
    const saveButton = screen.getByText('Salvar Configurações da IA')
    
    fireEvent.change(textarea, { target: { value: 'Updated AI prompt' } })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockAdminContextValue.updateAppSettings).toHaveBeenCalledWith({
        ai_system_prompt_full: 'Updated AI prompt'
      })
    })
  })

  it('should show loading state', () => {
    mockAdminContextValue.loadingAppSettings = true
    mockAdminContextValue.appSettings = null
    
    render(<AiConfigTab />, { tabValue: "ai-config" })
    
    const loader = screen.getByRole('tabpanel').querySelector('.animate-spin')
    expect(loader).toBeInTheDocument()
    expect(loader).toHaveClass('animate-spin', 'text-primary')
  })

  it('should use default prompt when no settings', () => {
    mockAdminContextValue.loadingAppSettings = false
    mockAdminContextValue.appSettings = { ai_system_prompt_full: null }
    
    render(<AiConfigTab />, { tabValue: "ai-config" })
    
    const textarea = screen.getByLabelText(/Prompt Principal do Sistema/)
    expect(textarea.value).toContain('IDENTIDADE E PERSONALIDADE DA IA: VIDA SMART COACH')
  })

  it('should disable save button during saving', async () => {
    render(<AiConfigTab />, { tabValue: "ai-config" })
    
    const saveButton = screen.getByText('Salvar Configurações da IA')
    
    fireEvent.click(saveButton)
    
    expect(saveButton).toBeDisabled()
  })
})

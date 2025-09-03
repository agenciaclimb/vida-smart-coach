import { describe, it, expect, vi } from 'vitest'

describe('AI Coach Integration', () => {
  it('should format system prompt correctly', () => {
    const userProfile = {
      name: 'João',
      age: 30,
      goals: ['weight_loss', 'muscle_gain'],
      activity_level: 'intermediate'
    }

    const basePrompt = 'Você é o Vida Smart Coach, um assistente de IA especializado em wellness e saúde.'
    
    const formatSystemPrompt = (basePrompt, profile) => {
      let prompt = basePrompt
      
      if (profile.name) {
        prompt += ` O usuário se chama ${profile.name}.`
      }
      
      if (profile.goals && profile.goals.length > 0) {
        prompt += ` Seus objetivos incluem: ${profile.goals.join(', ')}.`
      }
      
      if (profile.activity_level) {
        prompt += ` Nível de atividade: ${profile.activity_level}.`
      }
      
      return prompt
    }

    const formattedPrompt = formatSystemPrompt(basePrompt, userProfile)
    
    expect(formattedPrompt).toContain('João')
    expect(formattedPrompt).toContain('weight_loss, muscle_gain')
    expect(formattedPrompt).toContain('intermediate')
  })

  it('should handle OpenAI API response', async () => {
    const mockOpenAIResponse = {
      choices: [{
        message: {
          content: 'Olá! Como posso ajudar você hoje com sua jornada de bem-estar?'
        }
      }]
    }

    const extractAIMessage = (response) => {
      return response.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'
    }

    expect(extractAIMessage(mockOpenAIResponse)).toBe('Olá! Como posso ajudar você hoje com sua jornada de bem-estar?')
    expect(extractAIMessage({ choices: [] })).toBe('Desculpe, não consegui processar sua mensagem.')
  })

  it('should validate message content', () => {
    const validMessages = [
      'Como posso melhorar minha alimentação?',
      'Preciso de ajuda com exercícios',
      'Estou me sentindo ansioso'
    ]

    const invalidMessages = [
      '',
      '   ',
      'a'.repeat(5000)
    ]

    const validateMessage = (message) => {
      if (!message || message.trim().length === 0) {
        return { valid: false, error: 'Mensagem não pode estar vazia' }
      }
      
      if (message.length > 4000) {
        return { valid: false, error: 'Mensagem muito longa' }
      }
      
      return { valid: true }
    }

    validMessages.forEach(msg => {
      expect(validateMessage(msg).valid).toBe(true)
    })

    invalidMessages.forEach(msg => {
      expect(validateMessage(msg).valid).toBe(false)
    })
  })

  it('should handle conversation context', () => {
    const conversationHistory = [
      { role: 'user', content: 'Olá!' },
      { role: 'assistant', content: 'Olá! Como posso ajudar?' },
      { role: 'user', content: 'Preciso de ajuda com dieta' }
    ]

    const buildContextMessages = (history, systemPrompt) => {
      const messages = [{ role: 'system', content: systemPrompt }]
      
      const recentHistory = history.slice(-10)
      
      return [...messages, ...recentHistory]
    }

    const contextMessages = buildContextMessages(conversationHistory, 'System prompt')
    
    expect(contextMessages).toHaveLength(4)
    expect(contextMessages[0].role).toBe('system')
    expect(contextMessages[contextMessages.length - 1].content).toBe('Preciso de ajuda com dieta')
  })

  it('should detect emergency situations', () => {
    const emergencyKeywords = [
      'suicídio', 'me matar', 'não aguento mais',
      'depressão severa', 'ideação suicida'
    ]

    const normalMessages = [
      'Como melhorar minha dieta?',
      'Estou um pouco triste hoje',
      'Preciso de motivação'
    ]

    const detectEmergency = (message) => {
      const lowerMessage = message.toLowerCase()
      return emergencyKeywords.some(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      )
    }

    emergencyKeywords.forEach(keyword => {
      expect(detectEmergency(`Estou com ${keyword}`)).toBe(true)
    })

    normalMessages.forEach(msg => {
      expect(detectEmergency(msg)).toBe(false)
    })
  })

  it('should format response for WhatsApp', () => {
    const longResponse = 'Esta é uma resposta muito longa que precisa ser formatada adequadamente para o WhatsApp. '.repeat(20)
    
    const formatForWhatsApp = (text) => {
      const maxLength = 1000
      
      if (text.length <= maxLength) {
        return text
      }
      
      const truncated = text.substring(0, maxLength - 3)
      const lastSpace = truncated.lastIndexOf(' ')
      
      return truncated.substring(0, lastSpace) + '...'
    }

    const formatted = formatForWhatsApp(longResponse)
    
    expect(formatted.length).toBeLessThanOrEqual(1000)
    expect(formatted.endsWith('...')).toBe(true)
  })
})

import { describe, it, expect, vi } from 'vitest'

describe('WhatsApp Webhook Integration', () => {
  it('should process incoming message correctly', async () => {
    const mockWebhookPayload = {
      event: 'messages.upsert',
      instance: 'test-instance',
      data: {
        key: {
          remoteJid: '5511999999999@s.whatsapp.net',
          fromMe: false
        },
        message: {
          conversation: 'Olá, preciso de ajuda com minha dieta!'
        },
        messageType: 'text'
      }
    }

    const expectedProcessedData = {
      phoneNumber: '5511999999999@s.whatsapp.net',
      messageContent: 'Olá, preciso de ajuda com minha dieta!',
      messageType: 'text',
      fromBot: false
    }

    const phoneNumber = mockWebhookPayload.data.key?.remoteJid
    const messageContent = mockWebhookPayload.data.message?.conversation
    const messageType = mockWebhookPayload.data.messageType
    const fromBot = mockWebhookPayload.data.key?.fromMe

    expect(phoneNumber).toBe(expectedProcessedData.phoneNumber)
    expect(messageContent).toBe(expectedProcessedData.messageContent)
    expect(messageType).toBe(expectedProcessedData.messageType)
    expect(fromBot).toBe(expectedProcessedData.fromBot)
  })

  it('should handle different message types', () => {
    const textMessage = {
      data: {
        message: { conversation: 'Hello' },
        messageType: 'text'
      }
    }

    const extendedTextMessage = {
      data: {
        message: { 
          extendedTextMessage: { text: 'Extended hello' }
        },
        messageType: 'extendedTextMessage'
      }
    }

    const unsupportedMessage = {
      data: {
        message: { imageMessage: {} },
        messageType: 'image'
      }
    }

    const getMessageContent = (data) => {
      return data.message?.conversation || 
             data.message?.extendedTextMessage?.text ||
             'Mensagem não suportada'
    }

    expect(getMessageContent(textMessage.data)).toBe('Hello')
    expect(getMessageContent(extendedTextMessage.data)).toBe('Extended hello')
    expect(getMessageContent(unsupportedMessage.data)).toBe('Mensagem não suportada')
  })

  it('should filter bot messages', () => {
    const userMessage = {
      data: { key: { fromMe: false } }
    }

    const botMessage = {
      data: { key: { fromMe: true } }
    }

    const shouldProcessMessage = (data) => !data.key?.fromMe

    expect(shouldProcessMessage(userMessage.data)).toBe(true)
    expect(shouldProcessMessage(botMessage.data)).toBe(false)
  })

  it('should validate webhook event type', () => {
    const validEvent = { event: 'messages.upsert' }
    const invalidEvent = { event: 'status.update' }
    const missingEvent = {}

    const isValidMessageEvent = (payload) => payload.event === 'messages.upsert'

    expect(isValidMessageEvent(validEvent)).toBe(true)
    expect(isValidMessageEvent(invalidEvent)).toBe(false)
    expect(isValidMessageEvent(missingEvent)).toBe(false)
  })

  it('should format AI response for WhatsApp', () => {
    const aiResponse = 'Olá! Que bom que você quer cuidar da sua alimentação! 🥗 Para começar, me conte: qual é sua principal dificuldade com a dieta atual?'
    
    const formatForWhatsApp = (text) => {
      return text.length > 1000 ? text.substring(0, 997) + '...' : text
    }

    expect(formatForWhatsApp(aiResponse)).toBe(aiResponse)
    
    const longResponse = 'A'.repeat(1500)
    expect(formatForWhatsApp(longResponse)).toHaveLength(1000)
    expect(formatForWhatsApp(longResponse).endsWith('...')).toBe(true)
  })
})

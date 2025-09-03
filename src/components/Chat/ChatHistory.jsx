import React, { useState, useEffect } from 'react'
import { supabase } from '../../core/supabase'

export default function ChatHistory() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user?.user?.phone) return

      const { data } = await supabase.functions.invoke('get-conversation-history', {
        body: { phone_number: user.user.phone }
      })

      setConversations(data.conversations)
    } catch (error) {
      console.error('Erro ao carregar conversas:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div>Carregando conversas...</div>

  return (
    <div className="chat-history">
      <h2>Histórico de Conversas com Vida</h2>
      <div className="messages-container">
        {conversations.map(msg => (
          <div 
            key={msg.id} 
            className={`message ${msg.message_type === 'user' ? 'user-message' : 'assistant-message'}`}
          >
            <div className="message-content">
              {msg.message_content}
            </div>
            <div className="message-time">
              {new Date(msg.created_at).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

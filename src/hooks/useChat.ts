'use client'

import { useState, useCallback } from 'react'
import { API_ENDPOINTS } from '@/lib/constants'
import type { ChatMessage, ChatResponse } from '@/types'

export interface ChatError {
  message: string
  sessionId?: string
  sessionState?: string
  currentAgent?: string
  data?: any
}

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionState, setSessionState] = useState<string>('intake')
  const [currentAgent, setCurrentAgent] = useState<string>('intake')
  const [error, setError] = useState<string | null>(null)

  const sendMessage = useCallback(async (content: string, userId?: string) => {
    if (!content.trim()) return

    setIsLoading(true)
    setError(null)

    // Add user message immediately
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      content: content.trim(),
      role: 'user',
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])

    try {
      const requestBody = {
        message: content.trim(),
        sessionId: sessionId || undefined,
        userId: userId || undefined,
        sessionState: sessionState
      }

      console.log('Sending request to coach endpoint:', requestBody)

      const response = await fetch(API_ENDPOINTS.COACH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data: ChatResponse = await response.json()
      
      console.log('Received response from coach endpoint:', data)

      // Update session state
      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId)
      }
      
      if (data.sessionState !== sessionState) {
        setSessionState(data.sessionState)
      }

      if (data.currentAgent !== currentAgent) {
        setCurrentAgent(data.currentAgent)
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        content: data.message,
        role: 'assistant',
        timestamp: new Date(),
        agent: data.currentAgent,
        sessionState: data.sessionState
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (err) {
      console.error('Error sending message:', err)
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)

      // Add error message to chat
      const errorChatMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
        role: 'assistant',
        timestamp: new Date(),
        agent: 'system'
      }

      setMessages(prev => [...prev, errorChatMessage])
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, sessionState, currentAgent])

  const clearChat = useCallback(() => {
    setMessages([])
    setSessionId(null)
    setSessionState('intake')
    setCurrentAgent('intake')
    setError(null)
  }, [])

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user')
    if (lastUserMessage && !isLoading) {
      // Remove the last assistant message (likely an error)
      setMessages(prev => prev.filter((_, index) => index !== prev.length - 1))
      sendMessage(lastUserMessage.content)
    }
  }, [messages, isLoading, sendMessage])

  return {
    messages,
    isLoading,
    sessionId,
    sessionState,
    currentAgent,
    error,
    sendMessage,
    clearChat,
    retryLastMessage
  }
}

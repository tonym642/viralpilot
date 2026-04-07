'use client'

import { useState, useRef, useEffect } from 'react'

type Message = {
  id: string
  role: string
  content: string
  created_at: string
}

export default function ProjectChat({
  projectId,
  initialMessages,
}: {
  projectId: string
  initialMessages: Message[]
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: trimmed,
      created_at: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/project-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, message: trimmed }),
      })

      const data = await res.json()

      if (data.success) {
        const assistantMsg: Message = {
          id: `temp-${Date.now()}-reply`,
          role: 'assistant',
          content: data.reply,
          created_at: new Date().toISOString(),
        }
        setMessages((prev) => [...prev, assistantMsg])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}-err`,
            role: 'assistant',
            content: 'Sorry, something went wrong. Please try again.',
            created_at: new Date().toISOString(),
          },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}-err`,
          role: 'assistant',
          content: 'Network error. Please try again.',
          created_at: new Date().toISOString(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="muted" style={{ margin: 'auto 0', fontSize: '12px', textAlign: 'center' }}>
            Start a conversation with ViralPilot
          </p>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`chat-msg-row ${msg.role}`}>
            <span className="chat-msg-label">
              {msg.role === 'user' ? 'You' : 'ViralPilot'}
            </span>
            <div
              className={
                msg.role === 'user'
                  ? 'chat-bubble-user'
                  : 'chat-bubble-assistant'
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-thinking">ViralPilot is thinking...</div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="chat-input-area">
        <div className="chat-input-row">
          <span className="chat-input-prefix">+</span>
          <input
            type="text"
            placeholder="Add an idea, ask a question, or give direction..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <button
            className={`chat-send-icon${input.trim() ? ' active' : ''}`}
            onClick={handleSend}
            disabled={loading || !input.trim()}
          >
            ↑
          </button>
        </div>
      </div>
    </>
  )
}

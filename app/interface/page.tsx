'use client'

import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/ui/Navbaruser'
import Footer from '../../components/ui/Footer'
import styles from './../../components/styles/essaie.module.css'

type Message = {
  id: string
  role: 'user' | 'bot'
  content: string
}

const USER_KEY = 'userKey'
const CONVERSATION_ID_KEY = 'conversationId'

export default function PromptPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [userKey, setUserKey] = useState<string | null>(null)
  const [isTyping, setIsTyping] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Charger userKey et conversationId depuis localStorage
  useEffect(() => {
    const storedUserKey = localStorage.getItem(USER_KEY)
    if (storedUserKey) setUserKey(storedUserKey)
    const storedConvId = localStorage.getItem(CONVERSATION_ID_KEY)
    if (storedConvId) setConversationId(storedConvId)
  }, [])

  useEffect(() => {
    if (conversationId) localStorage.setItem(CONVERSATION_ID_KEY, conversationId)
  }, [conversationId])

  useEffect(() => {
    if (userKey) localStorage.setItem(USER_KEY, userKey)
  }, [userKey])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [input])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Envoyer un message
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    let convId = conversationId

    if (!convId) {
      try {
        const res = await fetch('/api/botpress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userKey }),
        })
        if (!res.ok) throw new Error('Erreur création conversation')
        const data: { conversationId: string } = await res.json()
        convId = data.conversationId
        setConversationId(convId)
        setMessages([])
      } catch (error) {
        console.error('Erreur création conversation:', error)
        return
      }
    }

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/botpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, conversationId: convId, userKey }),
      })
      if (!res.ok) throw new Error('Erreur envoi message')
      const data = await res.json()

      if (data.userKey && data.userKey !== userKey) setUserKey(data.userKey)
      if (data.conversationId && data.conversationId !== convId) setConversationId(data.conversationId)

      const botMessage: Message = { id: crypto.randomUUID(), role: 'bot', content: data.reply || 'Bot did not respond.' }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Erreur envoi message:', error)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', content: 'Erreur de communication avec le bot.' }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <>
      <Navbar />
      <main style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', padding: '1rem' }}>
        <div
          className={styles.chatBox}
          style={{ overflowY: 'auto', flexGrow: 1, border: '1px solid #ccc', borderRadius: 4, padding: '1rem' }}
        >
          {messages.map(m => (
            <div key={m.id} className={styles.message}>
              <div className={styles.role}>{m.role.charAt(0).toUpperCase() + m.role.slice(1)}</div>
              <p>{m.content}</p>
            </div>
          ))}
          {isTyping && (
            <div className={styles.message}>
              <div className={styles.role}>Bot</div>
              <p>...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className={styles.form} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Que voulez-vous apprendre..."
            className={styles.textarea}
            rows={1}
            style={{ flexGrow: 1, resize: 'none' }}
          />
          <button type="submit" className={styles.sendButton} disabled={isTyping || !input.trim()} aria-label="Envoyer" style={{ flexShrink: 0 }}>
            ➤
          </button>
        </form>
      </main>
      <Footer />
    </>
  )
}

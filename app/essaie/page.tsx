'use client'

import { useEffect, useState, useRef } from 'react'
import Navbar from '../../components/ui/NavbarEss'
import Footer from '../../components/ui/Footer'
import styles from './../../components/styles/essaie.module.css'

const MAX_ATTEMPTS = 3
const STORAGE_KEY = 'promptLimit'
const USER_KEY = 'userKey'
const CONVERSATION_ID_KEY = 'conversationId'

type Message = {
  id: string
  role: 'user' | 'bot'
  content: string
}

export default function PromptPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [showPopup, setShowPopup] = useState(false)
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

  // Sauvegarder conversationId et userKey dans localStorage à chaque mise à jour
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

  // Gestion du compteur de tentatives par jour
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const savedData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    if (savedData.date === today) {
      setAttempts(savedData.attempts || 0)
      if ((savedData.attempts || 0) >= MAX_ATTEMPTS) setShowPopup(true)
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, attempts: 0 }))
      setAttempts(0)
      setShowPopup(false)
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return
    if (attempts >= MAX_ATTEMPTS) {
      setShowPopup(true)
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const newAttempts = attempts + 1
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, attempts: newAttempts }))
    setAttempts(newAttempts)

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsTyping(true)

    try {
      const res = await fetch('/api/botpress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage.content, conversationId, userKey }),
      })
      const data = await res.json()
      console.log('Réponse API Botpress:', data)

      if (data.userKey && data.userKey !== userKey) setUserKey(data.userKey)
      if (data.conversationId && data.conversationId !== conversationId) setConversationId(data.conversationId)

      const botMessage: Message = { id: crypto.randomUUID(), role: 'bot', content: data.reply || 'Bot did not respond.' }
      setMessages(prev => [...prev, botMessage])
    } catch (err) {
      console.error('Error contacting bot:', err)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'bot', content: 'Erreur de communication avec le bot.' }])
    } finally {
      setIsTyping(false)
    }

    if (newAttempts >= MAX_ATTEMPTS) setShowPopup(true)
  }

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.chatBox} style={{ overflowY: 'auto', maxHeight: '400px' }}>
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
          <form onSubmit={handleSubmit} className={styles.form}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Que voulez-vous apprendre..."
              className={styles.textarea}
              rows={1}
              disabled={showPopup}
            />
            <button type="submit" className={styles.sendButton} aria-label="Envoyer" disabled={showPopup}>
              ➤
            </button>
          </form>
        </div>
        {showPopup && (
          <div className={styles.popupOverlay}>
            <div className={styles.popup}>
              <h2>Limite de tentatives atteinte</h2>
              <p>Vous avez épuisé vos {MAX_ATTEMPTS} tentatives pour aujourd’hui.</p>
              <div className={styles.popupButtons}>
                <a href="/connexion" className={styles.popupButtonPrimary}>
                  Se connecter
                </a>
                <a href="/inscription" className={styles.popupButtonSecondary}>
                  Créer un compte
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}

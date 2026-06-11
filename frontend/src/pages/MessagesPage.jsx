import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ScratchCard from '../components/ScratchCard'
import toast from 'react-hot-toast'
import styles from './MessagesPage.module.css'

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* Modal de raspar — via portal para ficar acima de tudo */
function ScratchModal({ message, onClose, onRevealed }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', fn)
    return () => document.removeEventListener('keydown', fn)
  }, [onClose])

  return createPortal(
    <motion.div className={styles.scratchOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className={styles.scratchModal}
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}>
        <div className={styles.scratchHeader}>
          <h3>💌 Mensagem de carinho</h3>
          <motion.button className="btn btn-ghost" onClick={onClose}
            whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>✕</motion.button>
        </div>
        <p className={styles.scratchHint}>
          Raspe com o mouse (ou dedo) para revelar a mensagem 💕
        </p>
        <div className={styles.scratchWrap}>
          <ScratchCard key={message.id} message={message} onRevealed={(revealedMsg) => onRevealed(message.id, revealedMsg)} />
        </div>
        <p className={styles.scratchFrom}>— {message.author_name}</p>
      </motion.div>
    </motion.div>,
    document.body
  )
}

export default function MessagesPage() {
  const { user } = useAuth()
  const [messages, setMessages]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [partnerName, setPartnerName] = useState('seu amor')
  const [text, setText]           = useState('')
  const [saving, setSaving]       = useState(false)
  const [scratching, setScratching] = useState(null)

  // Fetch partner name
  useEffect(() => {
    api.get('/api/auth/users/')
      .then(({ data }) => {
        const partner = data.find(u => u.id !== user?.id)
        if (partner) setPartnerName(partner.name.split(' ')[0])
      })
      .catch(() => {})
  }, [user?.id]) // message to scratch

  const fetchMessages = useCallback(async () => {
    try {
      const { data } = await api.get('/api/messages/')
      setMessages(data)
    } catch { toast.error('Erro ao carregar mensagens.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchMessages() }, [fetchMessages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSaving(true)
    try {
      const { data } = await api.post('/api/messages/', { content: text.trim() })
      setMessages(prev => [data, ...prev])
      setText('')
      toast.success('Mensagem enviada! 💌')
    } catch { toast.error('Erro ao enviar mensagem.') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!window.confirm('Apagar esta mensagem?')) return
    try {
      await api.delete(`/api/messages/${id}/`)
      setMessages(prev => prev.filter(m => m.id !== id))
      toast.success('Mensagem apagada.')
    } catch { toast.error('Sem permissão para apagar.') }
  }

  function handleRevealed(id, revealedMsg) {
    // Update the specific message in state with the now-visible content
    setMessages(prev => prev.map(m => m.id === id ? { ...m, ...revealedMsg } : m))
    setScratching(null)
  }

  // Is this message hidden for the current user?
  // Hidden = content is null AND the current user is NOT the author
  function isHidden(msg) {
    return msg.content === null && msg.author_id !== user?.id
  }

  // Is the current user the author?
  function isAuthor(msg) {
    return msg.author_id === user?.id
  }

  return (
    <div className="page-container">
      <div className={styles.header}>
        <h1 className={styles.title}>💌 Mensagens de Carinho</h1>
        <p className={styles.subtitle}>
          Olá, <strong>{user?.name?.split(' ')[0] || user?.username}</strong>!
          Escreva uma mensagem especial para <strong>{partnerName}</strong> descobrir 💕
        </p>
      </div>

      {/* Compose */}
      <motion.form className={styles.compose} onSubmit={handleSend}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <textarea
          className={styles.textarea}
          placeholder="Escreva sua mensagem de carinho... 💕"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={1000}
          rows={4}
        />
        <div className={styles.composeFooter}>
          <span className={styles.charCount}>{text.length}/1000</span>
          <motion.button type="submit" className="btn btn-primary"
            disabled={saving || !text.trim()}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            {saving ? 'Enviando…' : '💌 Enviar mensagem'}
          </motion.button>
        </div>
      </motion.form>

      {/* List */}
      {loading ? (
        <div className={styles.skeletonList}>
          {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height:100, borderRadius:'var(--radius)' }} />)}
        </div>
      ) : messages.length === 0 ? (
        <div className={styles.empty}>
          <span>💌</span>
          <p>Nenhuma mensagem ainda. Seja o primeiro a escrever!</p>
        </div>
      ) : (
        <div className={styles.list}>
          <AnimatePresence>
            {messages.map((msg, i) => {
              const hidden = isHidden(msg)
              const author = isAuthor(msg)

              return (
                <motion.div
                  key={msg.id}
                  className={`${styles.card} ${msg.is_revealed ? styles.revealed : ''} ${hidden ? styles.locked : ''}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04 }}
                  layout
                >
                  <div className={styles.cardTop}>
                    <span className={styles.author}>{msg.author_name}</span>
                    <span className={styles.date}>{fmtDate(msg.created_at)}</span>
                  </div>

                  {/* Content or locked placeholder */}
                  {hidden ? (
                    <div className={styles.lockedBox}>
                      <span className={styles.lockIcon}>🔒</span>
                      <p className={styles.lockedHint}>Esta mensagem ainda não foi revelada</p>
                      <motion.button
                        className="btn btn-primary"
                        onClick={() => setScratching(msg)}
                        whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                        style={{ marginTop: 8 }}
                      >
                        Raspar e revelar
                      </motion.button>
                    </div>
                  ) : (
                    <p className={styles.content}>{msg.content}</p>
                  )}
                  <div className={styles.cardBottom}>
                    {msg.is_revealed
                      ? <span className={styles.revealedBadge}>✅ Revelada</span>
                      : <span className={styles.pendingBadge}>🔒 Aguardando revelação</span>}
                    {author && (
                      <motion.button className={styles.deleteBtn} onClick={() => handleDelete(msg.id)}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                          <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Scratch modal */}
      <AnimatePresence>
        {scratching && (
          <ScratchModal
            message={scratching}
            onClose={() => setScratching(null)}
            onRevealed={handleRevealed}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

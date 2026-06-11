import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import ScratchCard from './ScratchCard'
import styles from './MessageWidget.module.css'

function Modal({ message, onClose, onRevealed }) {
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <AnimatePresence>
      <motion.div
        className={styles.overlay}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={e => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          className={styles.modal}
          initial={{ opacity: 0, scale: 0.9, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
        >
          <div className={styles.modalHeader}>
            <h3>💌 Mensagem de carinho</h3>
            <motion.button className="btn btn-ghost" onClick={onClose}
              whileHover={{ rotate: 90 }} whileTap={{ scale: 0.9 }}>✕</motion.button>
          </div>
          <p className={styles.modalHint}>
            {message.is_revealed
              ? 'Esta mensagem já foi revelada 💕'
              : 'Use o mouse (ou o dedo) para raspar o borrão e revelar a mensagem 💕'}
          </p>
          <div className={styles.scratchWrap}>
            <ScratchCard key={message.id} message={message} onRevealed={onRevealed} />
          </div>
          <p className={styles.from}>— {message.author_name}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default function MessageWidget() {
  const { user } = useAuth()
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen]       = useState(false)

  useEffect(() => {
    api.get('/api/messages/latest/')
      .then(({ data }) => setMessage(data || null))
      .catch(() => setMessage(null))
      .finally(() => setLoading(false))
  }, [])

  function handleRevealed(revealedMsg) {
    setMessage(revealedMsg || (prev => prev ? { ...prev, is_revealed: true } : prev))
  }

  if (loading) return (
    <div className="skeleton" style={{ height: 160, borderRadius: 'var(--radius-lg)', width: '100%' }} />
  )

  if (!message) return (
    <div className={styles.empty}>
      <span>💌</span>
      <p>Nenhuma mensagem ainda</p>
    </div>
  )

  // Badge only for recipient (not the author) with unrevealed message
  const isRecipient = message.author_id !== user?.id
  const hasNew = isRecipient && !message.is_revealed

  return (
    <>
      <motion.button
        className={styles.teaser}
        onClick={() => setOpen(true)}
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Revelar mensagem"
      >
        <div className={styles.teaserTop}>
          <span className={styles.badge}>💌 Mensagem misteriosa</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {hasNew && (
              <motion.span
                className={styles.newBadge}
                animate={{ scale: [1, 1.15, 1], opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              >
                🔔 Nova mensagem!
              </motion.span>
            )}
            {message.is_revealed && <span className={styles.revealedTag}>Revelada ✅</span>}
          </div>
        </div>
        <p className={styles.blurredText}>{message.content || '••••••••••••••••••'}</p>
        <span className={styles.hint}>
          {hasNew ? '✨ Toque para revelar agora' : 'Clique para visualizar'}
        </span>
      </motion.button>

      {open && (
        <Modal
          message={message}
          onClose={() => setOpen(false)}
          onRevealed={handleRevealed}
        />
      )}
    </>
  )
}

import { useState } from 'react'
import styles from './CompleteModal.module.css'

export default function CompleteModal({ eventTitle, onConfirm, onClose }) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onConfirm({ rating: rating || null, completion_note: note.trim() })
    } finally {
      setSaving(false)
    }
  }

  const display = hovered || rating

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.header}>
          <h2>Concluir compromisso</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <p className={styles.subtitle}>
          Como foi <strong>{eventTitle}</strong>?
        </p>

        <form onSubmit={handleSubmit} noValidate>
          {/* Star rating */}
          <div className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.star} ${n <= display ? styles.starFilled : ''}`}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating((prev) => (prev === n ? 0 : n))}
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
            ))}
            <span className={styles.ratingLabel}>
              {display === 0 && 'Sem avaliação'}
              {display === 1 && 'Horrível 😞'}
              {display === 2 && 'Ruim 😕'}
              {display === 3 && 'Ok 😐'}
              {display === 4 && 'Bom 😊'}
              {display === 5 && 'Incrível 🥰'}
            </span>
          </div>

          {/* Note */}
          <div className="field" style={{ marginTop: 20 }}>
            <label htmlFor="comp-note">Observação</label>
            <textarea
              id="comp-note"
              rows={3}
              maxLength={500}
              placeholder="Como foi? O que aconteceu? (opcional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <span className={styles.charCount}>{note.length}/500</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : '✅ Concluir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

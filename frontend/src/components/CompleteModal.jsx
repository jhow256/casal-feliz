import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import styles from './CompleteModal.module.css'

const overlayV = { hidden:{opacity:0}, show:{opacity:1}, exit:{opacity:0} }
const modalV   = {
  hidden: { opacity:0, scale:0.92, y:24 },
  show:   { opacity:1, scale:1, y:0, transition:{type:'spring',stiffness:320,damping:28} },
  exit:   { opacity:0, scale:0.94, y:16, transition:{duration:0.18} },
}

const MAX_PHOTOS = 3
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export default function CompleteModal({ eventTitle, onConfirm, onClose }) {
  const [rating, setRating]   = useState(0)
  const [hovered, setHovered] = useState(0)
  const [note, setNote]       = useState('')
  const [photos, setPhotos]   = useState([])   // [{ file, preview }]
  const [saving, setSaving]   = useState(false)
  const fileRef               = useRef(null)

  const display = hovered || rating

  function handlePhotoChange(e) {
    const files = Array.from(e.target.files || [])
    const remaining = MAX_PHOTOS - photos.length
    const toAdd = files.slice(0, remaining).filter(f => ALLOWED.includes(f.type))

    const newEntries = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setPhotos(prev => [...prev, ...newEntries])
    if (fileRef.current) fileRef.current.value = ''
  }

  function removePhoto(index) {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await onConfirm({
        rating: rating || null,
        completion_note: note.trim(),
        photos: photos.map(p => p.file),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className={styles.overlay} variants={overlayV} initial="hidden" animate="show" exit="exit"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className={styles.modal} variants={modalV} role="dialog" aria-modal="true">

        <div className={styles.header}>
          <h2>Concluir compromisso</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <p className={styles.subtitle}>Como foi <strong>{eventTitle}</strong>?</p>

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Estrelas ── */}
          <div className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`${styles.star} ${n <= display ? styles.starFilled : ''}`}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(prev => prev === n ? 0 : n)}
                aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              >★</button>
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

          {/* ── Observação ── */}
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

          {/* ── Fotos do registro ── */}
          <div className={styles.photoSection}>
            <div className={styles.photoHeader}>
              <span className={styles.photoLabel}>📷 Fotos do registro</span>
              <span className={styles.photoCount}>{photos.length}/{MAX_PHOTOS}</span>
            </div>

            <div className={styles.photoGrid}>
              {/* Previews existentes */}
              {photos.map((p, i) => (
                <div key={i} className={styles.previewWrap}>
                  <img src={p.preview} alt={`foto ${i + 1}`} className={styles.preview} />
                  <button
                    type="button"
                    className={styles.removePhoto}
                    onClick={() => removePhoto(i)}
                    aria-label="Remover foto"
                  >✕</button>
                </div>
              ))}

              {/* Slot de adicionar (enquanto < 3) */}
              {photos.length < MAX_PHOTOS && (
                <button
                  type="button"
                  className={styles.addSlot}
                  onClick={() => fileRef.current?.click()}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span>Importar foto</span>
                </button>
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>

          <div className={styles.actions}>
            <motion.button type="button" className="btn btn-outline" onClick={onClose}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>Cancelar</motion.button>
            <motion.button type="submit" className="btn btn-primary" disabled={saving}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
              {saving ? 'Salvando...' : '✅ Concluir'}
            </motion.button>
          </div>

        </form>
      </motion.div>
    </motion.div>
  )
}

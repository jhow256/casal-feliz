import { useState } from 'react'
import styles from './EventModal.module.css'

export default function EventModal({ initial, onSave, onClose }) {
  const [title, setTitle]       = useState(initial?.title || '')
  const [date, setDate]         = useState(initial?.date || '')
  const [time, setTime]         = useState(initial?.time || '')
  const [description, setDesc]  = useState(initial?.description || '')
  const [errors, setErrors]     = useState({})
  const [saving, setSaving]     = useState(false)

  function validate() {
    const errs = {}
    if (!title.trim())       errs.title = 'O título é obrigatório.'
    if (title.length > 100)  errs.title = 'Máximo de 100 caracteres.'
    if (!date)               errs.date  = 'A data é obrigatória.'
    if (description.length > 500) errs.description = 'Máximo de 500 caracteres.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    try {
      await onSave({
        title: title.trim(),
        date,
        time: time || null,
        description: description.trim(),
      })
    } catch {
      // error already toasted by parent
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">
        <div className={styles.modalHeader}>
          <h2>{initial?.id ? 'Editar compromisso' : 'Novo compromisso'}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="field">
            <label htmlFor="ev-title">Título *</label>
            <input
              id="ev-title"
              type="text"
              maxLength={100}
              placeholder="Ex: Jantar romântico"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
            {errors.title && <span className="error-msg">{errors.title}</span>}
            <span className={styles.charCount}>{title.length}/100</span>
          </div>

          {/* Date + Time side by side */}
          <div className={styles.dateTimeRow}>
            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ev-date">Data *</label>
              <input
                id="ev-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              {errors.date && <span className="error-msg">{errors.date}</span>}
            </div>

            <div className="field" style={{ flex: 1 }}>
              <label htmlFor="ev-time">Hora</label>
              <input
                id="ev-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="field">
            <label htmlFor="ev-desc">Descrição</label>
            <textarea
              id="ev-desc"
              rows={3}
              maxLength={500}
              placeholder="Detalhes do compromisso (opcional)"
              value={description}
              onChange={(e) => setDesc(e.target.value)}
            />
            {errors.description && <span className="error-msg">{errors.description}</span>}
            <span className={styles.charCount}>{description.length}/500</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

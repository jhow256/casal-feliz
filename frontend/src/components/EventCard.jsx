import { useRef } from 'react'
import styles from './EventCard.module.css'

function isToday(dateStr) {
  const today = new Date()
  const d = new Date(dateStr + 'T00:00:00')
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  )
}

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function initials(name = '') {
  return name.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase()
}

/* ── SVG icons (inline, no extra dep) ────────────────────── */
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconDesc = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
  </svg>
)
const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
)
const IconEye = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const IconCopy = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
)
const IconPhoto = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

export default function EventCard({
  event,
  isOwner,
  onEdit,
  onDelete,
  onDuplicate,
  onComplete,
  onPhotoUpload,
  onView,
}) {
  const fileRef = useRef(null)
  const today = isToday(event.date)

  return (
    <div className={`${styles.card} ${today ? styles.today : ''}`}>

      {/* Top row: type badge + date */}
      <div className={styles.topRow}>
        <span className={styles.badge}>{today ? 'Hoje' : 'Reunião'}</span>
        <span className={styles.dateLabel}>{fmtDate(event.date)}</span>
      </div>

      {/* Body */}
      <div className={styles.body}>
        {/* Avatar + title */}
        <div className={styles.titleRow}>
          <span className={styles.avatar}>{initials(event.created_by_name)}</span>
          <span className={styles.title}>{event.title}</span>
        </div>

        {/* Time */}
        {event.time && (
          <div className={styles.infoLine}>
            <IconClock />
            {event.time.slice(0, 5)}
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className={styles.infoLine}>
            <IconDesc />
            <span className={styles.desc}>{event.description}</span>
          </div>
        )}

        {/* Created by */}
        <div className={styles.infoLine}>
          <IconUser />
          {event.created_by_name}
        </div>
      </div>

      {/* ── Action buttons ────────────────────────────────── */}
      <div className={styles.actions}>
        {/* Row 1: Ver | Editar | Duplicar */}
        <div className={styles.actionsTop}>
          <button className={`${styles.actionBtn} ${styles.btnView}`} onClick={() => onView(event)}>
            <IconEye /> Ver
          </button>
          {isOwner && (
            <>
              <button className={`${styles.actionBtn} ${styles.btnEdit}`} onClick={() => onEdit(event)}>
                <IconEdit /> Editar
              </button>
              <button className={`${styles.actionBtn} ${styles.btnDuplicate}`} onClick={() => onDuplicate(event.id)}>
                <IconCopy /> Duplicar
              </button>
            </>
          )}
        </div>

        {/* Row 2: Concluído | 🗑 */}
        {isOwner && (
          <div className={styles.actionsBottom}>
            <button
              className={`${styles.actionBtn} ${styles.btnComplete}`}
              onClick={() => onComplete(event.id)}
            >
              <IconCheck /> Concluído
            </button>

            <button
              className={`${styles.actionBtn} ${styles.btnDelete}`}
              onClick={() => onDelete(event.id)}
              aria-label="Excluir"
            >
              <IconTrash />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

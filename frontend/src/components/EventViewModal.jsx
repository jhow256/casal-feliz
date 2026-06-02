import styles from './EventViewModal.module.css'

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtDateTime(isoStr) {
  return new Date(isoStr).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Stars({ value }) {
  if (!value) return <span className={styles.noRating}>Sem avaliação</span>
  return (
    <span className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} style={{ color: n <= value ? '#f5c518' : '#ddd' }}>★</span>
      ))}
    </span>
  )
}

export default function EventViewModal({ event, onClose }) {
  const isCompleted = event.is_completed

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal} role="dialog" aria-modal="true">

        {/* ── Header ── */}
        <div className={styles.header}>
          <div>
            <span className={styles.reportTag}>Relatório</span>
            <h2>{event.title}</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className={styles.body}>
          {/* ── Informações gerais ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Informações</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>📅 Data</span>
                <span className={styles.fieldValue}>
                  {fmtDate(event.date)}
                  {event.time && ` às ${event.time.slice(0, 5)}`}
                </span>
              </div>

              <div className={styles.field}>
                <span className={styles.fieldLabel}>👤 Responsável</span>
                <span className={styles.fieldValue}>{event.created_by_name}</span>
              </div>

              {event.description && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.fieldLabel}>📝 Descrição</span>
                  <span className={styles.fieldValue}>{event.description}</span>
                </div>
              )}

              {isCompleted && event.completed_at && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>✅ Concluído em</span>
                  <span className={styles.fieldValue}>{fmtDateTime(event.completed_at)}</span>
                </div>
              )}

              {isCompleted && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>⭐ Avaliação</span>
                  <Stars value={event.rating} />
                </div>
              )}

              {isCompleted && event.completion_note && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.fieldLabel}>💬 Observação</span>
                  <span className={styles.fieldValue}>{event.completion_note}</span>
                </div>
              )}
            </div>
          </section>

          {/* ── Registros (foto) ── */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Registros</h3>

            {event.photo_url ? (
              <div className={styles.photoBox}>
                <img src={event.photo_url} alt="Registro do evento" />
                <p className={styles.photoCaption}>Foto do acontecimento</p>
              </div>
            ) : (
              <div className={styles.noPhoto}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Nenhuma foto registrada para este compromisso.</p>
                {isCompleted && (
                  <span className={styles.noPhotoHint}>
                    Use o botão 📷 na tabela de concluídas para adicionar uma foto.
                  </span>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Footer ── */}
        <div className={styles.footer}>
          <button className="btn btn-primary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  )
}

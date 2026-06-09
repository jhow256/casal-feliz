import { motion } from 'framer-motion'
import styles from './EventViewModal.module.css'

function fmtDate(d) {
  return new Date(d+'T00:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})
}
function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})
}
function Stars({ value }) {
  if (!value) return <span className={styles.noRating}>Sem avaliação</span>
  return <span className={styles.stars}>{[1,2,3,4,5].map(n=><span key={n} style={{color:n<=value?'#f5c518':'#ddd'}}>★</span>)}</span>
}

const overlayV = { hidden:{opacity:0}, show:{opacity:1}, exit:{opacity:0} }
const modalV   = {
  hidden: { opacity:0, scale:0.92, y:24 },
  show:   { opacity:1, scale:1, y:0, transition:{type:'spring',stiffness:320,damping:28} },
  exit:   { opacity:0, scale:0.94, y:16, transition:{duration:0.18} },
}

export default function EventViewModal({ event, onClose }) {
  const c = event.is_completed
  return (
    <motion.div className={styles.overlay} variants={overlayV} initial="hidden" animate="show" exit="exit"
      onClick={e => e.target===e.currentTarget && onClose()}>
      <motion.div className={styles.modal} variants={modalV} role="dialog" aria-modal="true">

        <div className={styles.header}>
          <div>
            <span className={styles.reportTag}>Relatório</span>
            <h2>{event.title}</h2>
          </div>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Fechar">✕</button>
        </div>

        <div className={styles.body}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Informações</h3>
            <div className={styles.grid}>
              <div className={styles.field}>
                <span className={styles.fieldLabel}>📅 Data</span>
                <span className={styles.fieldValue}>{fmtDate(event.date)}{event.time && ` às ${event.time.slice(0,5)}`}</span>
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
              {c && event.completed_at && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>✅ Concluído em</span>
                  <span className={styles.fieldValue}>{fmtDateTime(event.completed_at)}</span>
                </div>
              )}
              {c && (
                <div className={styles.field}>
                  <span className={styles.fieldLabel}>⭐ Avaliação</span>
                  <Stars value={event.rating} />
                </div>
              )}
              {c && event.completion_note && (
                <div className={`${styles.field} ${styles.fieldFull}`}>
                  <span className={styles.fieldLabel}>💬 Observação</span>
                  <span className={styles.fieldValue}>{event.completion_note}</span>
                </div>
              )}
            </div>
          </section>

          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Registros</h3>
            {event.gallery && event.gallery.length > 0 ? (
              <div className={styles.galleryGrid}>
                {event.gallery.map(p => (
                  <motion.div key={p.id} className={styles.galleryItem}
                    whileHover={{ scale: 1.04 }} transition={{ type:'spring', stiffness:300, damping:20 }}>
                    <img src={p.file_url} alt="Registro" loading="lazy" />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className={styles.noPhoto}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <p>Nenhuma foto registrada.</p>
              </div>
            )}
          </section>
        </div>

        <div className={styles.footer}>
          <motion.button className="btn btn-primary" onClick={onClose}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Fechar</motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

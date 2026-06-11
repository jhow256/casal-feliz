import { motion, AnimatePresence } from 'framer-motion'
import styles from './DeleteModal.module.css'

const overlayV = { hidden: { opacity: 0 }, show: { opacity: 1 }, exit: { opacity: 0 } }
const modalV = {
  hidden: { opacity: 0, scale: 0.88, y: 32 },
  show:   { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 340, damping: 28 } },
  exit:   { opacity: 0, scale: 0.92, y: 20, transition: { duration: 0.18 } },
}

export default function DeleteModal({ title, message, onConfirm, onClose, loading = false }) {
  return (
    <motion.div
      className={styles.overlay}
      variants={overlayV}
      initial="hidden"
      animate="show"
      exit="exit"
      onClick={(e) => e.target === e.currentTarget && !loading && onClose()}
    >
      <motion.div
        className={styles.modal}
        variants={modalV}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* ── Ícone decorativo ── */}
        <div className={styles.iconWrap}>
          <div className={styles.iconRing}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
          </div>

          {/* partículas decorativas */}
          <span className={`${styles.dot} ${styles.dot1}`} />
          <span className={`${styles.dot} ${styles.dot2}`} />
          <span className={`${styles.dot} ${styles.dot3}`} />
        </div>

        <h2 id="delete-modal-title" className={styles.heading}>
          {title || 'Remover compromisso'}
        </h2>

        <p className={styles.body}>
          {message || 'Tem certeza que deseja remover este compromisso? Esta ação não pode ser desfeita.'}
        </p>

        <div className={styles.divider} />

        <div className={styles.actions}>
          <motion.button
            type="button"
            className={styles.btnCancel}
            onClick={onClose}
            disabled={loading}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            Cancelar
          </motion.button>

          <motion.button
            type="button"
            className={styles.btnDelete}
            onClick={onConfirm}
            disabled={loading}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14H6L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Sim, excluir
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}

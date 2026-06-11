import { useEffect, useCallback, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import styles from './Lightbox.module.css'

/* ── Full-screen single photo viewer ────────────────────── */
function PhotoViewer({ photos, index, onClose, onNav, onDelete }) {
  const { user } = useAuth()
  const photo = photos[index]
  const total = photos.length

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowLeft')  onNav(-1)
    if (e.key === 'ArrowRight') onNav(+1)
    if (e.key === 'Escape')     onClose()
  }, [onNav, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = '' }
  }, [handleKey])

  if (!photo) return null

  return (
    <motion.div className={styles.viewerOverlay}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => e.target === e.currentTarget && onClose()}>

      <div className={styles.topBar}>
        <span className={styles.counter}>{index + 1} / {total}</span>
        <span className={styles.uploaderName}>📷 {photo.uploaded_by_name}</span>
        <div className={styles.topActions}>
          {photo.uploaded_by === user?.id && (
            <motion.button className={styles.deleteBtn} onClick={() => onDelete(photo.id)}
              whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} title="Remover">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
            </motion.button>
          )}
          <motion.button className={styles.closeBtn} onClick={onClose}
            whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.92 }}>✕</motion.button>
        </div>
      </div>

      <div className={styles.imageArea}>
        <motion.button className={`${styles.navBtn} ${styles.prev}`} onClick={() => onNav(-1)}
          whileHover={{ scale: 1.1, x: -3 }} whileTap={{ scale: 0.92 }} disabled={index === 0}>‹</motion.button>

        <AnimatePresence mode="wait">
          <motion.div key={photo.id} className={styles.imgWrap}
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.22 }}>
            <img src={photo.file_url} alt="" className={styles.mainImg} draggable={false} />
          </motion.div>
        </AnimatePresence>

        <motion.button className={`${styles.navBtn} ${styles.next}`} onClick={() => onNav(+1)}
          whileHover={{ scale: 1.1, x: 3 }} whileTap={{ scale: 0.92 }} disabled={index === total - 1}>›</motion.button>
      </div>

      <div className={styles.strip}>
        {photos.map((p, i) => (
          <motion.button key={p.id}
            className={`${styles.thumb} ${i === index ? styles.thumbActive : ''}`}
            onClick={() => onNav(i - index)}
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}>
            <img src={p.file_url} alt="" loading="lazy" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

/* ── Grid gallery overlay ─────────────────────────────── */
export default function Lightbox({ photos, currentIndex, onClose, onNav, onDelete }) {
  // Always open grid first; viewer opens when user clicks a photo inside grid
  const [viewing, setViewing] = useState(null)  // null = grid, number = viewer

  // Close grid with Escape
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape' && viewing === null) onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose, viewing])

  function openPhoto(idx) { setViewing(idx) }
  function closePhoto()   { setViewing(null) }
  function navPhoto(delta) {
    setViewing(prev => {
      const next = prev + delta
      return (next < 0 || next >= photos.length) ? prev : next
    })
  }
  function handleDelete(id) {
    onDelete(id)
    closePhoto()
  }

  return (
    <>
      {/* Grid overlay */}
      <AnimatePresence>
        {viewing === null && (
          <motion.div className={styles.gridOverlay}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={e => e.target === e.currentTarget && onClose()}>

            <div className={styles.gridHeader}>
              <span className={styles.gridTitle}>📷 Todas as fotos ({photos.length})</span>
              <motion.button className={styles.closeBtn} onClick={onClose}
                whileHover={{ scale: 1.08, rotate: 90 }} whileTap={{ scale: 0.92 }}>✕</motion.button>
            </div>

            <div className={styles.gridBody}>
              <motion.div className={styles.photoGrid}
                initial="hidden" animate="show"
                variants={{ hidden:{}, show:{ transition:{ staggerChildren:0.025 } } }}>
                {photos.map((p, i) => (
                  <motion.button key={p.id} className={styles.gridItem}
                    onClick={() => openPhoto(i)}
                    variants={{ hidden:{opacity:0, scale:0.9}, show:{opacity:1, scale:1} }}
                    whileHover={{ scale: 1.04, zIndex: 2 }} whileTap={{ scale: 0.97 }}>
                    <img src={p.file_url} alt="" loading="lazy" />
                    <div className={styles.gridItemOverlay}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full photo viewer */}
      <AnimatePresence>
        {viewing !== null && (
          <PhotoViewer
            photos={photos}
            index={viewing}
            onClose={closePhoto}
            onNav={navPhoto}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </>
  )
}

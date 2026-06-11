import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import LoveTimer from '../components/LoveTimer'
import LoveCalendar from '../components/LoveCalendar'
import Lightbox from '../components/Lightbox'
import MessageWidget from '../components/MessageWidget'
import styles from './CarouselPage.module.css'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

/* Pick up to N random items from an array */
function pickRandom(arr, n) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

export default function CarouselPage() {
  const { user } = useAuth()
  const [photos, setPhotos]       = useState([])
  const [featured, setFeatured]   = useState([])   // random subset for "Relembre"
  const [featIdx, setFeatIdx]     = useState(0)
  const [loading, setLoading]     = useState(true)
  const [uploading, setUploading] = useState(false)
  const [lightbox, setLightbox]   = useState(null)  // index in `photos` or null
  const fileRef  = useRef(null)
  const timerRef = useRef(null)

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchPhotos = useCallback(async () => {
    try {
      const { data } = await api.get('/api/photos/')
      setPhotos(data)
      setFeatured(pickRandom(data, Math.min(8, data.length)))
      setFeatIdx(0)
    } catch {
      toast.error('Não foi possível carregar as fotos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  // ── Featured autoplay ─────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (featured.length > 1) {
      timerRef.current = setInterval(() => setFeatIdx(c => (c + 1) % featured.length), 5000)
    }
  }, [featured.length])

  useEffect(() => { resetTimer(); return () => clearInterval(timerRef.current) }, [resetTimer])

  // ── Upload ────────────────────────────────────────────────────────────────
  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Use JPEG, PNG ou WebP.'); return }
    if (file.size > MAX_SIZE) { toast.error('Máximo 10 MB.'); return }

    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/api/photos/', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPhotos(prev => {
        const updated = [...prev, data]
        setFeatured(pickRandom(updated, Math.min(8, updated.length)))
        return updated
      })
      toast.success('Foto adicionada! 📸')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar foto.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(id) {
    if (!window.confirm('Remover esta foto?')) return
    try {
      await api.delete(`/api/photos/${id}/`)
      setPhotos(prev => {
        const updated = prev.filter(p => p.id !== id)
        setFeatured(pickRandom(updated, Math.min(8, updated.length)))
        return updated
      })
      if (lightbox !== null) {
        const newIdx = Math.min(lightbox, photos.filter(p => p.id !== id).length - 1)
        setLightbox(newIdx >= 0 ? newIdx : null)
      }
      toast.success('Foto removida.')
    } catch (err) {
      if (err.response?.status === 403) toast.error('Você só pode remover suas próprias fotos.')
      else toast.error('Erro ao remover foto.')
    }
  }

  // ── Lightbox nav ──────────────────────────────────────────────────────────
  function handleLightboxNav(delta) {
    setLightbox(prev => {
      const next = prev + delta
      if (next < 0 || next >= photos.length) return prev
      return next
    })
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="page-container">
      <div className={styles.skeletonWrap}>
        <div className="skeleton" style={{ width:'100%', height:340, borderRadius:'var(--radius-lg)' }} />
        <div className={styles.skeletonGrid}>
          {[1,2,3,4,5,6,7,8,9].map(i => (
            <div key={i} className="skeleton" style={{ aspectRatio:'1', borderRadius:'var(--radius-sm)' }} />
          ))}
        </div>
      </div>
    </div>
  )

  const lightboxPhotos = photos

  return (
    <div className="page-container">

      {/* ══════════════════════════════════════════
          SEÇÃO 1 — Galeria + Mensagem misteriosa
      ══════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.topRow}>
          {/* ── Galeria (esquerda) ── */}
          <div className={styles.galleryCol}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>📷 Nossa Galeria</h2>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {photos.length > 0 && (
              <motion.button
                className="btn btn-outline"
                onClick={() => setLightbox(0)}
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              >
                Ver todas ({photos.length})
              </motion.button>
            )}
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              style={{ display:'none' }} onChange={handleUpload} id="photo-upload" />
            <motion.label
              htmlFor="photo-upload"
              className="btn btn-primary"
              style={{ cursor:'pointer' }}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            >
              {uploading ? 'Enviando…' : '+ Adicionar'}
            </motion.label>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className={styles.emptyGallery}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <rect x="3" y="3" width="18" height="18" rx="3"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Nenhuma foto ainda. Comece adicionando a primeira memória!</p>
          </div>
        ) : (
          <>
            {/* ── "Relembre esse dia" spotlight ── */}
            {featured.length > 0 && (
              <div className={styles.spotlight}>
                <div className={styles.spotlightLabel}>
                  <span className={styles.spotlightBadge}>✨ Relembre esse dia</span>
                  <span className={styles.spotlightDots}>
                    {featured.map((_, i) => (
                      <button key={i}
                        className={`${styles.sDot} ${i === featIdx ? styles.sDotActive : ''}`}
                        onClick={() => { setFeatIdx(i); resetTimer() }}
                      />
                    ))}
                  </span>
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={featured[featIdx]?.id}
                    className={styles.spotlightImg}
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.4,0,0.2,1] }}
                    onClick={() => {
                      // Open grid gallery, not direct viewer
                      setLightbox(0)
                    }}
                  >
                    <img src={featured[featIdx]?.file_url} alt="Relembre" loading="lazy" />
                    <div className={styles.spotlightOverlay}>
                      <span>Clique para ver</span>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* prev / next */}
                <button className={`${styles.sNavBtn} ${styles.sLeft}`}
                  onClick={() => { setFeatIdx(i => (i - 1 + featured.length) % featured.length); resetTimer() }}>‹</button>
                <button className={`${styles.sNavBtn} ${styles.sRight}`}
                  onClick={() => { setFeatIdx(i => (i + 1) % featured.length); resetTimer() }}>›</button>
              </div>
            )}

            {/* ── Carrossel horizontal com scroll automático ── */}
            <div className={styles.gridHeader}>
              <span className={styles.gridLabel}>Últimas adicionadas</span>
              {photos.length > 0 && (
                <motion.button className={styles.seeAll} onClick={() => setLightbox(0)}
                  whileHover={{ x: 3 }}>Ver todas →</motion.button>
              )}
            </div>

            <div className={styles.autoScrollWrap}>
              <motion.div
                className={styles.autoScrollTrack}
                animate={{ x: ['0%', '-50%'] }}
                transition={{ duration: Math.max(photos.length * 3, 12), ease: 'linear', repeat: Infinity }}
              >
                {/* duplica a lista para loop infinito */}
                {[...photos, ...photos].map((p, i) => (
                  <motion.button
                    key={`${p.id}-${i}`}
                    className={styles.scrollItem}
                    onClick={() => setLightbox(0)}
                    whileHover={{ scale: 1.06, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <img src={p.file_url} alt="" loading="lazy" />
                    <div className={styles.scrollOverlay}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            </div>
          </>
        )}
          </div>{/* fim galleryCol */}

          {/* ── Mensagem misteriosa (direita) ── */}
          <div className={styles.messageCol}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 16 }}>💌 Mensagem misteriosa</h2>
            <MessageWidget />
          </div>
        </div>{/* fim topRow */}
      </section>

      {/* ══════════════════════════════════════════
          SEÇÃO 2 — Relógio do amor
      ══════════════════════════════════════ */}
      <section className={styles.section}>
        <LoveTimer />
      </section>

      {/* ══════════════════════════════════════════
          SEÇÃO 3 — Calendário
      ══════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>🗓 Nossa Linha do Tempo</h2>
        </div>
        <p className={styles.calendarHint}>
          Clique em qualquer data marcada com <span className={styles.dotInline} /> para ver os registros daquele dia.
        </p>
        <LoveCalendar />
      </section>

      {/* ── Lightbox ── */}
      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox
            photos={photos}
            currentIndex={lightbox}
            onClose={() => setLightbox(null)}
            onNav={delta => handleLightboxNav(delta)}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

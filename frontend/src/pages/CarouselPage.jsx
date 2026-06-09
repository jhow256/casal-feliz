import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import LoveTimer from '../components/LoveTimer'
import LoveCalendar from '../components/LoveCalendar'
import { SkeletonLine } from '../components/Skeleton'
import styles from './CarouselPage.module.css'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export default function CarouselPage() {
  const { user } = useAuth()
  const [photos, setPhotos]     = useState([])
  const [current, setCurrent]   = useState(0)
  const [loading, setLoading]   = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef  = useRef(null)
  const timerRef = useRef(null)

  const fetchPhotos = useCallback(async () => {
    try {
      const { data } = await api.get('/api/photos/')
      setPhotos(data)
      setCurrent(0)
    } catch {
      toast.error('Não foi possível carregar as fotos.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const resetTimer = useCallback(() => {
    clearInterval(timerRef.current)
    if (photos.length > 1) {
      timerRef.current = setInterval(() => {
        setCurrent((c) => (c + 1) % photos.length)
      }, 5000)
    }
  }, [photos.length])

  useEffect(() => {
    resetTimer()
    return () => clearInterval(timerRef.current)
  }, [resetTimer])

  function prev() { setCurrent((c) => (c - 1 + photos.length) % photos.length); resetTimer() }
  function next() { setCurrent((c) => (c + 1) % photos.length); resetTimer() }

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error('Use JPEG, PNG ou WebP.'); return }
    if (file.size > MAX_SIZE) { toast.error('Máximo 10 MB.'); return }

    const formData = new FormData()
    formData.append('file', file)
    setUploading(true)
    try {
      const { data } = await api.post('/api/photos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotos((prev) => [...prev, data])
      setCurrent(photos.length)
      toast.success('Foto adicionada! 📸')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar foto.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover esta foto?')) return
    try {
      await api.delete(`/api/photos/${id}/`)
      const updated = photos.filter((p) => p.id !== id)
      setPhotos(updated)
      setCurrent((c) => Math.min(c, Math.max(0, updated.length - 1)))
      toast.success('Foto removida.')
    } catch (err) {
      if (err.response?.status === 403) toast.error('Você só pode remover suas próprias fotos.')
      else toast.error('Erro ao remover foto.')
    }
  }

  if (loading) return (
    <div className="page-container">
      <div style={{ display:'flex', flexDirection:'column', gap:16, alignItems:'center' }}>
        <div className="skeleton" style={{ width:'100%', maxWidth:720, aspectRatio:'16/9', borderRadius:'var(--radius-lg)' }} />
        <div style={{ display:'flex', gap:10 }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ width:72, height:54, borderRadius:'var(--radius-sm)' }} />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="page-container">

      {/* ═══════════════════════════════════════════════
          SEÇÃO 1 — Carrossel de fotos
      ══════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span>📷</span> Nossas Fotos
          </h2>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              style={{ display: 'none' }}
              onChange={handleUpload}
              id="photo-upload"
            />
            <label htmlFor="photo-upload" className="btn btn-primary">
              {uploading ? 'Enviando...' : '+ Adicionar foto'}
            </label>
          </div>
        </div>

        {photos.length === 0 ? (
          <div className="empty-state">
            <span style={{ fontSize: '3rem' }}>📷</span>
            <p>Nenhuma foto ainda. Que tal adicionar a primeira memória?</p>
          </div>
        ) : (
          <div className={styles.carouselWrapper}>
            <div className={styles.imageContainer}>
              <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={prev} aria-label="Anterior">‹</button>
              <img
                key={photos[current].id}
                src={photos[current].file_url}
                alt=""
                className={styles.photo}
              />
              <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={next} aria-label="Próxima">›</button>

              {photos[current].uploaded_by === user?.id && (
                <button className={styles.deleteBtn} onClick={() => handleDelete(photos[current].id)} aria-label="Remover">🗑</button>
              )}
            </div>

            <p className={styles.caption}>
              <span className={styles.counter}>{current + 1} / {photos.length}</span>
            </p>

            <div className={styles.dots}>
              {photos.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => { setCurrent(i); resetTimer() }}
                />
              ))}
            </div>

            {photos.length > 1 && (
              <div className={styles.thumbs}>
                {photos.map((p, i) => (
                  <button
                    key={p.id}
                    className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
                    onClick={() => { setCurrent(i); resetTimer() }}
                  >
                    <img src={p.file_url} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 2 — Relógio do amor
      ══════════════════════════════════════════════ */}
      <section className={styles.section}>
        <LoveTimer />
      </section>

      {/* ═══════════════════════════════════════════════
          SEÇÃO 3 — Calendário
      ══════════════════════════════════════════════ */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <span>🗓</span> Nossa Linha do Tempo
          </h2>
        </div>
        <p className={styles.calendarHint}>
          Clique em qualquer data marcada com <span className={styles.dotInline} /> para ver os registros daquele dia.
        </p>
        <LoveCalendar />
      </section>

    </div>
  )
}

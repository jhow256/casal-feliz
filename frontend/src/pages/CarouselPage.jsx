import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import styles from './CarouselPage.module.css'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 10 * 1024 * 1024

export default function CarouselPage() {
  const { user } = useAuth()
  const [photos, setPhotos] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)
  const timerRef = useRef(null)

  // Fetch photos
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

  // Autoplay — advance every 5 s when more than 1 photo
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

  function prev() {
    setCurrent((c) => (c - 1 + photos.length) % photos.length)
    resetTimer()
  }

  function next() {
    setCurrent((c) => (c + 1) % photos.length)
    resetTimer()
  }

  // Upload
  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG ou WebP.')
      return
    }
    if (file.size > MAX_SIZE) {
      toast.error('Arquivo excede o limite de 10 MB.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)
    try {
      const { data } = await api.post('/api/photos/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPhotos((prev) => [...prev, data])
      setCurrent(photos.length) // jump to new photo
      toast.success('Foto adicionada! 📸')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar foto.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  // Delete
  async function handleDelete(id) {
    if (!window.confirm('Remover esta foto?')) return
    try {
      await api.delete(`/api/photos/${id}/`)
      const updated = photos.filter((p) => p.id !== id)
      setPhotos(updated)
      setCurrent((c) => Math.min(c, Math.max(0, updated.length - 1)))
      toast.success('Foto removida.')
    } catch (err) {
      const status = err.response?.status
      if (status === 403) toast.error('Você só pode remover suas próprias fotos.')
      else toast.error('Erro ao remover foto.')
    }
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-container">
      <h1 className="page-title">📷 Nossas Fotos</h1>

      {/* Upload button */}
      <div className={styles.uploadRow}>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleUpload}
          id="photo-upload"
        />
        <label htmlFor="photo-upload" className={`btn btn-primary ${uploading ? 'btn-disabled' : ''}`}>
          {uploading ? 'Enviando...' : '+ Adicionar foto'}
        </label>
      </div>

      {photos.length === 0 ? (
        <div className="empty-state">
          <span style={{ fontSize: '3rem' }}>📷</span>
          <p>Nenhuma foto ainda. Que tal adicionar a primeira memória?</p>
        </div>
      ) : (
        <div className={styles.carouselWrapper}>
          {/* Main image */}
          <div className={styles.imageContainer}>
            <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={prev} aria-label="Foto anterior">
              ‹
            </button>

            <img
              key={photos[current].id}
              src={photos[current].file_url}
              alt={photos[current].original_filename}
              className={styles.photo}
            />

            <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={next} aria-label="Próxima foto">
              ›
            </button>

            {/* Delete — only own photos */}
            {photos[current].uploaded_by === user?.id && (
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(photos[current].id)}
                aria-label="Remover foto"
              >
                🗑
              </button>
            )}
          </div>

          {/* Caption */}
          <p className={styles.caption}>
            {photos[current].original_filename}
            <span className={styles.counter}> {current + 1} / {photos.length}</span>
          </p>

          {/* Dots */}
          <div className={styles.dots}>
            {photos.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                onClick={() => { setCurrent(i); resetTimer() }}
                aria-label={`Ir para foto ${i + 1}`}
              />
            ))}
          </div>

          {/* Thumbnails */}
          {photos.length > 1 && (
            <div className={styles.thumbs}>
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  className={`${styles.thumb} ${i === current ? styles.thumbActive : ''}`}
                  onClick={() => { setCurrent(i); resetTimer() }}
                >
                  <img src={p.file_url} alt={p.original_filename} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

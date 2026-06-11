import { useRef, useLayoutEffect, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import styles from './ScratchCard.module.css'

const BRUSH     = 44
const THRESHOLD = 0.52

function getPos(canvas, e) {
  const rect = canvas.getBoundingClientRect()
  const sx = canvas.width  / rect.width
  const sy = canvas.height / rect.height
  const src = e.touches ? e.touches[0] : e
  return {
    x: (src.clientX - rect.left) * sx,
    y: (src.clientY - rect.top)  * sy,
  }
}

function calcRevealed(ctx, w, h) {
  const d = ctx.getImageData(0, 0, w, h).data
  let t = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] < 128) t++
  return t / (w * h)
}

export default function ScratchCard({ message, onRevealed }) {
  const canvasRef = useRef(null)
  const ctxRef    = useRef(null)
  const isDown    = useRef(false)

  // If already revealed AND we have content → go straight to done
  // If already revealed but NO content → need to fetch it
  const [phase, setPhase]     = useState(() => {
    if (!message.is_revealed) return 'scratch'
    if (message.content)      return 'done'
    return 'fetching'   // revealed but content not yet loaded
  })
  const [content, setContent] = useState(message.content ?? null)

  // Fetch content when revealed but content is null
  useEffect(() => {
    if (phase !== 'fetching') return
    api.post(`/api/messages/${message.id}/reveal/`)
      .then(({ data }) => {
        setContent(data.content)
        setPhase('done')
        onRevealed?.(data)
      })
      .catch(() => setPhase('done'))
  }, [phase, message.id, onRevealed])

  // Draw cover layer
  useLayoutEffect(() => {
    if (phase !== 'scratch') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctxRef.current = ctx

    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
    grad.addColorStop(0,   '#5aaced')
    grad.addColorStop(0.5, '#3d8fcf')
    grad.addColorStop(1,   '#2a7bbf')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.font = 'bold 15px Segoe UI, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.8)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('✦  Raspe para revelar  ✦', canvas.width / 2, canvas.height / 2 - 10)
    ctx.font = '13px Segoe UI, sans-serif'
    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText('(segure e arraste o mouse)', canvas.width / 2, canvas.height / 2 + 16)
  }, [phase])

  function doScratch(e) {
    if (!isDown.current || phase !== 'scratch') return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx    = ctxRef.current
    if (!canvas || !ctx) return

    const { x, y } = getPos(canvas, e)
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(x, y, BRUSH, 0, Math.PI * 2)
    ctx.fill()

    if (calcRevealed(ctx, canvas.width, canvas.height) > THRESHOLD) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setPhase('loading')

      api.post(`/api/messages/${message.id}/reveal/`)
        .then(({ data }) => {
          setContent(data.content)
          setPhase('done')
          onRevealed?.(data)
        })
        .catch(() => {
          setPhase('done')
          onRevealed?.()
        })
    }
  }

  /* ── Fetching / Loading ── */
  if (phase === 'fetching' || phase === 'loading') {
    return (
      <div className={styles.loadingWrap}>
        <div className="spinner" />
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 8 }}>
          {phase === 'fetching' ? 'Carregando mensagem…' : 'Revelando mensagem…'}
        </p>
      </div>
    )
  }

  /* ── Revealed ── */
  if (phase === 'done') {
    return (
      <motion.div className={styles.revealedCard}
        initial={{ opacity: 0, scale: 0.88 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}>
        <span className={styles.revealedIcon}>💌</span>
        <p className={styles.revealedText}>{content || '(mensagem sem conteúdo)'}</p>
        <span className={styles.revealedBy}>— {message.author_name}</span>
      </motion.div>
    )
  }

  /* ── Scratch canvas ── */
  return (
    <div className={styles.wrapper}>
      <div className={styles.blurLayer}>
        <p className={styles.blurText}>{content || '••••••••••••••••••••••'}</p>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        width={460}
        height={210}
        onMouseDown={e => { isDown.current = true; doScratch(e) }}
        onMouseUp={() => { isDown.current = false }}
        onMouseLeave={() => { isDown.current = false }}
        onMouseMove={doScratch}
        onTouchStart={e => { isDown.current = true; doScratch(e) }}
        onTouchEnd={() => { isDown.current = false }}
        onTouchMove={doScratch}
      />
    </div>
  )
}

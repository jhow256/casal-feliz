import { useState, useEffect } from 'react'
import styles from './LoveTimer.module.css'

const START_DATE = new Date('2024-08-01T00:00:00')

function calcTime() {
  const now  = new Date()
  const diff = now - START_DATE   // ms total

  // ── Calendar-accurate years / months / days ──────────────
  let years  = now.getFullYear() - START_DATE.getFullYear()
  let months = now.getMonth()    - START_DATE.getMonth()
  let days   = now.getDate()     - START_DATE.getDate()

  if (days < 0) {
    months--
    // days remaining in the previous month
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }
  if (months < 0) {
    years--
    months += 12
  }

  // ── Sub-day precision ─────────────────────────────────────
  const totalSeconds = Math.floor(diff / 1000)
  const seconds = totalSeconds % 60
  const minutes = Math.floor(totalSeconds / 60) % 60
  const hours   = Math.floor(totalSeconds / 3600) % 24
  const totalDays = Math.floor(diff / 86400000)

  return { years, months, days, hours, minutes, seconds, totalDays }
}

function Pad({ label, value }) {
  return (
    <div className={styles.unit}>
      <span className={styles.value}>{String(value).padStart(2, '0')}</span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export default function LoveTimer() {
  const [time, setTime] = useState(calcTime)

  useEffect(() => {
    const id = setInterval(() => setTime(calcTime()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={styles.wrapper}>
      <div className={styles.hearts}>♥ ♥ ♥</div>
      <h2 className={styles.title}>O relógio que conta o início da nossa história</h2>
      <p className={styles.subtitle}>
        Juntos desde <strong>01 de agosto de 2024</strong> — já são{' '}
        <strong>{time.totalDays} dias</strong> de amor 💕
      </p>

      <div className={styles.clock}>
        <Pad label="anos"    value={time.years}   />
        <span className={styles.sep}>:</span>
        <Pad label="meses"   value={time.months}  />
        <span className={styles.sep}>:</span>
        <Pad label="dias"    value={time.days}     />
        <span className={styles.sep}>:</span>
        <Pad label="horas"   value={time.hours}    />
        <span className={styles.sep}>:</span>
        <Pad label="min"     value={time.minutes}  />
        <span className={styles.sep}>:</span>
        <Pad label="seg"     value={time.seconds}  />
      </div>
    </div>
  )
}

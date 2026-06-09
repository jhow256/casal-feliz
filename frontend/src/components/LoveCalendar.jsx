import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../services/api'
import styles from './LoveCalendar.module.css'

const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]
const DAYS_PT = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

const START_YEAR  = 2024
const START_MONTH = 0  // January

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
}

function fmtDateLong(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
}

/* ── Day detail modal ──────────────────────────────────────── */
function DayModal({ dateStr, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/api/events/?date=${dateStr}`)
      .then(({ data }) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [dateStr])

  return (
    <AnimatePresence>
      <motion.div className={styles.overlay}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}>
        <motion.div className={styles.dayModal}
          initial={{ opacity: 0, scale: 0.92, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } }}
          exit={{ opacity: 0, scale: 0.94, y: 16, transition: { duration: 0.18 } }}>
          <div className={styles.dayHeader}>
            <h3>{fmtDateLong(dateStr)}</h3>
            <button className="btn btn-ghost" onClick={onClose}>✕</button>
          </div>

        {loading && <div className="spinner" style={{ margin: '32px auto' }} />}

        {!loading && events.length === 0 && (
          <div className={styles.dayEmpty}>
            <span>📅</span>
            <p>Nenhum registro para este dia.</p>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div className={styles.dayEvents}>
            {events.map((ev) => (
              <div key={ev.id} className={styles.dayEvent}>
                {/* Galeria de fotos */}
                {ev.gallery && ev.gallery.length > 0 && (
                  <div className={styles.dayGallery}>
                    {ev.gallery.map((p) => (
                      <div key={p.id} className={styles.dayPhoto}>
                        <img src={p.file_url} alt="" />
                      </div>
                    ))}
                  </div>
                )}

                <div className={styles.dayEventBody}>
                  <div className={styles.dayEventTitle}>{ev.title}</div>

                  {ev.time && (
                    <div className={styles.dayEventMeta}>🕐 {ev.time.slice(0, 5)}</div>
                  )}

                  {ev.description && (
                    <p className={styles.dayEventDesc}>{ev.description}</p>
                  )}

                  {ev.is_completed && (
                    <div className={styles.dayEventCompleted}>
                      ✅ Concluído
                      {ev.rating && (
                        <span className={styles.dayStars}>
                          {[1,2,3,4,5].map(n => (
                            <span key={n} style={{ color: n <= ev.rating ? '#f5c518' : '#ddd' }}>★</span>
                          ))}
                        </span>
                      )}
                    </div>
                  )}

                  {ev.completion_note && (
                    <p className={styles.dayNote}>💬 {ev.completion_note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.dayFooter}>
          <motion.button className="btn btn-primary" onClick={onClose}
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>Fechar</motion.button>
        </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Main calendar ─────────────────────────────────────────── */
export default function LoveCalendar() {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [markedDates, setMarkedDates] = useState(new Set())
  const [selectedDate, setSelectedDate] = useState(null)

  // Fetch dates that have events for this month
  const fetchDates = useCallback(async (year, month) => {
    try {
      const { data } = await api.get(`/api/events/dates/?year=${year}&month=${month + 1}`)
      setMarkedDates(new Set(data))
    } catch {
      setMarkedDates(new Set())
    }
  }, [])

  useEffect(() => { fetchDates(viewYear, viewMonth) }, [viewYear, viewMonth, fetchDates])

  // Navigation — clamp to START (Aug 2024) and today
  function prevMonth() {
    let m = viewMonth - 1, y = viewYear
    if (m < 0) { m = 11; y-- }
    if (y < START_YEAR || (y === START_YEAR && m < START_MONTH)) return
    setViewYear(y); setViewMonth(m)
  }

  function nextMonth() {
    let m = viewMonth + 1, y = viewYear
    if (m > 11) { m = 0; y++ }
    if (y > today.getFullYear() || (y === today.getFullYear() && m > today.getMonth())) return
    setViewYear(y); setViewMonth(m)
  }

  const atStart = viewYear === START_YEAR && viewMonth === START_MONTH
  const atEnd   = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  // Build calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells = []

  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  function handleDayClick(day) {
    if (!day) return
    const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    setSelectedDate(dateStr)
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.calHeader}>
        <motion.button className={styles.navBtn} onClick={prevMonth} disabled={atStart}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>‹</motion.button>
        <span className={styles.monthLabel}>{MONTHS_PT[viewMonth]} {viewYear}</span>
        <motion.button className={styles.navBtn} onClick={nextMonth} disabled={atEnd}
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>›</motion.button>
      </div>

      {/* Day names */}
      <div className={styles.grid}>
        {DAYS_PT.map(d => (
          <div key={d} className={styles.dayName}>{d}</div>
        ))}

        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />

          const dateStr = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const isToday = toKey(today) === dateStr
          const hasEvent = markedDates.has(dateStr)
          const isSelected = selectedDate === dateStr

          return (
            <motion.button
              key={dateStr}
              className={`${styles.day} ${isToday?styles.dayToday:''} ${hasEvent?styles.dayHasEvent:''} ${isSelected?styles.daySelected:''}`}
              onClick={() => handleDayClick(day)}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {day}
              {hasEvent && <span className={styles.dot} />}
            </motion.button>
          )
        })}
      </div>

      {selectedDate && (
        <DayModal dateStr={selectedDate} onClose={() => setSelectedDate(null)} />
      )}
    </div>
  )
}

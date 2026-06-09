import { useState, useEffect, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../services/api'
import toast from 'react-hot-toast'
import EventViewModal from '../components/EventViewModal'
import { SkeletonTable } from '../components/Skeleton'
import styles from './CompletedPage.module.css'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function fmtDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

function fmtDateTime(iso) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function Stars({ value }) {
  if (!value) return <span className={styles.noRating}>—</span>
  return (
    <span className={styles.stars}>
      {[1,2,3,4,5].map((n) => (
        <span key={n} style={{ color: n <= value ? '#f5c518' : '#ddd' }}>★</span>
      ))}
    </span>
  )
}

function PhotoUploadBtn({ eventId, onUpload }) {
  const ref = useRef(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(eventId, file)
          e.target.value = ''
        }}
      />
      <button
        className={`${styles.iconBtn} ${styles.iconPhoto}`}
        onClick={() => ref.current?.click()}
        title="Adicionar foto"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      </button>
    </>
  )
}

export default function CompletedPage() {
  const [events, setEvents]         = useState([])
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal]           = useState(0)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(false)
  const [viewModal, setViewModal]   = useState(null)

  // filters
  const [filterMonth, setFilterMonth]     = useState('')
  const [filterResponsible, setFilterResp] = useState('')
  const [pendingMonth, setPendingMonth]     = useState('')
  const [pendingResp, setPendingResp]       = useState('')

  const fetchCompleted = useCallback(async (p = 1, month = filterMonth, resp = filterResponsible) => {
    setLoading(true); setError(false)
    try {
      let url = `/api/events/?completed=true&page=${p}`
      if (month !== '') url += `&month=${parseInt(month) + 1}`
      if (resp)         url += `&responsible=${encodeURIComponent(resp)}`
      const { data } = await api.get(url)
      setEvents(data.results)
      setPage(data.page)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [filterMonth, filterResponsible])

  useEffect(() => { fetchCompleted(1) }, [])   // eslint-disable-line

  function applyFilters() {
    setFilterMonth(pendingMonth)
    setFilterResp(pendingResp)
    fetchCompleted(1, pendingMonth, pendingResp)
  }

  function goToPage(p) {
    if (p < 1 || p > totalPages) return
    fetchCompleted(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleUndo(id) {
    try {
      await api.post(`/api/events/${id}/complete/`)
      toast.success('Compromisso reaberto.')
      fetchCompleted(page)
    } catch { toast.error('Erro ao reabrir compromisso.') }
  }

  async function handlePhotoUpload(id, file) {
    const form = new FormData()
    form.append('photo', file)
    try {
      const { data } = await api.post(`/api/events/${id}/photo/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      // update local list so modal gets the new photo_url
      setEvents((prev) => prev.map((e) => (e.id === id ? data : e)))
      toast.success('Foto adicionada! 📷')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar foto.')
    }
  }

  if (loading) return (
    <div className="page-container">
      <SkeletonTable rows={8} />
    </div>
  )

  return (
    <div className="page-container">
      {/* ── Header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1>✅ Reuniões Concluídas</h1>
          <p>Histórico de compromissos finalizados</p>
        </div>
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterField}>
          <label>Mês</label>
          <select value={pendingMonth} onChange={(e) => setPendingMonth(e.target.value)}>
            <option value="">Todos os meses</option>
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        <div className={styles.filterField}>
          <label>Responsável</label>
          <input
            type="text"
            placeholder="Nome do responsável..."
            value={pendingResp}
            onChange={(e) => setPendingResp(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          />
        </div>

        <button className="btn btn-primary" style={{ alignSelf: 'flex-end' }} onClick={applyFilters}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: 4 }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Filtrar
        </button>
      </div>

      {error && (
        <div className={styles.errorBox}>
          <p>Não foi possível carregar. Tente novamente.</p>
          <button className="btn btn-outline" onClick={() => fetchCompleted(page)}>Tentar novamente</button>
        </div>
      )}

      {/* ── Empty ── */}
      {!error && total === 0 && (
        <div className={styles.emptyBox}>
          <span style={{ fontSize: '2.5rem' }}>🎉</span>
          <p>Nenhuma reunião concluída ainda.</p>
        </div>
      )}

      {/* ── Table ── */}
      {!error && total > 0 && (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Data</th>
                  <th>Hora</th>
                  <th>Responsável</th>
                  <th>Avaliação</th>
                  <th>Concluído em</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, idx) => (
                  <motion.tr key={ev.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.25 }}>

                    <td>
                      <div className={styles.cellTitle}>{ev.title}</div>
                      {ev.completion_note && (
                        <div className={styles.cellNote}>💬 {ev.completion_note}</div>
                      )}
                    </td>
                    <td className={styles.cellDate}>{fmtDate(ev.date)}</td>
                    <td className={styles.cellMuted}>{ev.time ? ev.time.slice(0,5) : '—'}</td>
                    <td>
                      <span className={styles.responsible}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                        {ev.created_by_name}
                      </span>
                    </td>
                    <td><Stars value={ev.rating} /></td>
                    <td className={styles.cellMuted}>
                      {ev.completed_at ? fmtDateTime(ev.completed_at) : '—'}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={`${styles.iconBtn} ${styles.iconView}`}
                          onClick={() => setViewModal(ev)}
                          title="Visualizar"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>


                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className={styles.paginationRow}>
            <div className={styles.pagination}>
              <button className={styles.pageBtn} onClick={() => goToPage(page - 1)} disabled={page === 1}>‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`${styles.pageBtn} ${p === page ? styles.pageBtnActive : ''}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
              <button className={styles.pageBtn} onClick={() => goToPage(page + 1)} disabled={page === totalPages}>›</button>
            </div>
            <span className={styles.pageInfo}>
              Página {page} de {totalPages} · {total} reunião{total !== 1 ? 'ões' : ''}
            </span>
          </div>
        </>
      )}

      {viewModal && <EventViewModal event={viewModal} onClose={() => setViewModal(null)} />}
    </div>
  )
}

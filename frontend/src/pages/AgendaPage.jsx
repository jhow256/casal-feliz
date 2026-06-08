import { useState, useEffect, useCallback, useMemo } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import EventCard from '../components/EventCard'
import EventModal from '../components/EventModal'
import EventViewModal from '../components/EventViewModal'
import CompleteModal from '../components/CompleteModal'
import styles from './AgendaPage.module.css'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

export default function AgendaPage() {
  const { user } = useAuth()
  const [events, setEvents]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(false)
  const [editModal, setEditModal]     = useState(null)
  const [viewModal, setViewModal]     = useState(null)
  const [completeTarget, setCompleteTarget] = useState(null)

  // filters
  const [search, setSearch]   = useState('')
  const [filterMonth, setFilterMonth] = useState('')

  const fetchEvents = useCallback(async () => {
    setLoading(true); setError(false)
    try {
      const { data } = await api.get('/api/events/?completed=false')
      setEvents(data)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  // ── client-side filtering ─────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return events.filter((ev) => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q) ||
        ev.created_by_name.toLowerCase().includes(q)
      const matchMonth = !filterMonth ||
        new Date(ev.date + 'T00:00:00').getMonth() === parseInt(filterMonth)
      return matchSearch && matchMonth
    })
  }, [events, search, filterMonth])

  // ── CRUD handlers ─────────────────────────────────────────────────────────
  async function handleSave(formData) {
    try {
      if (editModal?.id) {
        const { data } = await api.patch(`/api/events/${editModal.id}/`, formData)
        setEvents((p) => p.map((e) => (e.id === editModal.id ? data : e)))
        toast.success('Compromisso atualizado! 📅')
      } else {
        const { data } = await api.post('/api/events/', formData)
        setEvents((p) => [...p, data].sort((a, b) => a.date.localeCompare(b.date)))
        toast.success('Compromisso adicionado! 📅')
      }
      setEditModal(null)
    } catch (err) {
      const detail = err.response?.data
      toast.error(detail ? Object.values(detail).flat().join(' ') : 'Erro ao salvar.')
      throw err
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover este compromisso?')) return
    try {
      await api.delete(`/api/events/${id}/`)
      setEvents((p) => p.filter((e) => e.id !== id))
      toast.success('Compromisso removido.')
    } catch (err) {
      toast.error(err.response?.status === 403
        ? 'Você só pode remover seus próprios compromissos.'
        : 'Erro ao remover.')
    }
  }

  async function handleDuplicate(id) {
    try {
      const { data } = await api.post(`/api/events/${id}/duplicate/`)
      setEvents((p) => [...p, data].sort((a, b) => a.date.localeCompare(b.date)))
      toast.success('Compromisso duplicado! 📋')
    } catch { toast.error('Erro ao duplicar.') }
  }

  function handleComplete(id) {
    const ev = events.find((e) => e.id === id)
    if (ev) setCompleteTarget(ev)
  }

  async function handleConfirmComplete({ rating, completion_note, photos }) {
    try {
      await api.post(`/api/events/${completeTarget.id}/complete/`, { rating, completion_note })

      // Upload de até 3 fotos na galeria
      for (const photo of (photos || [])) {
        const form = new FormData()
        form.append('photo', photo)
        await api.post(`/api/events/${completeTarget.id}/gallery/`, form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setEvents((p) => p.filter((e) => e.id !== completeTarget.id))
      setCompleteTarget(null)
      toast.success('Compromisso concluído! ✅')
    } catch (err) {
      toast.error(err.response?.status === 403
        ? 'Você só pode concluir seus próprios compromissos.'
        : 'Erro ao concluir.')
    }
  }

  async function handlePhotoUpload(id, file) {
    const form = new FormData()
    form.append('photo', file)
    try {
      const { data } = await api.post(`/api/events/${id}/photo/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setEvents((p) => p.map((e) => (e.id === id ? data : e)))
      toast.success('Foto adicionada! 📷')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erro ao enviar foto.')
    }
  }

  if (loading) return <div className="spinner" style={{ marginTop: 80 }} />

  return (
    <div className="page-container">
      {/* ── Page header ── */}
      <div className={styles.pageHeader}>
        <div>
          <h1>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            Registros Ativos
          </h1>
          <p>Gerencie os compromissos ativos do casal</p>
        </div>
        <button className="btn btn-primary" onClick={() => setEditModal({})}>
          + Nova Ficha
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className={styles.filterBar}>
        <div className={styles.filterField}>
          <label>Buscar</label>
          <input
            type="text"
            placeholder="Título, descrição ou responsável..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterField} style={{ maxWidth: 180 }}>
          <label>Mês</label>
          <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            <option value="">Todos</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
        </div>

        <button
          className="btn btn-primary"
          style={{ alignSelf: 'flex-end', gap: 6 }}
          onClick={() => { setSearch(''); setFilterMonth('') }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Limpar
        </button>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className={styles.errorBox}>
          <p>Não foi possível carregar os compromissos. Tente novamente.</p>
          <button className="btn btn-outline" onClick={fetchEvents}>Tentar novamente</button>
        </div>
      )}

      {/* ── Empty state ── */}
      {!error && filtered.length === 0 && (
        <div className={styles.emptyBox}>
          <div className={styles.emptyIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="11" y2="17"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="13" y1="6" x2="17" y2="10"/>
            </svg>
          </div>
          <p>{search || filterMonth ? 'Nenhum resultado encontrado' : 'Nenhum registro em andamento'}</p>
          {!search && !filterMonth && (
            <button className="btn btn-primary" onClick={() => setEditModal({})}>
              + Nova Ficha
            </button>
          )}
        </div>
      )}

      {/* ── Cards grid ── */}
      {!error && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((ev) => (
            <EventCard
              key={ev.id}
              event={ev}
              isOwner={ev.created_by === user?.id}
              onView={setViewModal}
              onEdit={setEditModal}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onComplete={handleComplete}
              onPhotoUpload={handlePhotoUpload}
            />
          ))}
        </div>
      )}

      {editModal !== null && (
        <EventModal
          initial={editModal?.id ? editModal : null}
          onSave={handleSave}
          onClose={() => setEditModal(null)}
        />
      )}
      {viewModal && <EventViewModal event={viewModal} onClose={() => setViewModal(null)} />}
      {completeTarget && (
        <CompleteModal
          eventTitle={completeTarget.title}
          onConfirm={handleConfirmComplete}
          onClose={() => setCompleteTarget(null)}
        />
      )}
    </div>
  )
}

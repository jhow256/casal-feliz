import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  // Already logged in → redirect
  useEffect(() => {
    if (user) navigate('/carousel', { replace: true })
  }, [user, navigate])

  // Show session-expired toast
  useEffect(() => {
    if (params.get('expired')) {
      toast.error('Sua sessão expirou. Faça login novamente.')
    }
  }, [params])

  function validate() {
    const errs = {}
    if (!username.trim()) errs.username = 'O usuário é obrigatório.'
    if (!password) errs.password = 'A senha é obrigatória.'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    setErrors({})
    try {
      await login(username.trim(), password)
      navigate('/carousel', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.error || 'Credenciais inválidas.'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.header}>
          <span className={styles.heartBig}>♥</span>
          <h1 className={styles.title}>Nosso Cantinho</h1>
          <p className={styles.subtitle}>Bem-vindo(a) de volta 💕</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Usuário</label>
            <input
              id="username"
              type="text"
              placeholder="seu usuário"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
            />
            {errors.username && <span className="error-msg">{errors.username}</span>}
          </div>

          <div className="field">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}

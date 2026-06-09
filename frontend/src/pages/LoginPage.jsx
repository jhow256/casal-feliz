import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import styles from './LoginPage.module.css'

export default function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const [username, setUsername]       = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)

  useEffect(() => { if (user) navigate('/carousel', { replace: true }) }, [user, navigate])
  useEffect(() => { if (params.get('expired')) toast.error('Sua sessão expirou. Faça login novamente.') }, [params])

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
    setLoading(true); setErrors({})
    try {
      await login(username.trim(), password)
      navigate('/carousel', { replace: true })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Credenciais inválidas.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1 }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <div className={styles.header}>
          <motion.div
            className={styles.heartBig}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <svg viewBox="0 0 80 72" width="100" height="90" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#5aaced"/>
                  <stop offset="100%" stopColor="#2a7bbf"/>
                </linearGradient>
              </defs>
              <path
                d="M40 66 C40 66 6 44 6 22 C6 11.5 14.5 3 25 3 C31.5 3 37.2 6.2 40 11 C42.8 6.2 48.5 3 55 3 C65.5 3 74 11.5 74 22 C74 44 40 66 40 66Z"
                fill="url(#hg)"
              />
              <text x="40" y="36" textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize="16" fontWeight="800"
                fontFamily="'Segoe UI', system-ui, sans-serif" letterSpacing="1">
                J+E
              </text>
            </svg>
          </motion.div>
          <h1 className={styles.title}>Nosso Cantinho</h1>
          <p className={styles.subtitle}>Bem-vindo(a) de volta 💕</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <motion.div className="field" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <label htmlFor="username">Usuário</label>
            <input id="username" type="text" placeholder="seu usuário"
              value={username} onChange={e => setUsername(e.target.value)}
              autoComplete="username" autoFocus />
            {errors.username && <span className="error-msg">{errors.username}</span>}
          </motion.div>

          <motion.div className="field" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.22 }}>
            <label htmlFor="password">Senha</label>
            <div className={styles.passwordWrapper}>
              <input id="password" type={showPassword ? 'text' : 'password'}
                placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
              <button type="button" className={styles.eyeBtn}
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="error-msg">{errors.password}</span>}
          </motion.div>

          <motion.button
            type="submit"
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  )
}

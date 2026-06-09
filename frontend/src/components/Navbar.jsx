import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import styles from './Navbar.module.css'

const linkVariants = {
  tap: { scale: 0.94 },
}

function ThemeToggle() {
  const { theme, toggle } = useTheme()
  return (
    <motion.button
      className={styles.themeBtn}
      onClick={toggle}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.08 }}
      aria-label="Alternar tema"
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
    >
      {theme === 'dark' ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22"   x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78"  x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </motion.button>
  )
}

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <motion.div
          className={styles.heartBadge}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 48 44" width="40" height="36" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M24 40 C24 40 4 26 4 14 C4 7.4 9.4 2 16 2 C19.6 2 22.8 3.6 24 6 C25.2 3.6 28.4 2 32 2 C38.6 2 44 7.4 44 14 C44 26 24 40 24 40Z"
              fill="white"
            />
            <text x="24" y="22" textAnchor="middle" dominantBaseline="middle"
              fill="#2a7bbf" fontSize="11" fontWeight="800"
              fontFamily="'Segoe UI', system-ui, sans-serif" letterSpacing="0.5">
              J+E
            </text>
          </svg>
        </motion.div>
        <span className={styles.brandName}>Nosso Cantinho</span>
      </div>

      <div className={styles.links}>
        {[
          { to: '/carousel',   label: '🏠 Início' },
          { to: '/agenda',     label: '📅 Agenda' },
          { to: '/concluidas', label: '✅ Concluídas' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            {({ isActive }) => (
              <motion.span
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.94 }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {label}
                {isActive && (
                  <motion.div
                    className={styles.activeIndicator}
                    layoutId="nav-indicator"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.span>
            )}
          </NavLink>
        ))}
      </div>

      <div className={styles.user}>
        <ThemeToggle />
        <span className={styles.userName}>Olá, {user?.name?.split(' ')[0]} 💕</span>
        <motion.button
          className={`btn btn-outline ${styles.logoutBtn}`}
          onClick={logout}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.95 }}
        >
          Sair
        </motion.button>
      </div>
    </nav>
  )
}

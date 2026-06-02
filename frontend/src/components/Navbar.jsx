import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import styles from './Navbar.module.css'

export default function Navbar() {
  const { user, logout } = useAuth()

  return (
    <nav className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.heart}>♥</span>
        <span className={styles.brandName}>Nosso Cantinho</span>
      </div>

      <div className={styles.links}>
        <NavLink
          to="/carousel"
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          📷 Fotos
        </NavLink>
        <NavLink
          to="/agenda"
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          📅 Agenda
        </NavLink>
        <NavLink
          to="/concluidas"
          className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
        >
          ✅ Concluídas
        </NavLink>
      </div>

      <div className={styles.user}>
        <span className={styles.userName}>Olá, {user?.name?.split(' ')[0]} 💕</span>
        <button className={`btn btn-outline ${styles.logoutBtn}`} onClick={logout}>
          Sair
        </button>
      </div>
    </nav>
  )
}

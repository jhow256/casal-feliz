import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import CarouselPage from './pages/CarouselPage'
import AgendaPage from './pages/AgendaPage'
import CompletedPage from './pages/CompletedPage'
import MessagesPage from './pages/MessagesPage'

const pageVariants = {
  initial: { opacity: 0, y: 16, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0,  filter: 'blur(0px)',
    transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -8, filter: 'blur(4px)',
    transition: { duration: 0.2,  ease: [0.4, 0, 1, 1] } },
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: 'opacity, transform' }}
    >
      {children}
    </motion.div>
  )
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<AnimatedPage><LoginPage /></AnimatedPage>} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/carousel" replace />} />
            <Route path="/carousel"   element={<AnimatedPage><CarouselPage /></AnimatedPage>} />
            <Route path="/agenda"     element={<AnimatedPage><AgendaPage /></AnimatedPage>} />
            <Route path="/concluidas" element={<AnimatedPage><CompletedPage /></AnimatedPage>} />
            <Route path="/mensagens"  element={<AnimatedPage><MessagesPage /></AnimatedPage>} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AnimatedRoutes />
    </AuthProvider>
  )
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import CarouselPage from './pages/CarouselPage'
import AgendaPage from './pages/AgendaPage'
import CompletedPage from './pages/CompletedPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/carousel" replace />} />
            <Route path="/carousel" element={<CarouselPage />} />
            <Route path="/agenda" element={<AgendaPage />} />
            <Route path="/concluidas" element={<CompletedPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

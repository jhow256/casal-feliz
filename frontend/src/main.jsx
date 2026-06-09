import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import App from './App'
import './styles/global.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: '14px',
              fontSize: '14px',
              background: 'var(--surface-solid)',
              color: 'var(--text)',
              border: '1px solid var(--border-solid)',
              backdropFilter: 'blur(20px)',
              boxShadow: 'var(--shadow)',
            },
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)

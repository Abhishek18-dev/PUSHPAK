import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "./index.css"
import App from './App.tsx'
import { useAppStore } from './store'
import { Toaster } from 'sonner'

// Bind Zustand store to window so mock API functions can update state directly
(window as any).__store__ = useAppStore;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Toaster richColors />
    <App />
  </StrictMode>,
)

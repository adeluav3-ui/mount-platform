// src/main.jsx - FIXED VERSION
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { SupabaseProvider } from './context/SupabaseContext.jsx'
import './index.css'
import ErrorBoundary from './components/ErrorBoundary.jsx'

console.log('=== MAIN.JSX STARTING ===')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SupabaseProvider>
      <App />
    </SupabaseProvider>
  </React.StrictMode>,
)
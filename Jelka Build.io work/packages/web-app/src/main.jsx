import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'

// Register service worker for PWA functionality in production or staging environments
const isProduction = import.meta.env.PROD
const isStaging = window.location.hostname.includes('.fly.dev') || window.location.hostname.includes('staging')
const shouldRegisterSW = isProduction || isStaging

if ('serviceWorker' in navigator && shouldRegisterSW) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);

        // iOS specific handling
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          console.log('iOS device detected - PWA notifications require home screen installation');
        }
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)

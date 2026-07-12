import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MeshProvider } from '@meshsdk/react'
import '@meshsdk/react/styles.css'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from '@/hooks/useAuth'
import { CloudBootstrap } from '@/components/CloudStatus'
import { startCloudSync } from '@/lib/cloudSync'

// Kick multi-user sync as early as possible
void startCloudSync()

const routerBase = import.meta.env.BASE_URL === '/' || import.meta.env.BASE_URL === './'
  ? undefined
  : import.meta.env.BASE_URL

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MeshProvider>
      <BrowserRouter basename={routerBase}>
        <AuthProvider>
          <CloudBootstrap />
          <App />
        </AuthProvider>
      </BrowserRouter>
    </MeshProvider>
  </StrictMode>,
)

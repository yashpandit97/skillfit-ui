import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { JobInputPage } from './pages/JobInputPage'
import { QuestionnairePage } from './pages/QuestionnairePage'
import { SkillGapDashboardPage } from './pages/SkillGapDashboardPage'
import { ResumePreviewPage } from './pages/ResumePreviewPage'
import { DownloadPage } from './pages/DownloadPage'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/job" replace />} />
          <Route path="job" element={<ProtectedRoute><JobInputPage /></ProtectedRoute>} />
          <Route path="questionnaire/:jobId" element={<ProtectedRoute><QuestionnairePage /></ProtectedRoute>} />
          <Route path="gap" element={<ProtectedRoute><SkillGapDashboardPage /></ProtectedRoute>} />
          <Route path="resume/:jobId" element={<ProtectedRoute><ResumePreviewPage /></ProtectedRoute>} />
          <Route path="download/:jobId" element={<ProtectedRoute><DownloadPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

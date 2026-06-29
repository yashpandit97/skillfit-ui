import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { JobInputPage } from './pages/JobInputPage'
import { QuestionnairePage } from './pages/QuestionnairePage'
import { SkillGapDashboardPage } from './pages/SkillGapDashboardPage'
import { ResumePreviewPage } from './pages/ResumePreviewPage'
import { DownloadPage } from './pages/DownloadPage'
import { ProfilePage } from './pages/ProfilePage'
import { JobHistoryPage } from './pages/JobHistoryPage'
import { JobComparePage } from './pages/JobComparePage'
import { InterviewPrepPage } from './pages/InterviewPrepPage'
import { SkillGraphPage } from './pages/SkillGraphPage'
import { SharedPage } from './pages/SharedPage'
import { FitReportPage } from './pages/FitReportPage'
import { LoginPage } from './pages/LoginPage'
import { useAuthStore, waitForAuthHydration } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token)
  const [ready, setReady] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setReady(true)
      return
    }
    void waitForAuthHydration().then(() => setReady(true))
  }, [])

  if (!ready) return null
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/shared/:token" element={<SharedPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/job" replace />} />
          <Route path="job" element={<ProtectedRoute><JobInputPage /></ProtectedRoute>} />
          <Route path="job/history" element={<ProtectedRoute><JobHistoryPage /></ProtectedRoute>} />
          <Route path="job/compare" element={<ProtectedRoute><JobComparePage /></ProtectedRoute>} />
          <Route path="questionnaire/:jobId" element={<ProtectedRoute><QuestionnairePage /></ProtectedRoute>} />
          <Route path="fit-report/:jobId" element={<ProtectedRoute><FitReportPage /></ProtectedRoute>} />
          <Route path="gap" element={<ProtectedRoute><SkillGapDashboardPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="resume/:jobId" element={<ProtectedRoute><ResumePreviewPage /></ProtectedRoute>} />
          <Route path="interview-prep/:jobId" element={<ProtectedRoute><InterviewPrepPage /></ProtectedRoute>} />
          <Route path="gap/:jobId/graph" element={<ProtectedRoute><SkillGraphPage /></ProtectedRoute>} />
          <Route path="download/:jobId" element={<ProtectedRoute><DownloadPage /></ProtectedRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

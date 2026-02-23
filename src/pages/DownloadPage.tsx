import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { HiDownload, HiDocumentText } from 'react-icons/hi'
import { resumeApi } from '../api/client'
import './DownloadPage.css'

export function DownloadPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleDownload = async () => {
    setError('')
    setLoading(true)
    try {
      const blob = await resumeApi.downloadBlob(id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resume_${id}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('Download failed. Resume may not be ready.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="downloadPage animateFadeIn">
      <h1 className="pageTitle">Download resume</h1>
      <p className="pageSubtitle">Get your ATS-friendly resume as a Word document (.docx).</p>
      <div className="downloadCard card">
        {error && <p className="error downloadError">{error}</p>}
        <button
          onClick={handleDownload}
          disabled={loading}
          className="btn btnPrimary downloadBtn"
        >
          <HiDownload className="btnIcon" aria-hidden />
          {loading ? 'Preparing...' : 'Download .docx'}
        </button>
        <Link to={`/resume/${id}`} className="downloadBack">
          <HiDocumentText className="btnIcon" aria-hidden />
          Back to preview
        </Link>
      </div>
    </div>
  )
}

import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import { Box } from '@chakra-ui/react'
import { HiDownload, HiDocumentText } from 'react-icons/hi'
import { resumeApi } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { toaster } from '../lib/toaster'

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
      toaster.create({ title: 'Resume downloaded', type: 'success' })
    } catch {
      setError('Download failed. Resume may not be ready.')
      toaster.create({ title: 'Download failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  if (!Number.isFinite(id)) {
    return <Alert status="error">Invalid job ID</Alert>
  }

  return (
    <Box maxW="480px" mx="auto">
      <PageHeader
        title="Download resume"
        subtitle="Get your ATS-friendly resume as a Word document (.docx)."
        breadcrumbs={[{ label: 'Resume', to: `/resume/${id}` }, { label: 'Download' }]}
      />
      <Card textAlign="center">
        {error && <Alert status="error">{error}</Alert>}
        <Button onClick={handleDownload} loading={loading} size="lg" icon={<HiDownload aria-hidden />}>
          {loading ? 'Preparing…' : 'Download .docx'}
        </Button>
        <Box mt={4}>
          <Link to={`/resume/${id}`}>
            <Button variant="ghost" icon={<HiDocumentText aria-hidden />}>
              Back to preview
            </Button>
          </Link>
        </Box>
      </Card>
    </Box>
  )
}

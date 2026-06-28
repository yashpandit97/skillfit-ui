import { useParams } from 'react-router-dom'
import { HiDownload } from 'react-icons/hi'
import { Box } from '@chakra-ui/react'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'

export function SharedPage() {
  const { token } = useParams<{ token: string }>()
  const apiBase = typeof window !== 'undefined' ? window.location.origin : ''
  const downloadUrl = token ? `${apiBase}/api/resume/shared/${token}` : ''

  if (!token) {
    return (
      <Card>
        <EmptyState title="Invalid share link" description="This link is missing a token." />
      </Card>
    )
  }

  return (
    <Box maxW="480px" mx="auto">
      <PageHeader title="Shared resume" subtitle="Click below to download the resume." />
      <Card textAlign="center">
        <a href={downloadUrl} download target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <Button size="lg" icon={<HiDownload aria-hidden />}>
            Download resume (.docx)
          </Button>
        </a>
      </Card>
    </Box>
  )
}

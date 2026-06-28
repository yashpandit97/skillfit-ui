import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Box, Flex, Text, NativeSelect } from '@chakra-ui/react'
import { HiBriefcase, HiChartBar, HiDocumentText, HiDownload, HiClipboardList } from 'react-icons/hi'
import { jobApi, type JobSubmissionListItem } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, statusTone } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

function workflowLabel(mode?: string | null): string {
  if (mode === 'fit_report') return 'Fit Report'
  if (mode === 'questionnaire') return 'Questionnaire'
  return 'Questionnaire'
}

function workflowTone(mode?: string | null): 'info' | 'default' {
  return mode === 'fit_report' ? 'info' : 'default'
}

export function JobHistoryPage() {
  const navigate = useNavigate()
  const [compareLeft, setCompareLeft] = useState<number | null>(null)
  const [compareRight, setCompareRight] = useState<number | null>(null)

  const { data, isLoading, error } = useQuery({
    queryKey: ['job-list'],
    queryFn: () => jobApi.list(),
  })

  const items: JobSubmissionListItem[] = data?.data?.items ?? []

  const handleCompare = () => {
    if (compareLeft != null && compareRight != null && compareLeft !== compareRight) {
      navigate(`/job/compare?id1=${compareLeft}&id2=${compareRight}`)
    }
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton height="32px" width="200px" mb={4} />
        <Skeleton height="120px" mb={3} />
        <Skeleton height="120px" />
      </Box>
    )
  }
  if (error) return <Text color="red.400">Failed to load jobs.</Text>

  return (
    <Box>
      <PageHeader
        title="Job history"
        subtitle="Your past job submissions. Open fit report, questionnaire, gap, or download resume."
        breadcrumbs={[{ label: 'Job input', to: '/job' }, { label: 'History' }]}
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HiBriefcase size={48} />}
            title="No jobs yet"
            description="Paste your first job description to get started."
            action={
              <Link to="/job">
                <Button>Paste your first JD</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <Card mb={6} p={4}>
            <Flex gap={3} align="center" flexWrap="wrap">
              <Text fontSize="sm">Compare:</Text>
              <NativeSelect.Root size="sm" w="180px">
                <NativeSelect.Field value={compareLeft ?? ''} onChange={(e) => setCompareLeft(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Select job</option>
                  {items.map((j) => (
                    <option key={j.id} value={j.id}>
                      #{j.id} {j.job_title || 'Untitled'}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
              <Text fontSize="sm">vs</Text>
              <NativeSelect.Root size="sm" w="180px">
                <NativeSelect.Field value={compareRight ?? ''} onChange={(e) => setCompareRight(e.target.value ? Number(e.target.value) : null)}>
                  <option value="">Select job</option>
                  {items.map((j) => (
                    <option key={j.id} value={j.id}>
                      #{j.id} {j.job_title || 'Untitled'}
                    </option>
                  ))}
                </NativeSelect.Field>
              </NativeSelect.Root>
              <Button variant="outline" onClick={handleCompare} disabled={compareLeft == null || compareRight == null || compareLeft === compareRight}>
                Compare
              </Button>
            </Flex>
          </Card>

          <Flex direction="column" gap={3}>
            {items.map((job) => (
              <Card key={job.id} p={4}>
                <Flex justify="space-between" align="flex-start" flexWrap="wrap" gap={2} mb={3}>
                  <Box>
                    <Text fontWeight="600">{job.job_title || 'Untitled'}</Text>
                    {job.company_name && (
                      <Text fontSize="sm" color="fg.muted">
                        {job.company_name}
                      </Text>
                    )}
                    <Text fontSize="xs" color="fg.muted" mt={1}>
                      #{job.id} · {new Date(job.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                  <Flex gap={2} flexWrap="wrap">
                    <Badge tone={workflowTone(job.workflow_mode)}>{workflowLabel(job.workflow_mode)}</Badge>
                    <Badge tone={statusTone(job.status)}>{job.status}</Badge>
                  </Flex>
                </Flex>
                <Flex gap={2} flexWrap="wrap">
                  {job.status === 'fit_report_ready' && (
                    <Link to={`/fit-report/${job.id}`}>
                      <Button variant="outline" size="sm" icon={<HiClipboardList aria-hidden />}>
                        Fit report
                      </Button>
                    </Link>
                  )}
                  <Link to={`/questionnaire/${job.id}`}>
                    <Button variant="outline" size="sm">
                      Questionnaire
                    </Button>
                  </Link>
                  <Link to={`/gap`}>
                    <Button variant="outline" size="sm" icon={<HiChartBar aria-hidden />}>
                      Gap
                    </Button>
                  </Link>
                  <Link to={`/resume/${job.id}`}>
                    <Button variant="outline" size="sm" icon={<HiDocumentText aria-hidden />}>
                      Resume
                    </Button>
                  </Link>
                  <Link to={`/download/${job.id}`}>
                    <Button variant="ghost" size="sm" icon={<HiDownload aria-hidden />}>
                      Download
                    </Button>
                  </Link>
                </Flex>
              </Card>
            ))}
          </Flex>
        </>
      )}
    </Box>
  )
}

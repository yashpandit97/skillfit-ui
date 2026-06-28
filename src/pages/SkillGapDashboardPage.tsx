import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Box, Flex, Text } from '@chakra-ui/react'
import { HiChartBar, HiExclamation, HiLightBulb, HiShieldExclamation, HiDocumentText, HiViewGrid } from 'react-icons/hi'
import { gapApi, normalizeGapItem } from '../api/client'
import type { SkillGapDashboardItem } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, statusTone } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'
import { toaster } from '../lib/toaster'

function ExportGapButton({ jobId, format, label }: { jobId: number; format: 'md' | 'pdf'; label: string }) {
  const [loading, setLoading] = useState(false)
  const handleExport = async () => {
    setLoading(true)
    try {
      const blob = await gapApi.exportBlob(jobId, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `gap-report-${jobId}.${format}`
      a.click()
      URL.revokeObjectURL(url)
      toaster.create({ title: 'Export downloaded', type: 'success' })
    } catch {
      toaster.create({ title: 'Export failed', type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button variant="outline" size="sm" onClick={handleExport} loading={loading}>
      {label}
    </Button>
  )
}

export function SkillGapDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gap-list'],
    queryFn: () => gapApi.list(),
  })

  const items: SkillGapDashboardItem[] = data?.data?.items ?? []

  if (isLoading) {
    return (
      <Box>
        <Skeleton height="32px" width="280px" mb={4} />
        <Skeleton height="200px" />
      </Box>
    )
  }
  if (error) return <Text color="red.400">Failed to load skill gaps.</Text>

  return (
    <Box>
      <PageHeader
        title="Skill gap dashboard"
        subtitle="Review weaknesses, improvement suggestions, and resume risks from your concept checklists."
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HiChartBar size={48} />}
            title="No skill gap records yet"
            description="Complete a job questionnaire to see your gaps and get a resume."
            action={
              <Link to="/job">
                <Button>Paste your first JD</Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <Flex direction="column" gap={4}>
          {items.map((item) => (
            <Card key={item.job_submission_id} p={5}>
              <Flex justify="space-between" align="center" mb={4} flexWrap="wrap" gap={2}>
                <Text fontWeight="600">Job #{item.job_submission_id}</Text>
                <Badge tone={statusTone(item.overall_gap_severity)}>{item.overall_gap_severity}</Badge>
              </Flex>

              <Flex direction="column" gap={3}>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                    <HiExclamation style={{ display: 'inline', marginRight: 8 }} aria-hidden />
                    Weaknesses
                  </summary>
                  <Box as="ul" pl={4} mt={2} fontSize="sm" color="fg.muted">
                    {(item.weaknesses ?? []).map((w, i) => {
                      const n = normalizeGapItem(w)
                      return (
                        <Box as="li" key={i} mb={1}>
                          {n.text}
                        </Box>
                      )
                    })}
                  </Box>
                </details>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                    <HiLightBulb style={{ display: 'inline', marginRight: 8 }} aria-hidden />
                    Improvements
                  </summary>
                  <Box as="ul" pl={4} mt={2} fontSize="sm" color="fg.muted">
                    {(item.improvement_suggestions ?? []).map((s, i) => {
                      const n = normalizeGapItem(s)
                      return (
                        <Box as="li" key={i} mb={1}>
                          {n.text}
                        </Box>
                      )
                    })}
                  </Box>
                </details>
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: 500 }}>
                    <HiShieldExclamation style={{ display: 'inline', marginRight: 8 }} aria-hidden />
                    Resume risks
                  </summary>
                  <Box as="ul" pl={4} mt={2} fontSize="sm" color="fg.muted">
                    {(item.resume_risk_claims ?? []).map((r, i) => (
                      <Box as="li" key={i} mb={1}>
                        {r.claim}: {r.risk}
                      </Box>
                    ))}
                  </Box>
                </details>
              </Flex>

              <Flex gap={2} mt={4} flexWrap="wrap">
                <Link to={`/gap/${item.job_submission_id}/graph`}>
                  <Button variant="outline" size="sm" icon={<HiViewGrid aria-hidden />}>
                    Skill graph
                  </Button>
                </Link>
                <Link to={`/resume/${item.job_submission_id}`}>
                  <Button variant="outline" size="sm" icon={<HiDocumentText aria-hidden />}>
                    Resume
                  </Button>
                </Link>
                <ExportGapButton jobId={item.job_submission_id} format="md" label="Export MD" />
                <ExportGapButton jobId={item.job_submission_id} format="pdf" label="Export PDF" />
              </Flex>
            </Card>
          ))}
        </Flex>
      )}
    </Box>
  )
}

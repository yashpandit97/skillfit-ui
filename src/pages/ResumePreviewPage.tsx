import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Box, Flex, Text, Heading, Switch, NativeSelect } from '@chakra-ui/react'
import { HiDownload, HiChartBar, HiAcademicCap, HiShare } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import { resumeApi, type ResumeVersionItem } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ResumePaper } from '../components/ui/ResumePaper'
import { AtsGauge } from '../components/ui/AtsGauge'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { toaster } from '../lib/toaster'

function ShareButton({ jobId }: { jobId: number }) {
  const [loading, setLoading] = useState(false)
  const handleShare = async () => {
    setLoading(true)
    try {
      const { data } = await resumeApi.share(jobId)
      await navigator.clipboard.writeText(data.share_url)
      toaster.create({ title: 'Share link copied', type: 'success' })
    } catch {
      toaster.create({ title: 'Failed to create share link', type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button variant="outline" onClick={handleShare} loading={loading} icon={<HiShare aria-hidden />}>
      Share
    </Button>
  )
}

function TailoredSummaryButton({ jobId }: { jobId: number }) {
  const [loading, setLoading] = useState(false)
  const handleCopy = async () => {
    setLoading(true)
    try {
      const { data } = await resumeApi.tailoredSummary(jobId)
      await navigator.clipboard.writeText(data.one_liner)
      toaster.create({ title: 'One-liner copied', type: 'success' })
    } catch {
      toaster.create({ title: 'Failed to generate one-liner', type: 'error' })
    } finally {
      setLoading(false)
    }
  }
  return (
    <Button variant="outline" onClick={handleCopy} loading={loading}>
      Copy one-liner
    </Button>
  )
}

export function ResumePreviewPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
  const [diffV1, setDiffV1] = useState<number | null>(null)
  const [diffV2, setDiffV2] = useState<number | null>(null)
  const [gapsOnly, setGapsOnly] = useState(false)

  const { data: versionsData } = useQuery({
    queryKey: ['resume-versions', id],
    queryFn: () => resumeApi.versions(id),
    enabled: Number.isFinite(id),
  })
  const versions: ResumeVersionItem[] = versionsData?.data?.versions ?? []

  const previewQueryKey = selectedVersion != null ? ['resume-preview', id, selectedVersion] : ['resume-preview', id]
  const previewQueryFn =
    selectedVersion != null ? () => resumeApi.previewVersion(id, selectedVersion) : () => resumeApi.preview(id)

  const { data, isLoading, error } = useQuery({
    queryKey: previewQueryKey,
    queryFn: previewQueryFn,
    enabled: Number.isFinite(id),
  })

  const { data: diffData } = useQuery({
    queryKey: ['resume-diff', id, diffV1, diffV2],
    queryFn: () => resumeApi.diff(id, diffV1!, diffV2!),
    enabled: Number.isFinite(id) && diffV1 != null && diffV2 != null && diffV1 !== diffV2,
  })
  const diff = diffData?.data

  const { data: atsData } = useQuery({
    queryKey: ['resume-ats', id],
    queryFn: () => resumeApi.atsScore(id),
    enabled: Number.isFinite(id),
  })
  const ats = atsData?.data

  if (isLoading || !Number.isFinite(id)) {
    return (
      <Box>
        <Skeleton height="32px" width="240px" mb={4} />
        <Skeleton height="400px" />
      </Box>
    )
  }
  if (error) return <Alert status="error">Resume not found. Complete the questionnaire first.</Alert>

  const resume = data?.data?.resume_structured
  if (!resume) return <Alert status="info">No resume data.</Alert>

  const toolbar = (
    <Flex gap={2} flexWrap="wrap" align="center">
      <Link to={`/interview-prep/${id}`}>
        <Button variant="outline" icon={<HiAcademicCap aria-hidden />}>
          Interview prep
        </Button>
      </Link>
      <Link to={`/download/${id}`}>
        <Button icon={<HiDownload aria-hidden />}>Download .docx</Button>
      </Link>
      <a href={resumeApi.downloadPdfUrl(id)} download target="_blank" rel="noopener noreferrer">
        <Button variant="outline">Download PDF</Button>
      </a>
      <ShareButton jobId={id} />
      <TailoredSummaryButton jobId={id} />
      <Link to="/gap">
        <Button variant="ghost" icon={<HiChartBar aria-hidden />}>
          Skill gap
        </Button>
      </Link>
    </Flex>
  )

  return (
    <Box>
      <PageHeader
        title="Resume preview"
        subtitle="Your AI-tailored ATS resume"
        breadcrumbs={[{ label: 'Jobs', to: '/job/history' }, { label: 'Resume' }]}
        actions={toolbar}
      />

      {ats != null && (
        <Card mb={6} p={4}>
          <AtsGauge score={ats.score} missingKeywords={ats.missing_keywords} />
        </Card>
      )}

      {versions.length > 1 && (
        <Card mb={4} p={4}>
          <Flex gap={3} align="center" flexWrap="wrap">
            <Text fontSize="sm">Version:</Text>
            <NativeSelect.Root size="sm" w="auto">
              <NativeSelect.Field
                value={selectedVersion ?? ''}
                onChange={(e) => setSelectedVersion(e.target.value ? Number(e.target.value) : null)}
              >
                <option value="">Latest</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version} – {new Date(v.created_at).toLocaleString()}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
          </Flex>
        </Card>
      )}

      <Flex align="center" gap={3} mb={4}>
        <Switch.Root checked={gapsOnly} onCheckedChange={(e) => setGapsOnly(e.checked)}>
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label fontSize="sm">Show gaps only</Switch.Label>
        </Switch.Root>
      </Flex>

      {versions.length > 1 && (
        <Card mb={4} p={4}>
          <Text fontSize="sm" mb={2}>
            Compare versions:
          </Text>
          <Flex gap={2} flexWrap="wrap" align="center">
            <NativeSelect.Root size="sm" w="120px">
              <NativeSelect.Field value={diffV1 ?? ''} onChange={(e) => setDiffV1(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            <Text fontSize="sm">vs</Text>
            <NativeSelect.Root size="sm" w="120px">
              <NativeSelect.Field value={diffV2 ?? ''} onChange={(e) => setDiffV2(e.target.value ? Number(e.target.value) : null)}>
                <option value="">Select</option>
                {versions.map((v) => (
                  <option key={v.id} value={v.version}>
                    v{v.version}
                  </option>
                ))}
              </NativeSelect.Field>
            </NativeSelect.Root>
            {diff && (
              <Text fontSize="sm" color="fg.muted">
                {diff.added.length} added, {diff.removed.length} removed
              </Text>
            )}
          </Flex>
        </Card>
      )}

      <ResumePaper>
        {resume.summary && (!gapsOnly || resume.summary_deficiency) && (
          <Box mb={6}>
            <Heading size="md" mb={2} color="gray.800">
              Summary
            </Heading>
            <Text color="gray.700" fontSize="sm" lineHeight="1.6">
              {resume.summary}
              {resume.summary_deficiency && (
                <Text as="span" color="red.500">
                  {' '}
                  {resume.summary_deficiency}
                </Text>
              )}
            </Text>
          </Box>
        )}
        {resume.sections?.map((sec, i) => {
          const bullets = gapsOnly ? sec.bullets?.filter((b) => b.is_deficient) : sec.bullets
          if (gapsOnly && (!bullets || bullets.length === 0)) return null
          return (
            <Box key={i} mb={6}>
              <Heading size="sm" mb={2} color="gray.800" textTransform="uppercase" letterSpacing="wider">
                {sec.heading}
              </Heading>
              <Box as="ul" pl={4} color="gray.700" fontSize="sm" lineHeight="1.7">
                {bullets?.map((b, j) => (
                  <Box as="li" key={j} mb={1}>
                    {b.text}
                    {b.is_deficient && b.deficiency_comment && (
                      <Text as="span" color="red.500">
                        {' '}
                        {b.deficiency_comment}
                      </Text>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )
        })}
      </ResumePaper>
    </Box>
  )
}

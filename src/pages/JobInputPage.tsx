import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Flex, Grid, Text, List } from '@chakra-ui/react'
import { HiBriefcase, HiDocumentText, HiArrowRight, HiUpload } from 'react-icons/hi'
import { jobApi, profileApi } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField, FormInput, FormTextarea } from '../components/ui/FormField'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Alert } from '../components/ui/Alert'
import { AiBadge } from '../components/ui/AiBadge'
import { toaster } from '../lib/toaster'

function fitReportProgressLabel(pct: number, phase?: string): string {
  if (phase === 'fit_report' || pct >= 60) return 'Analyzing your fit…'
  if (pct < 50) return 'Extracting skills…'
  return 'Processing job description…'
}

const EXAMPLE_JD = `Senior Python Developer — Acme Inc.

Requirements:
• 5+ years Python, FastAPI or Django
• PostgreSQL, Redis, Docker
• System design and REST APIs`

const RESUME_ACCEPT = '.pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

function isAllowedResumeFile(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.endsWith('.pdf') || lower.endsWith('.docx')
}

function hasProfileBaseline(profile: { skills?: string[]; experience_summary?: string | null; baseline_resume_json?: Record<string, unknown> | null } | undefined): boolean {
  if (!profile) return false
  const skills = profile.skills ?? []
  const exp = (profile.experience_summary ?? '').trim()
  const raw = ((profile.baseline_resume_json as { raw_text?: string } | null)?.raw_text ?? '').trim()
  return Boolean(skills.length || exp || raw)
}

export function JobInputPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamError, setStreamError] = useState<string | null>(null)
  const [progressPct, setProgressPct] = useState(0)
  const [progressPhase, setProgressPhase] = useState<string | undefined>()
  const [uploadingResume, setUploadingResume] = useState(false)
  const [resumeOnFile, setResumeOnFile] = useState(false)
  const [selectedResumeName, setSelectedResumeName] = useState<string | null>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileApi.get(),
  })

  useEffect(() => {
    setResumeOnFile(hasProfileBaseline(profileData?.data))
  }, [profileData])

  const pristine = !jobTitle && !jobDescription && !companyName

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!isAllowedResumeFile(file.name)) {
      setStreamError('Upload a .pdf or .docx resume file')
      return
    }
    setSelectedResumeName(file.name)
    setUploadingResume(true)
    setStreamError(null)
    try {
      await profileApi.uploadResume(file)
      setResumeOnFile(true)
      toaster.create({ title: 'Resume uploaded', type: 'success' })
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Resume upload failed')
      setSelectedResumeName(null)
    } finally {
      setUploadingResume(false)
      e.target.value = ''
    }
  }

  const handleChooseResume = () => {
    resumeInputRef.current?.click()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim() && !jobDescription.trim()) {
      setStreamError('Enter a job title or description')
      return
    }
    if (!resumeOnFile) {
      setStreamError('Upload your resume or add profile details first')
      return
    }
    setStreamError(null)
    setProgressPct(0)
    setProgressPhase(undefined)
    setStreaming(true)

    const payload = {
      job_title: jobTitle || undefined,
      job_description: jobDescription || undefined,
      company_name: companyName || undefined,
    }

    try {
      const id = await jobApi.inputFitReportStream(payload, {
        onProgress: (pct, phase) => {
          setProgressPct(pct)
          setProgressPhase(phase)
        },
      })
      setStreaming(false)
      navigate(`/fit-report/${id}`)
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Request failed')
      setStreaming(false)
      toaster.create({ title: 'Failed to process job', type: 'error' })
    }
  }

  const progressLabel = fitReportProgressLabel(progressPct, progressPhase)

  const resumeSection = (
    <Box mb={4} p={4} borderRadius="lg" borderWidth="1px" borderColor="border.subtle" bg="bg.subtle">
        {resumeOnFile ? (
          <Text fontSize="sm" color="fg.muted">
            Using resume from your profile.{' '}
            <Text as="span" color="accent.muted">
              Ready to analyze.
            </Text>
          </Text>
        ) : (
          <>
            <Text fontSize="sm" color="fg.muted" mb={3}>
              Upload your resume (.pdf or .docx) to compare against this job.
            </Text>
            <FormField label="Resume file">
              <Flex align="center" gap={3} flexWrap="wrap">
                <input
                  ref={resumeInputRef}
                  type="file"
                  accept={RESUME_ACCEPT}
                  hidden
                  onChange={handleResumeUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  loading={uploadingResume}
                  icon={<HiUpload aria-hidden />}
                  onClick={handleChooseResume}
                >
                  Choose file
                </Button>
                {selectedResumeName && (
                  <Text fontSize="sm" color="fg.muted">
                    {selectedResumeName}
                  </Text>
                )}
              </Flex>
            </FormField>
          </>
        )}
      </Box>
    )

  const formCard = (
    <Card p={6} className={streaming ? 'gradient-border-active' : undefined}>
      <Flex align="center" gap={2} mb={4}>
        <Text fontWeight="600">Job details</Text>
        {streaming && <AiBadge />}
      </Flex>

      {resumeSection}

      <Box as="form" onSubmit={handleSubmit}>
        <FormField label={<><HiBriefcase aria-hidden /> Job title</>} id="title">
          <FormInput id="title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="e.g. Senior Python Developer" />
        </FormField>
        <FormField label="Company name (optional)" id="company">
          <FormInput id="company" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="e.g. Acme Inc" />
        </FormField>
        <FormField label={<><HiDocumentText aria-hidden /> Job description</>} id="jd">
          <FormTextarea id="jd" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} placeholder="Paste full JD or leave blank to expand from title…" rows={6} />
        </FormField>
        {streamError && <Alert status="error">{streamError}</Alert>}
        <Button type="submit" loading={streaming} icon={<HiArrowRight aria-hidden />}>
          Analyze fit
        </Button>
      </Box>
    </Card>
  )

  const howItWorks = (
    <Card p={6} bg="bg.subtle">
      <Text fontWeight="600" mb={4}>
        How it works
      </Text>
      <List.Root gap={4} variant="plain">
        {[
          { step: '1', text: 'Paste a job description' },
          { step: '2', text: 'Upload your resume (or use profile)' },
          { step: '3', text: 'Get strengths, gaps, and a prep plan' },
        ].map(({ step, text }) => (
          <List.Item key={step} display="flex" gap={3} alignItems="flex-start">
            <Flex w={7} h={7} align="center" justify="center" borderRadius="full" bg="bg.elevated" color="accent.muted" borderWidth="1px" borderColor="border.subtle" fontSize="sm" fontWeight="700" flexShrink={0}>
              {step}
            </Flex>
            <Text fontSize="sm" color="fg.muted" pt={1} lineHeight="1.5">
              {text}
            </Text>
          </List.Item>
        ))}
      </List.Root>
      {pristine && (
        <Box mt={6} p={4} bg="bg.input" borderRadius="md" borderWidth="1px" borderColor="border.subtle">
          <Text fontSize="xs" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="wider">
            Example
          </Text>
          <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap" fontFamily="mono">
            {EXAMPLE_JD}
          </Text>
        </Box>
      )}
    </Card>
  )

  return (
    <Box>
      <PageHeader
        title="Job input"
        subtitle="Paste the job description and upload your resume to get a fit report."
        badge={streaming ? <AiBadge /> : undefined}
      />

      <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6} mb={8}>
        {formCard}
        {howItWorks}
      </Grid>

      {streaming && (
        <Box mb={6}>
          <ProgressBar value={progressPct} stageLabel={progressLabel} />
        </Box>
      )}
    </Box>
  )
}

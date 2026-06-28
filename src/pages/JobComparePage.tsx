import { useQuery } from '@tanstack/react-query'
import { useSearchParams, Link } from 'react-router-dom'
import { Box, Grid, Text, Heading } from '@chakra-ui/react'
import { HiArrowLeft } from 'react-icons/hi'
import { jobApi, type JobCompareItem } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge, statusTone } from '../components/ui/Badge'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

function JobColumn({ label, job }: { label: string; job: JobCompareItem }) {
  const skills = job.extracted_skills
  const gap = job.skill_gap_summary || {}
  const required = (skills?.required_skills as string[]) || []
  const concepts = (skills?.concepts as string[]) || []
  const weaknesses = (gap.weaknesses as { text?: string }[]) || []
  const improvements = (gap.improvement_suggestions as { text?: string }[]) || []

  return (
    <Card p={5} h="full">
      <Heading size="md" mb={2}>
        {label}
      </Heading>
      <Text fontSize="sm" color="fg.muted" mb={2}>
        {job.job_title || 'Untitled'}
        {job.company_name && ` @ ${job.company_name}`}
      </Text>
      <Badge tone={statusTone(job.overall_gap_severity)} mb={4}>
        Gap: {job.overall_gap_severity}
      </Badge>

      {[
        { title: 'Required skills', items: required.slice(0, 12) },
        { title: 'Concepts', items: concepts.slice(0, 10) },
        { title: 'Weaknesses', items: weaknesses.map((w) => (typeof w === 'string' ? w : w?.text ?? '')) },
        { title: 'Improvements', items: improvements.map((s) => (typeof s === 'string' ? s : s?.text ?? '')) },
      ].map(({ title, items }) => (
        <Box key={title} mb={4}>
          <Text fontSize="xs" fontWeight="600" textTransform="uppercase" color="fg.muted" mb={2}>
            {title}
          </Text>
          <Box as="ul" pl={4} fontSize="sm">
            {items.map((item, i) => (
              <Box as="li" key={i} mb={1}>
                {item}
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Card>
  )
}

export function JobComparePage() {
  const [searchParams] = useSearchParams()
  const id1 = searchParams.get('id1')
  const id2 = searchParams.get('id2')
  const num1 = id1 ? Number(id1) : NaN
  const num2 = id2 ? Number(id2) : NaN

  const { data, isLoading, error } = useQuery({
    queryKey: ['job-compare', num1, num2],
    queryFn: () => jobApi.compare(num1, num2),
    enabled: Number.isFinite(num1) && Number.isFinite(num2) && num1 !== num2,
  })

  if (!id1 || !id2 || !Number.isFinite(num1) || !Number.isFinite(num2) || num1 === num2) {
    return (
      <Box>
        <Alert status="error">Select two different jobs to compare.</Alert>
        <Link to="/job/history">
          <Button mt={4} icon={<HiArrowLeft aria-hidden />}>
            Back to history
          </Button>
        </Link>
      </Box>
    )
  }

  if (isLoading) {
    return (
      <Box>
        <Skeleton height="32px" width="240px" mb={6} />
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
          <Skeleton height="400px" />
          <Skeleton height="400px" />
        </Grid>
      </Box>
    )
  }
  if (error || !data?.data) return <Alert status="error">Failed to load comparison.</Alert>

  const res = data.data
  return (
    <Box>
      <PageHeader
        title="Compare jobs"
        subtitle={`Job #${num1} vs Job #${num2}`}
        breadcrumbs={[{ label: 'History', to: '/job/history' }, { label: 'Compare' }]}
        actions={
          <Link to="/job/history">
            <Button variant="outline" size="sm" icon={<HiArrowLeft aria-hidden />}>
              Back
            </Button>
          </Link>
        }
      />
      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={6}>
        <JobColumn label="Job A" job={res.job_1} />
        <JobColumn label="Job B" job={res.job_2} />
      </Grid>
    </Box>
  )
}

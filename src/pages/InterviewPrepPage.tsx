import { useParams, Link } from 'react-router-dom'
import { Box, Text } from '@chakra-ui/react'
import { HiArrowLeft, HiExternalLink } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import api from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { AiBadge } from '../components/ui/AiBadge'
import { EmptyState } from '../components/ui/EmptyState'
import { Skeleton } from '../components/ui/Skeleton'

interface LikelyQuestion {
  concept: string
  question: string
  key_points: string[]
}

interface StudyLink {
  text: string
  websites: string[]
  youtube: string[]
}

interface InterviewPrepData {
  job_submission_id: number
  concepts_to_prepare: string[]
  likely_questions: LikelyQuestion[]
  study_links: StudyLink[]
}

export function InterviewPrepPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['interview-prep', id],
    queryFn: () => api.get<InterviewPrepData>(`/interview-prep/${id}`),
    enabled: Number.isFinite(id),
  })

  const prep = data?.data

  if (isLoading || !Number.isFinite(id)) {
    return (
      <Box>
        <Skeleton height="32px" width="240px" mb={4} />
        <Skeleton height="200px" />
      </Box>
    )
  }
  if (error || !prep) {
    return (
      <Box>
        <Alert status="error">Failed to load interview prep.</Alert>
        <Link to="/gap">
          <Button mt={4} variant="outline">
            Back to gap
          </Button>
        </Link>
      </Box>
    )
  }

  const empty = prep.concepts_to_prepare.length === 0 && prep.likely_questions.length === 0 && prep.study_links.length === 0

  return (
    <Box maxW="800px">
      <PageHeader
        title="Interview prep"
        subtitle={`Concepts, likely questions, and study links for job #${id}.`}
        badge={<AiBadge />}
        breadcrumbs={[{ label: 'Resume', to: `/resume/${id}` }, { label: 'Interview prep' }]}
        actions={
          <Link to={`/resume/${id}`}>
            <Button variant="outline" size="sm" icon={<HiArrowLeft aria-hidden />}>
              Back to resume
            </Button>
          </Link>
        }
      />

      {empty ? (
        <Card>
          <EmptyState title="No prep data yet" description="Complete the questionnaire and generate a resume first." />
        </Card>
      ) : (
        <Box display="flex" flexDirection="column" gap={4}>
          {prep.concepts_to_prepare.length > 0 && (
            <Card p={5}>
              <Text fontWeight="600" mb={3}>
                Concepts to prepare
              </Text>
              <Box as="ul" pl={4} fontSize="sm">
                {prep.concepts_to_prepare.map((c, i) => (
                  <Box as="li" key={i} mb={1}>
                    {c}
                  </Box>
                ))}
              </Box>
            </Card>
          )}

          {prep.likely_questions.length > 0 && (
            <Card p={5}>
              <Text fontWeight="600" mb={3}>
                Likely questions
              </Text>
              <Box display="flex" flexDirection="column" gap={4}>
                {prep.likely_questions.map((q, i) => (
                  <Box key={i} p={4} bg="bg.subtle" borderRadius="md">
                    <Text fontWeight="600" fontSize="sm" color="accent.default" mb={1}>
                      {q.concept}
                    </Text>
                    <Text mb={2}>{q.question}</Text>
                    {q.key_points?.length > 0 && (
                      <Box as="ul" pl={4} fontSize="sm" color="fg.muted">
                        {q.key_points.map((p, j) => (
                          <Box as="li" key={j}>
                            {p}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Box>
                ))}
              </Box>
            </Card>
          )}

          {prep.study_links.length > 0 && (
            <Card p={5}>
              <Text fontWeight="600" mb={3}>
                Study links
              </Text>
              <Box display="flex" flexDirection="column" gap={3}>
                {prep.study_links.map((s, i) => (
                  <Box key={i} fontSize="sm">
                    <Text mb={1}>{s.text}</Text>
                    <Box display="flex" gap={2} flexWrap="wrap">
                      {s.websites?.map((url, j) => (
                        <a key={`w-${j}`} href={url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" icon={<HiExternalLink aria-hidden />}>
                            Article
                          </Button>
                        </a>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Card>
          )}
        </Box>
      )}
    </Box>
  )
}

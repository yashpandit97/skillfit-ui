import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Flex, Grid, Text, List, Link as ChakraLink } from '@chakra-ui/react'
import { HiArrowRight, HiCheckCircle, HiExclamation, HiLightBulb, HiUser } from 'react-icons/hi'
import { jobApi, filterGuidanceUrls } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { AtsGauge } from '../components/ui/AtsGauge'
import { Skeleton } from '../components/ui/Skeleton'
import { Alert } from '../components/ui/Alert'

function FitReportItemList({
  items,
  tone,
  emptyLabel,
}: {
  items: string[]
  tone: 'success' | 'warning'
  emptyLabel: string
}) {
  if (items.length === 0) {
    return (
      <Text fontSize="sm" color="fg.muted">
        {emptyLabel}
      </Text>
    )
  }

  const styles =
    tone === 'success'
      ? { bg: 'rgba(34, 197, 94, 0.12)', borderColor: 'green.500', color: 'green.400' }
      : { bg: 'rgba(234, 179, 8, 0.12)', borderColor: 'yellow.500', color: 'yellow.400' }

  return (
    <Flex direction="column" gap={2} w="full" minW={0}>
      {items.map((item, index) => (
        <Box
          key={`${item}-${index}`}
          w="full"
          minW={0}
          px={3}
          py={2}
          borderRadius="md"
          borderWidth="1px"
          fontSize="sm"
          lineHeight="1.5"
          wordBreak="break-word"
          overflowWrap="anywhere"
          whiteSpace="normal"
          {...styles}
        >
          {item}
        </Box>
      ))}
    </Flex>
  )
}

export function FitReportPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['fit-report', id],
    queryFn: () => jobApi.getFitReport(id),
    enabled: Number.isFinite(id) && id > 0,
  })

  const report = data?.data

  if (isLoading) {
    return (
      <Box>
        <Skeleton height="32px" width="280px" mb={4} />
        <Skeleton height="120px" mb={4} />
        <Skeleton height="200px" />
      </Box>
    )
  }

  if (error || !report) {
    return (
      <Box>
        <PageHeader title="Fit report" subtitle="Could not load fit report." />
        <Alert status="error">Fit report not found or unavailable.</Alert>
        <Link to="/job/history">
          <Button variant="outline" mt={4}>
            Back to history
          </Button>
        </Link>
      </Box>
    )
  }

  const fit = report.fit_report

  return (
    <Box minW={0} overflow="hidden">
      <PageHeader
        title={report.job_title || 'Fit report'}
        subtitle={report.company_name ? `${report.company_name} · Role readiness analysis` : 'Role readiness analysis'}
        breadcrumbs={[
          { label: 'Job input', to: '/job' },
          { label: 'History', to: '/job/history' },
          { label: 'Fit report' },
        ]}
      />

      <Card p={6} mb={6} minW={0}>
        <Flex direction={{ base: 'column', md: 'row' }} align={{ md: 'flex-start' }} gap={4}>
          <Box flexShrink={0}>
            <AtsGauge score={fit.overall_fit_score} missingKeywords={fit.ats_keywords_missing} />
          </Box>
          <Text fontSize="sm" color="fg.muted" flex={1} minW={0} lineHeight="1.6">
            {fit.role_readiness_summary}
          </Text>
        </Flex>
      </Card>

      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }}
        gap={6}
        mb={6}
        alignItems="stretch"
        w="full"
        minW={0}
      >
        <Card p={6} minW={0} h="full" display="flex" flexDirection="column">
          <Flex align="center" gap={2} mb={4} flexShrink={0}>
            <HiCheckCircle color="#22c55e" aria-hidden />
            <Text fontWeight="600">What you know</Text>
          </Flex>
          <FitReportItemList items={fit.strengths} tone="success" emptyLabel="No strengths identified yet." />
        </Card>

        <Card p={6} minW={0} h="full" display="flex" flexDirection="column">
          <Flex align="center" gap={2} mb={4} flexShrink={0}>
            <HiExclamation color="#eab308" aria-hidden />
            <Text fontWeight="600">What you're missing</Text>
          </Flex>
          <FitReportItemList items={fit.gaps} tone="warning" emptyLabel="No major gaps identified." />
        </Card>
      </Grid>

      <Text fontWeight="600" mb={4}>
        Preparation plan
      </Text>
      <Flex direction="column" gap={3} mb={8}>
        {fit.preparation_plan.map((item, i) => (
          <Card key={`${item.topic}-${i}`} p={5} borderLeftWidth="3px" borderLeftColor="accent.default">
            <Flex align="center" gap={2} mb={2}>
              <HiLightBulb aria-hidden />
              <Text fontWeight="600">{item.topic}</Text>
            </Flex>
            <Text fontSize="sm" color="fg.muted" mb={filterGuidanceUrls(item.study_urls ?? []).length ? 2 : 0}>
              {item.detail}
            </Text>
            {filterGuidanceUrls(item.study_urls ?? []).length > 0 && (
              <List.Root gap={1} variant="plain">
                {filterGuidanceUrls(item.study_urls ?? []).map((url) => (
                  <List.Item key={url}>
                    <ChakraLink href={url} target="_blank" rel="noopener noreferrer" fontSize="sm" color="accent.default">
                      {url}
                    </ChakraLink>
                  </List.Item>
                ))}
              </List.Root>
            )}
          </Card>
        ))}
      </Flex>

      <Card p={6} mb={8} minW={0}>
        <Text fontWeight="600" mb={4}>
          ATS keywords
        </Text>
        <Box mb={4} minW={0}>
          <Text fontSize="xs" textTransform="uppercase" color="fg.muted" mb={2}>
            Matched
          </Text>
          <Flex gap={2} flexWrap="wrap" minW={0}>
            {fit.ats_keywords_matched.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">None matched yet.</Text>
            ) : (
              fit.ats_keywords_matched.map((k) => (
                <Badge key={k} tone="success" whiteSpace="normal" wordBreak="break-word" maxW="100%">
                  {k}
                </Badge>
              ))
            )}
          </Flex>
        </Box>
        <Box minW={0}>
          <Text fontSize="xs" textTransform="uppercase" color="fg.muted" mb={2}>
            Missing
          </Text>
          <Flex gap={2} flexWrap="wrap" minW={0}>
            {fit.ats_keywords_missing.length === 0 ? (
              <Text fontSize="sm" color="fg.muted">No missing keywords.</Text>
            ) : (
              fit.ats_keywords_missing.map((k) => (
                <Badge key={k} tone="warning" whiteSpace="normal" wordBreak="break-word" maxW="100%">
                  {k}
                </Badge>
              ))
            )}
          </Flex>
        </Box>
      </Card>

      <Flex gap={3} flexWrap="wrap">
        <Link to="/profile">
          <Button variant="outline" icon={<HiUser aria-hidden />}>
            Update resume
          </Button>
        </Link>
        <Link to="/job/history">
          <Button variant="outline">Job history</Button>
        </Link>
        <Link to={`/questionnaire/${report.job_submission_id}`}>
          <Button variant="ghost" icon={<HiArrowRight aria-hidden />}>
            Run questionnaire anyway
          </Button>
        </Link>
      </Flex>
    </Box>
  )
}

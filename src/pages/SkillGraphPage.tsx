import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Box, Grid, Text, Heading } from '@chakra-ui/react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { gapApi, type SkillGraphNode } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

const STRENGTH_COLORS: Record<string, string> = {
  strong: '#22c55e',
  partial: '#eab308',
  gap: '#ef4444',
}

const STRENGTH_SCORE: Record<string, number> = {
  strong: 3,
  partial: 2,
  gap: 1,
}

export function SkillGraphPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['skill-graph', id],
    queryFn: () => gapApi.skillGraph(id),
    enabled: Number.isFinite(id),
  })

  const graph = data?.data
  const nodes: SkillGraphNode[] = graph?.nodes ?? []

  const strong = nodes.filter((n) => n.strength === 'strong')
  const partial = nodes.filter((n) => n.strength === 'partial')
  const gap = nodes.filter((n) => n.strength === 'gap')

  const chartData = [...nodes]
    .sort((a, b) => (STRENGTH_SCORE[a.strength] ?? 0) - (STRENGTH_SCORE[b.strength] ?? 0))
    .slice(0, 15)
    .map((n) => ({
      name: n.label.length > 20 ? `${n.label.slice(0, 18)}…` : n.label,
      score: STRENGTH_SCORE[n.strength] ?? 1,
      strength: n.strength,
    }))

  if (isLoading || !Number.isFinite(id)) {
    return (
      <Box>
        <Skeleton height="32px" width="200px" mb={4} />
        <Skeleton height="300px" />
      </Box>
    )
  }
  if (error || !graph) {
    return (
      <Box>
        <Alert status="error">Failed to load skill graph.</Alert>
        <Link to="/gap">
          <Button mt={4} variant="outline">
            Back to gap
          </Button>
        </Link>
      </Box>
    )
  }

  return (
    <Box>
      <PageHeader
        title="Skill graph"
        subtitle={`Concepts and skills by strength (job #${id})`}
        breadcrumbs={[{ label: 'Skill gap', to: '/gap' }, { label: 'Graph' }]}
        actions={
          <Link to="/gap">
            <Button variant="outline" size="sm">
              Back
            </Button>
          </Link>
        }
      />

      {chartData.length > 0 && (
        <Card mb={6} p={4} h="320px">
          <Text fontSize="sm" fontWeight="600" mb={4}>
            Strength overview
          </Text>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 8, right: 16 }}>
              <XAxis type="number" domain={[0, 3]} ticks={[1, 2, 3]} tickFormatter={(v) => (v === 3 ? 'Strong' : v === 2 ? 'Partial' : 'Gap')} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={index} fill={STRENGTH_COLORS[entry.strength] ?? '#64748b'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr 1fr' }} gap={4}>
        {[
          { title: 'Strong', items: strong, color: 'green.500' },
          { title: 'Partial', items: partial, color: 'yellow.500' },
          { title: 'Gap', items: gap, color: 'red.400' },
        ].map(({ title, items, color }) => (
          <Card key={title} p={4} borderTopWidth="3px" borderTopColor={color}>
            <Heading size="sm" mb={3}>
              {title} ({items.length})
            </Heading>
            <Box as="ul" pl={4} fontSize="sm" color="fg.muted">
              {items.map((n) => (
                <Box as="li" key={n.id} mb={1}>
                  {n.label}
                </Box>
              ))}
            </Box>
          </Card>
        ))}
      </Grid>
    </Box>
  )
}

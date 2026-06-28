import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Flex, Text, VStack } from '@chakra-ui/react'
import { HiCheck, HiX, HiArrowRight } from 'react-icons/hi'
import { jobApi, questionnaireApi, type QuestionnaireItem } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { ProgressBar } from '../components/ui/ProgressBar'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'
import { AiBadge } from '../components/ui/AiBadge'
import { toaster } from '../lib/toaster'

type Answer = 'yes' | 'no' | 'a_bit' | null

const QUESTIONS_PER_STAGE_LEGACY = 5

function getQuestionsForStage(stageNum: number, questions: QuestionnaireItem[]): QuestionnaireItem[] {
  const hasStage = questions.some((q) => q.stage != null)
  if (hasStage) return questions.filter((q) => q.stage === stageNum)
  const start = (stageNum - 1) * QUESTIONS_PER_STAGE_LEGACY
  return questions.slice(start, stageNum * QUESTIONS_PER_STAGE_LEGACY)
}

function getStageNumbers(questions: QuestionnaireItem[]): number[] {
  const hasStage = questions.some((q) => q.stage != null)
  if (hasStage) {
    const stages = [...new Set(questions.map((q) => q.stage).filter((s): s is number => s != null))]
    return stages.sort((a, b) => a - b)
  }
  const n = Math.ceil(questions.length / QUESTIONS_PER_STAGE_LEGACY) || 1
  return Array.from({ length: n }, (_, i) => i + 1)
}

function answerBorderColor(answer: Answer): string {
  if (answer === 'yes') return 'green.500'
  if (answer === 'a_bit') return 'yellow.500'
  if (answer === 'no') return 'orange.500'
  return 'border.default'
}

export function QuestionnairePage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const storageKey = `skillfit_answers_${id}`
  const [answers, setAnswers] = useState<Record<string, Answer>>(() => {
    try {
      const s = localStorage.getItem(storageKey)
      if (s) {
        const parsed = JSON.parse(s) as Record<string, string>
        const valid: Record<string, Answer> = {}
        for (const [k, v] of Object.entries(parsed)) {
          if (v === 'yes' || v === 'no' || v === 'a_bit') valid[k] = v
        }
        return valid
      }
    } catch {}
    return {}
  })
  const [questionnaireDone, setQuestionnaireDone] = useState(false)
  const [stageProgressPct, setStageProgressPct] = useState(0)
  const [submitProgressPct, setSubmitProgressPct] = useState(0)
  const [flashId, setFlashId] = useState<string | null>(null)
  const threadRef = useRef<HTMLDivElement>(null)
  const prevQuestionCountRef = useRef(0)

  const { data, isLoading, error } = useQuery({
    queryKey: ['questionnaire', id],
    queryFn: () => jobApi.getQuestionnaire(id),
    enabled: Number.isFinite(id),
    refetchInterval: (query) => (query.state.data?.data?.ready === false ? 2000 : false),
  })

  const questions = data?.data?.questions ?? []
  const ready = data?.data?.ready !== false
  const current_stage = data?.data?.current_stage ?? 1
  const total_stages = data?.data?.total_stages ?? getStageNumbers(questions).length
  const currentStageQuestions = getQuestionsForStage(current_stage, questions)
  const validAnswers = ['yes', 'no', 'a_bit'] as const
  const allAnsweredForStage =
    currentStageQuestions.length > 0 &&
    currentStageQuestions.every((q) => answers[q.id] != null && validAnswers.includes(answers[q.id]!))
  const allStagesComplete = questionnaireDone
  const allAnsweredForFinal =
    questions.length >= 3 && questions.every((q) => answers[q.id] != null && validAnswers.includes(answers[q.id]!))
  const answeredCount = currentStageQuestions.filter((q) => answers[q.id] != null).length

  const submitStage = useMutation({
    mutationFn: async () => {
      setStageProgressPct(0)
      const res = await jobApi.submitStageAnswersStream(
        id,
        {
          stage: current_stage,
          answers: Object.fromEntries(
            currentStageQuestions.map((q) => [
              q.id,
              answers[q.id] && validAnswers.includes(answers[q.id]!) ? answers[q.id]! : 'no',
            ])
          ) as Record<string, string>,
        },
        { onProgress: (pct) => setStageProgressPct(pct) }
      )
      return { data: res }
    },
    onSuccess: (res) => {
      if (res?.data?.done) setQuestionnaireDone(true)
      setStageProgressPct(0)
      queryClient.invalidateQueries({ queryKey: ['questionnaire', id] })
    },
    onError: () => {
      setStageProgressPct(0)
      toaster.create({ title: 'Failed to load next stage', type: 'error' })
    },
  })

  const submitFinal = useMutation({
    mutationFn: async () => {
      setSubmitProgressPct(0)
      return questionnaireApi.submitStream(
        id,
        {
          answers: Object.fromEntries(
            questions.map((q) => [
              q.id,
              answers[q.id] && validAnswers.includes(answers[q.id]!) ? answers[q.id]! : 'no',
            ])
          ) as Record<string, string>,
        },
        { onProgress: (pct) => setSubmitProgressPct(pct) }
      )
    },
    onSuccess: () => {
      setSubmitProgressPct(0)
      try {
        localStorage.removeItem(storageKey)
      } catch {}
      toaster.create({ title: 'Resume generated', type: 'success' })
      navigate(`/resume/${id}`)
    },
    onError: () => {
      setSubmitProgressPct(0)
      toaster.create({ title: 'Resume generation failed', type: 'error' })
    },
  })

  const stageNumbers = getStageNumbers(questions)

  useEffect(() => {
    if (questions.length > prevQuestionCountRef.current && threadRef.current) {
      prevQuestionCountRef.current = questions.length
      threadRef.current.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
    } else {
      prevQuestionCountRef.current = questions.length
    }
  }, [questions.length])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (allStagesComplete ? allAnsweredForFinal : allAnsweredForStage) {
            if (allStagesComplete) submitFinal.mutate()
            else submitStage.mutate()
          }
        }
        return
      }
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      const key = e.key.toLowerCase()
      const firstUnanswered = currentStageQuestions.find((q) => answers[q.id] == null)
      if (!firstUnanswered) return
      if (key === 'y') setAnswer(firstUnanswered.id, 'yes')
      else if (key === 'a') setAnswer(firstUnanswered.id, 'a_bit')
      else if (key === 'n') setAnswer(firstUnanswered.id, 'no')
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [currentStageQuestions, answers, allAnsweredForStage, allAnsweredForFinal, allStagesComplete])

  const setAnswer = (qid: string, value: Answer) => {
    if (value == null) return
    setFlashId(qid)
    setTimeout(() => setFlashId(null), 300)
    setAnswers((a) => {
      const next = { ...a, [qid]: value }
      try {
        localStorage.setItem(storageKey, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const isPending = submitStage.isPending || submitFinal.isPending
  const submitError = submitStage.isError ? submitStage.error : submitFinal.isError ? submitFinal.error : null

  if (error) {
    return <Alert status="error">Questionnaire not found or not ready.</Alert>
  }

  if (isLoading || !Number.isFinite(id) || !ready || !questions.length) {
    return (
      <Box>
        <PageHeader title="Concept checklist" subtitle="Preparing your personalized concept list…" badge={<AiBadge />} />
        <VStack gap={4} align="stretch">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} p={5}>
              <Skeleton height="12px" width="64px" mb={2} />
              <Skeleton height="16px" width={`${60 + (i % 4) * 10}%`} />
            </Card>
          ))}
        </VStack>
      </Box>
    )
  }

  return (
    <Flex direction="column" minH="calc(100vh - 200px)">
      <PageHeader
        title="Concept checklist"
        subtitle={`Stage ${current_stage} of ${total_stages} · ${answeredCount} of ${currentStageQuestions.length} answered · Shortcuts: Y / A / N · Ctrl+Enter to submit`}
        badge={<AiBadge />}
        breadcrumbs={[{ label: 'Job input', to: '/job' }, { label: 'Questionnaire' }]}
      />

      <Box ref={threadRef} flex={1} overflowY="auto" pb={24}>
        {stageNumbers.map((stageNum) => {
          const stageQuestions = getQuestionsForStage(stageNum, questions)
          if (stageQuestions.length === 0) return null
          const isCurrentStage = stageNum === current_stage
          return (
            <Box key={stageNum} mb={8}>
              <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="wider" mb={3}>
                {stageNum === 1 ? 'First set' : `Set ${stageNum}`}
              </Text>
              <VStack gap={4} align="stretch">
                {stageQuestions.map((q) => (
                  <Card
                    key={q.id}
                    p={5}
                    borderLeftWidth="4px"
                    borderLeftColor={answerBorderColor(answers[q.id] ?? null)}
                    transition="border-color 0.3s ease"
                    transform={flashId === q.id ? 'scale(1.01)' : undefined}
                  >
                    <Text fontSize="xs" textTransform="uppercase" color="fg.muted" mb={1}>
                      {q.category.replace(/_/g, ' ')}
                    </Text>
                    <Text fontWeight="600" mb={2}>
                      {q.concept}
                    </Text>
                    {q.description && (
                      <Text fontSize="sm" color="fg.muted" mb={4}>
                        {q.description}
                      </Text>
                    )}
                    {isCurrentStage ? (
                      <Flex gap={2} flexWrap="wrap">
                        {(
                          [
                            { val: 'yes' as const, label: 'Yes', icon: HiCheck, palette: 'green' },
                            { val: 'a_bit' as const, label: 'A bit', palette: 'yellow' },
                            { val: 'no' as const, label: 'No', icon: HiX, palette: 'orange' },
                          ] as Array<{ val: 'yes' | 'a_bit' | 'no'; label: string; icon?: typeof HiCheck; palette: string }>
                        ).map(({ val, label, icon: Icon, palette }) => (
                          <Button
                            key={val}
                            flex={1}
                            minH="44px"
                            variant={answers[q.id] === val ? 'primary' : 'outline'}
                            colorPalette={answers[q.id] === val ? palette : undefined}
                            onClick={() => setAnswer(q.id, val)}
                            icon={Icon ? <Icon aria-hidden /> : undefined}
                          >
                            {label}
                          </Button>
                        ))}
                      </Flex>
                    ) : (
                      <Text fontSize="sm" color="fg.muted">
                        Answered:{' '}
                        <strong>
                          {answers[q.id] === 'yes' ? 'Yes' : answers[q.id] === 'a_bit' ? 'A bit' : answers[q.id] === 'no' ? 'No' : '—'}
                        </strong>
                      </Text>
                    )}
                  </Card>
                ))}
              </VStack>

              {isCurrentStage && (submitStage.isPending || stageProgressPct > 0) && !allStagesComplete && (
                <Box mt={4}>
                  <ProgressBar value={stageProgressPct} stageLabel="Generating next questions…" />
                </Box>
              )}

              {isCurrentStage && allStagesComplete && (submitFinal.isPending || submitProgressPct > 0) && (
                <Box mt={4}>
                  <ProgressBar value={submitProgressPct} stageLabel="Generating your resume…" />
                </Box>
              )}
            </Box>
          )
        })}
      </Box>

      {/* Sticky action bar */}
      {stageNumbers.includes(current_stage) && (
        <Box
          position="sticky"
          bottom={0}
          py={4}
          px={4}
          mx={-4}
          bg="bg.canvas"
          borderTopWidth="1px"
          borderColor="border.default"
          backdropFilter="blur(8px)"
          zIndex={10}
        >
          {submitError && (
            <Box mb={2}>
              <Alert status="error">{(submitError as Error)?.message ?? 'Request failed'}</Alert>
            </Box>
          )}
          {!allAnsweredForStage && !allStagesComplete && (
            <Text fontSize="sm" color="fg.muted" mb={2}>
              Answer every concept above to continue.
            </Text>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (allStagesComplete ? allAnsweredForFinal : allAnsweredForStage) {
                if (allStagesComplete) submitFinal.mutate()
                else submitStage.mutate()
              }
            }}
          >
            <Button
              type="submit"
              loading={isPending}
              disabled={isPending || (allStagesComplete ? !allAnsweredForFinal : !allAnsweredForStage)}
              icon={<HiArrowRight aria-hidden />}
            >
              {allStagesComplete ? 'Submit & generate resume' : 'Continue to next stage'}
            </Button>
          </form>
        </Box>
      )}
    </Flex>
  )
}

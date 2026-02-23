import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Heading,
  Text,
  Button,
  VStack,
  Skeleton,
  Flex,
} from '@chakra-ui/react'
import { HiCheck, HiX, HiArrowRight } from 'react-icons/hi'
import { jobApi, questionnaireApi, type QuestionnaireItem, isQuestionnaireDone } from '../api/client'
import './QuestionnairePage.css'

type Answer = 'yes' | 'no' | null

/** Backend may use variable questions per stage; use question.stage when present, else fall back to fixed slice. */
const QUESTIONS_PER_STAGE_LEGACY = 5

function getQuestionsForStage(stageNum: number, questions: QuestionnaireItem[]): QuestionnaireItem[] {
  const hasStage = questions.some((q) => q.stage != null)
  if (hasStage) {
    return questions.filter((q) => q.stage === stageNum)
  }
  const start = (stageNum - 1) * QUESTIONS_PER_STAGE_LEGACY
  const end = stageNum * QUESTIONS_PER_STAGE_LEGACY
  return questions.slice(start, end)
}

export function QuestionnairePage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [questionnaireDone, setQuestionnaireDone] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['questionnaire', id],
    queryFn: () => jobApi.getQuestionnaire(id),
    enabled: Number.isFinite(id),
    refetchInterval: (query) => {
      const ready = query.state.data?.data?.ready
      if (ready === false) return 2000
      return false
    },
  })

  const questions = data?.data?.questions ?? []
  const ready = data?.data?.ready !== false
  const current_stage = data?.data?.current_stage ?? 1
  const currentStageQuestions = getQuestionsForStage(current_stage, questions)
  const allAnsweredForStage =
    currentStageQuestions.length > 0 &&
    currentStageQuestions.every((q) => answers[q.id] === 'yes' || answers[q.id] === 'no')
  /** Show "Submit & generate resume" only after backend returned done: true (no more stages). Until then, always show "Continue to next stage". */
  const allStagesComplete = questionnaireDone
  const allAnsweredForFinal =
    questions.length >= 3 &&
    questions.every((q) => answers[q.id] === 'yes' || answers[q.id] === 'no')

  const submitStage = useMutation({
    mutationFn: () =>
      jobApi.submitStageAnswers(id, {
        stage: current_stage,
        answers: Object.fromEntries(
          currentStageQuestions.map((q) => [
            q.id,
            answers[q.id] === 'yes' || answers[q.id] === 'no' ? answers[q.id]! : 'no',
          ])
        ) as Record<string, string>,
      }),
    onSuccess: (res) => {
      if (isQuestionnaireDone(res)) setQuestionnaireDone(true)
      queryClient.invalidateQueries({ queryKey: ['questionnaire', id] })
    },
    onError: () => {},
  })

  const submitFinal = useMutation({
    mutationFn: () =>
      questionnaireApi.submit(id, {
        answers: Object.fromEntries(
          questions.map((q) => [
            q.id,
            answers[q.id] === 'yes' || answers[q.id] === 'no' ? answers[q.id]! : 'no',
          ])
        ) as Record<string, string>,
      }),
    onSuccess: () => {
      navigate(`/resume/${id}`)
    },
    onError: () => {},
  })

  const setAnswer = (qid: string, value: 'yes' | 'no') => {
    setAnswers((a) => ({ ...a, [qid]: value }))
  }

  const handleStageContinue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAnsweredForStage) return
    submitStage.mutate()
  }

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!allAnsweredForFinal) return
    submitFinal.mutate()
  }

  if (error) {
    return (
      <Box className="questionnaireError" p={8} textAlign="center" width="100%">
        <Text color="red.400">Questionnaire not found or not ready.</Text>
      </Box>
    )
  }
  const showWaiting = isLoading || !Number.isFinite(id) || !ready || !questions.length
  if (showWaiting) {
    return (
      <Box className="questionnairePage" width="100%" mx="auto" p={6} boxSizing="border-box">
        <Heading size="lg" mb={2}>Concept checklist</Heading>
        <Text color="gray.500" mb={6}>
          {!ready ? 'Preparing your personalized concept list…' : 'Loading…'}
        </Text>
        <VStack gap={4} align="stretch" width="100%">
          {Array.from({ length: 10 }).map((_, i) => (
            <Flex key={i} p={5} borderRadius="lg" bg="gray.800" gap={3} direction="column" width="100%" boxSizing="border-box">
              <Skeleton height="12px" width="64px" />
              <Skeleton height="16px" width={`${60 + (i % 4) * 10}%`} />
              {i % 3 === 0 && <Skeleton height="12px" width="85%" />}
              <Flex gap={2} mt={3}>
                <Skeleton height="36px" width="96px" />
                <Skeleton height="36px" width="96px" />
              </Flex>
            </Flex>
          ))}
        </VStack>
        <Skeleton height="40px" width="192px" mt={6} />
      </Box>
    )
  }

  const isPending = submitStage.isPending || submitFinal.isPending
  const submitError = submitStage.isError ? submitStage.error : submitFinal.isError ? submitFinal.error : null

  return (
    <Box className="questionnairePage animateFadeIn" width="100%" mx="auto" p={6} boxSizing="border-box">
      <Heading size="lg" mb={2}>Concept checklist</Heading>
      <Text color="gray.500" mb={6}>
        For each concept, choose <strong>Yes</strong> if you’re confident and can demonstrate it, or <strong>No</strong> if you need to prepare.
      </Text>

      <form
                  onSubmit={allStagesComplete ? handleFinalSubmit : handleStageContinue}
                  style={{ opacity: isPending ? 0.7 : 1, pointerEvents: isPending ? 'none' : 'auto', width: '100%' }}
                >
                  <VStack listStyle="none" p={0} m={0} align="stretch" gap={4} as="ul" width="100%" sx={{ listStyle: 'none' }}>
                    {currentStageQuestions.map((q) => (
                      <Box
                        key={q.id}
                        as="li"
                        p={5}
                        borderRadius="lg"
                        bg="gray.800"
                        borderLeftWidth="4px"
                        borderLeftColor={
                          answers[q.id] === 'yes'
                            ? 'green.500'
                            : answers[q.id] === 'no'
                              ? 'orange.500'
                              : 'gray.600'
                        }
                      >
                        <Text fontSize="xs" textTransform="uppercase" letterSpacing="wider" color="gray.400" mb={1}>
                          {q.category.replace(/_/g, ' ')}
                        </Text>
                        <Text fontWeight="600" mb={2}>{q.concept}</Text>
                        {q.description && (
                          <Text fontSize="sm" color="gray.400" mb={4}>{q.description}</Text>
                        )}
                        <Flex gap={2} flexWrap="wrap">
                          <Button
                            size="sm"
                            variant={answers[q.id] === 'yes' ? 'solid' : 'outline'}
                            colorPalette={answers[q.id] === 'yes' ? 'green' : 'gray'}
                            color={answers[q.id] === 'yes' ? undefined : 'gray.200'}
                            borderColor={answers[q.id] === 'yes' ? undefined : 'gray.500'}
                            onClick={() => setAnswer(q.id, 'yes')}
                          >
                            <HiCheck style={{ marginRight: 6 }} /> Yes — I’m aware
                          </Button>
                          <Button
                            size="sm"
                            variant={answers[q.id] === 'no' ? 'solid' : 'outline'}
                            colorPalette={answers[q.id] === 'no' ? 'orange' : 'gray'}
                            color={answers[q.id] === 'no' ? undefined : 'gray.200'}
                            borderColor={answers[q.id] === 'no' ? undefined : 'gray.500'}
                            onClick={() => setAnswer(q.id, 'no')}
                          >
                            <HiX style={{ marginRight: 6 }} /> No — I need to prepare
                          </Button>
                        </Flex>
                      </Box>
                    ))}
                  </VStack>
                  {!allAnsweredForStage && !allStagesComplete && (
                    <Text fontSize="sm" color="gray.400" mt={4}>
                      Answer every concept above (Yes or No) to continue.
                    </Text>
                  )}
                  {allStagesComplete && !allAnsweredForFinal && (
                    <Text fontSize="sm" color="gray.400" mt={4}>
                      Answer every concept above to submit and generate your resume.
                    </Text>
                  )}
                  {submitError && (
                    <Text color="red.400" fontSize="sm" mt={4}>
                      {(submitError as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? 'Request failed'}
                    </Text>
                  )}
                  <Button
                    type="submit"
                    mt={6}
                    colorPalette="blue"
                    disabled={isPending || (allStagesComplete ? !allAnsweredForFinal : !allAnsweredForStage)}
                  >
                    {isPending
                      ? allStagesComplete
                        ? 'Submitting...'
                        : 'Loading next batch...'
                      : allStagesComplete
                        ? 'Submit & generate resume'
                        : 'Continue'}
                    <HiArrowRight style={{ marginLeft: 8 }} />
                  </Button>
                </form>
    
    </Box>
  )
}

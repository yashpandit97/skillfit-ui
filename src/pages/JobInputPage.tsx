import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiBriefcase, HiDocumentText, HiArrowRight } from 'react-icons/hi'
import { jobApi, type QuestionnaireItem } from '../api/client'
import './JobInputPage.css'

const SKELETON_COUNT = 5

export function JobInputPage() {
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamQuestions, setStreamQuestions] = useState<QuestionnaireItem[]>([])
  const [streamError, setStreamError] = useState<string | null>(null)
  const [progressPct, setProgressPct] = useState(0)
  const [jobSubmissionId, setJobSubmissionId] = useState<number | null>(null)
  const questionsSectionRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (progressPct >= 100 && questionsSectionRef.current) {
      questionsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [progressPct])

  // Auto-redirect to questionnaire when first set is ready so user can answer immediately (no extra "Continue" click)
  useEffect(() => {
    if (progressPct >= 100 && jobSubmissionId != null && streamQuestions.length > 0) {
      navigate(`/questionnaire/${jobSubmissionId}`)
    }
  }, [progressPct, jobSubmissionId, streamQuestions.length, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim() && !jobDescription.trim()) return
    setStreamError(null)
    setStreamQuestions([])
    setProgressPct(0)
    setJobSubmissionId(null)
    setStreaming(true)
    try {
      const id = await jobApi.inputStream(
        { job_title: jobTitle || undefined, job_description: jobDescription || undefined },
        {
          onProgress: (pct) => setProgressPct(pct),
          onQuestion: (q) => setStreamQuestions((prev) => [...prev, q]),
        }
      )
      setJobSubmissionId(id)
      setStreaming(false)
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Request failed')
      setStreaming(false)
    }
  }

  const streamComplete = jobSubmissionId != null && streamQuestions.length > 0
  const totalSlots = Math.max(SKELETON_COUNT, streamQuestions.length)

  return (
    <div className="jobInputPage jobInputPageFlow animateFadeIn">
      <h1 className="pageTitle">Concept checklist</h1>
      <p className="pageSubtitle">
        Paste the job description below. We'll extract skills and generate a concept checklist.
      </p>

      {/* 1. JD input – top */}
      <form onSubmit={handleSubmit} className="jobInputForm card">
        <div className="formGroup">
          <label htmlFor="title">
            <HiBriefcase className="inputIcon" aria-hidden />
            Job title
          </label>
          <input
            id="title"
            type="text"
            className="input"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Python Developer"
          />
        </div>
        <div className="formGroup">
          <label htmlFor="jd">
            <HiDocumentText className="inputIcon" aria-hidden />
            Job description
          </label>
          <textarea
            id="jd"
            className="input inputTextarea"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste full JD or leave blank to expand from title..."
            rows={6}
          />
        </div>
        {streamError && streamQuestions.length === 0 && (
          <p className="error formError">{streamError}</p>
        )}
        <button type="submit" className="btn btnPrimary submitBtn" disabled={streaming}>
          Continue
          <HiArrowRight className="btnIcon" aria-hidden />
        </button>
      </form>

      {/* 2. Progress bar – below form, when generating */}
      {(streaming || streamQuestions.length > 0) && (
        <div className="progressBarWrap" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Generating questions">
          <div className="progressBarTrack">
            <div className="progressBarFill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progressBarLabel">{progressPct}%</span>
        </div>
      )}
      {streamError && streamQuestions.length > 0 && (
        <p className="error formError">{streamError}</p>
      )}

      {/* 3. First set of questions – below progress, when ready */}
      {streamQuestions.length > 0 && (
        <div ref={questionsSectionRef} className="jobInputQuestionsSection">
          <h2 className="questionsSectionTitle">Concepts to evaluate</h2>
          <ul className="questionList jobInputSkeletonList" aria-busy={streaming} aria-label="Loading questions">
            {Array.from({ length: totalSlots }).map((_, i) => {
              const q = streamQuestions[i]
              if (q) {
                return (
                  <li key={q.id} className="questionCard card questionCardStreamed" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="questionCategory">{q.category.replace(/_/g, ' ')}</div>
                    <div className="questionConcept">{q.concept}</div>
                    {q.description && <div className="questionDescription">{q.description}</div>}
                    <div className="questionActions questionActionsPlaceholder">
                      <span className="streamedLabel">Answer on next screen</span>
                    </div>
                  </li>
                )
              }
              return (
                <li key={`skeleton-${i}`} className="questionCard card questionCardSkeleton">
                  <div className="skeleton skeletonCategory" />
                  <div className="skeleton skeletonConcept" style={{ width: `${60 + (i % 4) * 10}%` }} />
                  {i % 3 === 0 && <div className="skeleton skeletonDescription" />}
                  <div className="questionActions">
                    <div className="skeleton skeletonBtn" />
                    <div className="skeleton skeletonBtn" />
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

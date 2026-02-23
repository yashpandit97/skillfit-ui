import { useState } from 'react'
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
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobTitle.trim() && !jobDescription.trim()) return
    setStreamError(null)
    setStreamQuestions([])
    setStreaming(true)
    try {
      const id = await jobApi.inputStream(
        { job_title: jobTitle || undefined, job_description: jobDescription || undefined },
        (q) => setStreamQuestions((prev) => [...prev, q])
      )
      navigate(`/questionnaire/${id}`)
    } catch (err) {
      setStreamError(err instanceof Error ? err.message : 'Request failed')
      setStreaming(false)
    }
  }

  if (streaming || streamQuestions.length > 0) {
    const totalSlots = Math.max(SKELETON_COUNT, streamQuestions.length)
    return (
      <div className="jobInputPage">
        <h1 className="pageTitle">Concept checklist</h1>
        <p className="pageSubtitle">Preparing your personalized concept list…</p>
        {streamError && (
          <p className="error formError">{streamError}</p>
        )}
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
                    <span className="streamedLabel">Ready</span>
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
        <div className="skeleton skeletonSubmit" />
      </div>
    )
  }

  return (
    <div className="jobInputPage animateFadeIn">
      <h1 className="pageTitle">Job Input</h1>
      <p className="pageSubtitle">
        Enter a job title and/or full job description. We’ll extract skills and generate a concept checklist.
      </p>
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
        {streamError && (
          <p className="error formError">{streamError}</p>
        )}
        <button type="submit" className="btn btnPrimary submitBtn" disabled={streaming}>
          Continue to checklist
          <HiArrowRight className="btnIcon" aria-hidden />
        </button>
      </form>
    </div>
  )
}

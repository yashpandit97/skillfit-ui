import { useParams, Link } from 'react-router-dom'
import { HiDocumentText, HiDownload, HiChartBar } from 'react-icons/hi'
import { useQuery } from '@tanstack/react-query'
import { resumeApi } from '../api/client'
import './ResumePreviewPage.css'

export function ResumePreviewPage() {
  const { jobId } = useParams<{ jobId: string }>()
  const id = Number(jobId)

  const { data, isLoading, error } = useQuery({
    queryKey: ['resume-preview', id],
    queryFn: () => resumeApi.preview(id),
    enabled: Number.isFinite(id),
  })

  if (isLoading || !Number.isFinite(id)) {
    return (
      <div className="resumeLoading animatePulse">
        <HiDocumentText className="loadingIcon" aria-hidden />
        <p>Loading resume...</p>
      </div>
    )
  }
  if (error) return <p className="error">Resume not found. Complete the questionnaire first.</p>

  const resume = data?.data?.resume_structured
  if (!resume) return <p>No resume data.</p>

  return (
    <div className="resumePreviewPage animateFadeIn">
      <h1 className="pageTitle">Resume preview</h1>
      <div className="resumeActions">
        <Link to={`/download/${id}`} className="btn btnPrimary">
          <HiDownload className="btnIcon" aria-hidden />
          Download .docx
        </Link>
        <Link to="/gap" className="btn btnGhost">
          <HiChartBar className="btnIcon" aria-hidden />
          Skill gap dashboard
        </Link>
      </div>
      <div className="resumeContent card">
        {resume.summary && (
          <section className="resumeSection">
            <h3 className="resumeHeading">Summary</h3>
            <p className="resumeSummary">
              {resume.summary}
              {resume.summary_deficiency && <span className="deficient">{resume.summary_deficiency}</span>}
            </p>
          </section>
        )}
        {resume.sections?.map((sec, i) => (
          <section key={i} className="resumeSection">
            <h3 className="resumeHeading">{sec.heading}</h3>
            <ul className="resumeBullets">
              {sec.bullets?.map((b, j) => (
                <li key={j}>
                  {b.text}
                  {b.is_deficient && b.deficiency_comment && <span className="deficient"> {b.deficiency_comment}</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

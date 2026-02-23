import { useQuery } from '@tanstack/react-query'
import { HiChartBar, HiExclamation, HiLightBulb, HiShieldExclamation, HiDocumentText, HiDownload } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { gapApi } from '../api/client'
import type { SkillGapDashboardItem } from '../api/client'
import './SkillGapDashboardPage.css'

export function SkillGapDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['gap-list'],
    queryFn: () => gapApi.list(),
  })

  const items: SkillGapDashboardItem[] = data?.data?.items ?? []

  if (isLoading) {
    return (
      <div className="gapLoading animatePulse">
        <HiChartBar className="loadingIcon" aria-hidden />
        <p>Loading skill gaps...</p>
      </div>
    )
  }
  if (error) return <p className="error">Failed to load skill gaps.</p>

  return (
    <div className="gapPage animateFadeIn">
      <h1 className="pageTitle">Skill gap dashboard</h1>
      <p className="pageSubtitle">
        Review weaknesses, improvement suggestions, and resume risks from your concept checklists.
      </p>
      {items.length === 0 ? (
        <div className="gapEmpty card">
          <HiChartBar className="emptyIcon" aria-hidden />
          <p>No skill gap records yet.</p>
          <p className="gapEmptyHint">Complete a job questionnaire to see your gaps and get a resume.</p>
        </div>
      ) : (
        <ul className="gapList">
          {items.map((item) => (
            <li key={item.job_submission_id} className="gapCard card">
              <div className="gapCardHeader">
                <span className="gapJobId">Job #{item.job_submission_id}</span>
                <span className={`gapSeverity severity${item.overall_gap_severity}`}>
                  {item.overall_gap_severity}
                </span>
              </div>
              <div className="gapDetails">
                <details className="gapDetail">
                  <summary><HiExclamation className="detailIcon" aria-hidden /> Weaknesses</summary>
                  <ul>{item.weaknesses.map((w, i) => <li key={i}>{w}</li>)}</ul>
                </details>
                <details className="gapDetail">
                  <summary><HiLightBulb className="detailIcon" aria-hidden /> Improvement suggestions</summary>
                  <ul>{item.improvement_suggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </details>
                {item.resume_risk_claims.length > 0 && (
                  <details className="gapDetail">
                    <summary><HiShieldExclamation className="detailIcon" aria-hidden /> Resume risk claims</summary>
                    <ul>{item.resume_risk_claims.map((r, i) => <li key={i}><strong>{r.claim}</strong> — {r.risk}</li>)}</ul>
                  </details>
                )}
              </div>
              <div className="gapActions">
                <Link to={`/resume/${item.job_submission_id}`} className="btn btnGhost btnSm">
                  <HiDocumentText className="btnIcon" aria-hidden />
                  View resume
                </Link>
                <Link to={`/download/${item.job_submission_id}`} className="btn btnPrimary btnSm">
                  <HiDownload className="btnIcon" aria-hidden />
                  Download .docx
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

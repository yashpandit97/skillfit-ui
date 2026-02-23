import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).state?.token : null
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.removeItem('auth')
      window.location.href = '/login'
    }
    return Promise.reject(e)
  }
)

export default api

// Types matching backend schemas
export interface JobInputRequest {
  job_title?: string
  job_description?: string
}

export interface JobInputResponse {
  job_submission_id: number
  job_title?: string
  normalized_description?: string
  extracted_skills?: Record<string, unknown>
  questionnaire?: QuestionnaireItem[]
  message: string
}

export interface QuestionnaireItem {
  id: string
  concept: string
  category: string
  description?: string | null
  /** Present when backend uses variable questions per stage */
  stage?: number
}

export interface QuestionnaireResponse {
  questions: QuestionnaireItem[]
  current_stage: number
  total_stages: number
  ready: boolean
}

export interface StageAnswersRequest {
  stage: number
  answers: Record<string, string>
}

export interface StageAnswersResponse {
  next_stage_questions: QuestionnaireItem[]
  current_stage: number
  done: boolean
  message: string
}

/** True if backend returned done: true (no more stages; user can submit to generate resume). */
export function isQuestionnaireDone(res: { data?: StageAnswersResponse }): boolean {
  return res?.data?.done === true
}

export interface UserAnswersPayload {
  answers: Record<string, string>
}

export interface SkillAreaScore {
  area: string
  score: number
  missing_concepts: string[]
  strong_areas?: string[]
  recommendation?: string | null
}

export interface EvaluationResultResponse {
  scores: SkillAreaScore[]
  overall_score?: number
  summary?: string
  concepts_to_prepare?: string[]
}

export interface SkillGapDashboardItem {
  job_submission_id: number
  weaknesses: string[]
  improvement_suggestions: string[]
  resume_risk_claims: { claim: string; risk: string }[]
  overall_gap_severity: string
  scores_by_area?: Record<string, unknown>[]
}

export interface ResumePreviewResponse {
  job_submission_id: number
  resume_structured: { summary?: string; summary_deficiency?: string; sections: { heading: string; bullets: { text: string; is_deficient: boolean; deficiency_comment?: string }[] }[] }
  docx_path: string | null
}

export const jobApi = {
  input: (data: JobInputRequest) => api.post<JobInputResponse>('/job/input', data),
  getQuestionnaire: (jobId: number) => api.get<QuestionnaireResponse>(`/job/${jobId}/questionnaire`),
  submitStageAnswers: (jobId: number, data: StageAnswersRequest) =>
    api.post<StageAnswersResponse>(`/job/${jobId}/questionnaire/stage-answers`, data),
  /** Stream job input; onQuestion called per question; resolves with job_submission_id. */
  async inputStream(data: JobInputRequest, onQuestion?: (q: QuestionnaireItem) => void): Promise<number> {
    const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')!).state?.token : null
    const res = await fetch('/api/job/input/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail ?? `Request failed: ${res.status}`)
    }
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')
    const decoder = new TextDecoder()
    let buffer = ''
    let jobSubmissionId: number | null = null
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const events = buffer.split('\n\n')
      buffer = events.pop() ?? ''
      for (const block of events) {
        let event = 'message'
        let dataLine = ''
        for (const line of block.split('\n')) {
          if (line.startsWith('event: ')) event = line.slice(7).trim()
          else if (line.startsWith('data: ')) dataLine = line.slice(6)
        }
        if (!dataLine) continue
        try {
          const payload = JSON.parse(dataLine)
          if (event === 'started' && payload.job_submission_id != null) jobSubmissionId = Number(payload.job_submission_id)
          else if (event === 'question' && payload.id && payload.concept && payload.category) onQuestion?.(payload as QuestionnaireItem)
          else if (event === 'done' && payload.job_submission_id != null) jobSubmissionId = Number(payload.job_submission_id)
          else if (event === 'error' && payload.detail) throw new Error(payload.detail)
        } catch (e) {
          if (e instanceof Error && event === 'error') throw e
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }
    if (jobSubmissionId == null) throw new Error('Stream ended without job_submission_id')
    return jobSubmissionId
  },
}

export const questionnaireApi = {
  submit: (jobId: number, data: UserAnswersPayload) => api.post<EvaluationResultResponse>(`/questionnaire/${jobId}/submit`, data),
}

export const gapApi = {
  list: () => api.get<{ items: SkillGapDashboardItem[] }>('/gap/'),
  get: (jobId: number) => api.get<SkillGapDashboardItem>(`/gap/${jobId}`),
}

export const resumeApi = {
  preview: (jobId: number) => api.get<ResumePreviewResponse>(`/resume/preview/${jobId}`),
  downloadUrl: (jobId: number) => `/api/resume/download/${jobId}`,
  downloadBlob: async (jobId: number): Promise<Blob> => {
    const { data } = await api.get(`/resume/download/${jobId}`, { responseType: 'blob' })
    return data as Blob
  },
}

export const authApi = {
  register: (email: string, password: string, full_name?: string) =>
    api.post('/auth/register', { email, password, full_name }),
  login: (email: string, password: string) =>
    api.post<{ access_token: string }>('/auth/login', { email, password }),
}

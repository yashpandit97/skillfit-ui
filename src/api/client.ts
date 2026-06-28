import axios from 'axios'
import { API_BASE, apiUrl, getWsBaseUrl } from '../lib/apiBase'

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

function getAuthToken(): string | null {
  try {
    const auth = localStorage.getItem('auth')
    if (!auth) return null
    const parsed = JSON.parse(auth) as { state?: { token?: string } }
    return parsed?.state?.token ?? null
  } catch {
    return null
  }
}

api.interceptors.request.use((config) => {
  const token = getAuthToken()
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
  company_name?: string
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
  total_stages?: number
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

/** One weakness or improvement with optional study URLs (backend may return string for legacy). */
export interface SkillGapItemWithUrls {
  text: string
  study_urls?: { websites?: string[]; youtube?: string[] }
}

export interface SkillGapDashboardItem {
  job_submission_id: number
  weaknesses: (string | SkillGapItemWithUrls)[]
  improvement_suggestions: (string | SkillGapItemWithUrls)[]
  resume_risk_claims: { claim: string; risk: string }[]
  overall_gap_severity: string
  scores_by_area?: Record<string, unknown>[]
}

/** Normalize item to { text, study_urls } for consistent rendering. YouTube links are excluded. */
export function normalizeGapItem(item: string | SkillGapItemWithUrls): SkillGapItemWithUrls {
  if (typeof item === 'string') return { text: item, study_urls: { websites: [], youtube: [] } }
  const websites = Array.isArray(item.study_urls?.websites) ? item.study_urls.websites : []
  const filteredWebsites = websites.filter(
    (url) => url && !url.toLowerCase().includes('youtube.com') && !url.toLowerCase().includes('youtu.be')
  )
  return {
    text: item.text ?? '',
    study_urls: {
      websites: filteredWebsites,
      youtube: [],
    },
  }
}

function isYoutubeUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('youtube.com') || lower.includes('youtu.be')
}

/** Website/documentation links only — no YouTube. */
export function filterGuidanceUrls(urls: string[]): string[] {
  return urls.filter((url) => url && !isYoutubeUrl(url))
}

export interface ResumePreviewResponse {
  job_submission_id: number
  resume_structured: { summary?: string; summary_deficiency?: string; sections: { heading: string; bullets: { text: string; is_deficient: boolean; deficiency_comment?: string }[] }[] }
  docx_path: string | null
}

export interface JobSubmissionListItem {
  id: number
  job_title?: string | null
  company_name?: string | null
  status: string
  workflow_mode?: string | null
  created_at: string
}

export interface FitReportItem {
  topic: string
  detail: string
  study_urls: string[]
}

export interface FitReportData {
  overall_fit_score: number
  role_readiness_summary: string
  strengths: string[]
  gaps: string[]
  preparation_plan: FitReportItem[]
  ats_keywords_matched: string[]
  ats_keywords_missing: string[]
}

export interface FitReportResponse {
  job_submission_id: number
  job_title?: string | null
  company_name?: string | null
  status: string
  fit_report: FitReportData
}

export interface JobCompareItem {
  job_submission_id: number
  job_title?: string | null
  company_name?: string | null
  extracted_skills?: Record<string, unknown> | null
  skill_gap_summary?: Record<string, unknown> | null
  overall_gap_severity: string
}

export interface JobCompareResponse {
  job_1: JobCompareItem
  job_2: JobCompareItem
}

export const jobApi = {
  list: () => api.get<{ items: JobSubmissionListItem[] }>('/job/'),
  compare: (jobId1: number, jobId2: number) =>
    api.get<JobCompareResponse>('/job/compare', { params: { job_id_1: jobId1, job_id_2: jobId2 } }),
  fetchJd: (url: string) => api.post<{ job_description: string; job_title?: string }>('/job/fetch-jd', { url }),
  input: (data: JobInputRequest) => api.post<JobInputResponse>('/job/input', data),
  getQuestionnaire: (jobId: number) => api.get<QuestionnaireResponse>(`/job/${jobId}/questionnaire`),
  submitStageAnswers: (jobId: number, data: StageAnswersRequest) =>
    api.post<StageAnswersResponse>(`/job/${jobId}/questionnaire/stage-answers`, data),
  /**
   * Job input via WebSocket: receives LLM progress (0–100) and questions. Use for progress bar.
   */
  async inputStreamWs(
    data: JobInputRequest,
    callbacks: { onProgress?: (progress_pct: number, phase?: string) => void; onQuestion?: (q: QuestionnaireItem) => void }
  ): Promise<number> {
    const token = getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const wsUrl = `${getWsBaseUrl()}/job/input/stream-ws`
    const ws = new WebSocket(wsUrl)
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({
          token: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          job_title: data.job_title ?? undefined,
          job_description: data.job_description ?? undefined,
        }))
      }
      let jobSubmissionId: number | null = null
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as { type: string; progress_pct?: number; phase?: string; job_submission_id?: number; data?: QuestionnaireItem; detail?: string }
          if (msg.type === 'started' && msg.job_submission_id != null) {
            jobSubmissionId = msg.job_submission_id
            if (typeof msg.progress_pct === 'number') callbacks.onProgress?.(msg.progress_pct, msg.phase)
          } else if (msg.type === 'progress' && typeof msg.progress_pct === 'number') callbacks.onProgress?.(msg.progress_pct, msg.phase)
          else if (msg.type === 'question' && msg.data?.id && msg.data?.concept) callbacks.onQuestion?.(msg.data as QuestionnaireItem)
          else if (msg.type === 'done' && msg.job_submission_id != null) {
            jobSubmissionId = msg.job_submission_id
            callbacks.onProgress?.(100)
            ws.close()
          } else if (msg.type === 'error') {
            ws.close()
            reject(new Error(msg.detail ?? 'Request failed'))
          }
        } catch (e) {
          if (e instanceof SyntaxError) return
          reject(e)
        }
      }
      ws.onclose = () => {
        if (jobSubmissionId != null) resolve(jobSubmissionId)
        else reject(new Error('Connection closed without job_submission_id'))
      }
      ws.onerror = () => reject(new Error('WebSocket error'))
    })
  },
  /** Stream job input (SSE); shows as POST in Network tab. onProgress/onQuestion called as events arrive. */
  async inputStream(
    data: JobInputRequest,
    callbacks?: { onProgress?: (progress_pct: number) => void; onQuestion?: (q: QuestionnaireItem) => void } | ((q: QuestionnaireItem) => void)
  ): Promise<number> {
    const onProgress = typeof callbacks === 'object' ? callbacks?.onProgress : undefined
    const onQuestion = typeof callbacks === 'function' ? callbacks : (typeof callbacks === 'object' ? callbacks?.onQuestion : undefined)
    const token = getAuthToken()
    const res = await fetch(apiUrl('/job/input/stream'), {
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
          else if (event === 'progress' && typeof payload.progress_pct === 'number') onProgress?.(payload.progress_pct)
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
  /** Stream fit report generation (SSE); no questionnaire questions. */
  async inputFitReportStream(
    data: JobInputRequest,
    callbacks?: { onProgress?: (progress_pct: number, phase?: string) => void }
  ): Promise<number> {
    const onProgress = callbacks?.onProgress
    const token = getAuthToken()
    const res = await fetch(apiUrl('/job/input/fit-report/stream'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`)
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
          else if (event === 'progress' && typeof payload.progress_pct === 'number') onProgress?.(payload.progress_pct, payload.phase)
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
  getFitReport: (jobId: number) => api.get<FitReportResponse>(`/job/${jobId}/fit-report`),
  /**
   * Submit stage answers via WebSocket: receives LLM progress (0–100) while generating next questions.
   */
  async submitStageAnswersWs(
    jobId: number,
    data: StageAnswersRequest,
    callbacks: { onProgress?: (progress_pct: number) => void }
  ): Promise<StageAnswersResponse> {
    const token = getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const wsUrl = `${getWsBaseUrl()}/job/${jobId}/questionnaire/stage-answers-ws`
    const ws = new WebSocket(wsUrl)
    return new Promise((resolve, reject) => {
      ws.onopen = () => {
        ws.send(JSON.stringify({
          token: token.startsWith('Bearer ') ? token : `Bearer ${token}`,
          stage: data.stage,
          answers: data.answers,
        }))
      }
      let result: StageAnswersResponse | null = null
      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as {
            type: string
            progress_pct?: number
            next_stage_questions?: QuestionnaireItem[]
            current_stage?: number
            total_stages?: number
            done?: boolean
            message?: string
            detail?: string
          }
          if (msg.type === 'progress' && typeof msg.progress_pct === 'number') callbacks.onProgress?.(msg.progress_pct)
          else if (msg.type === 'done') {
            callbacks.onProgress?.(100)
            result = {
              next_stage_questions: msg.next_stage_questions ?? [],
              current_stage: msg.current_stage ?? data.stage,
              total_stages: msg.total_stages ?? 1,
              done: msg.done ?? false,
              message: msg.message ?? '',
            }
            ws.close()
          } else if (msg.type === 'error') {
            ws.close()
            reject(new Error(msg.detail ?? 'Request failed'))
          }
        } catch (e) {
          if (e instanceof SyntaxError) return
          reject(e)
        }
      }
      ws.onclose = () => {
        if (result != null) resolve(result)
        else reject(new Error('Connection closed without response'))
      }
      ws.onerror = () => reject(new Error('WebSocket error'))
    })
  },

  /**
   * Submit stage answers via SSE stream (same as job input). Progress bar updates reliably; shows in Network tab.
   */
  async submitStageAnswersStream(
    jobId: number,
    data: StageAnswersRequest,
    callbacks: { onProgress?: (progress_pct: number) => void }
  ): Promise<StageAnswersResponse> {
    const token = getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(apiUrl(`/job/${jobId}/questionnaire/stage-answers/stream`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`)
    }
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')
    const decoder = new TextDecoder()
    let buffer = ''
    let result: StageAnswersResponse | null = null
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
          const payload = JSON.parse(dataLine) as Record<string, unknown>
          if (event === 'progress' && typeof payload.progress_pct === 'number') {
            callbacks.onProgress?.(payload.progress_pct)
          } else if (event === 'done') {
            callbacks.onProgress?.(100)
            result = {
              next_stage_questions: (payload.next_stage_questions as QuestionnaireItem[]) ?? [],
              current_stage: (payload.current_stage as number) ?? data.stage,
              done: (payload.done as boolean) ?? false,
              message: (payload.message as string) ?? '',
            }
          } else if (event === 'error' && payload.detail) {
            throw new Error(String(payload.detail))
          }
        } catch (e) {
          if (e instanceof Error && event === 'error') throw e
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }
    if (result == null) throw new Error('Stream ended without done event')
    return result
  },
}

export const questionnaireApi = {
  submit: (jobId: number, data: UserAnswersPayload) => api.post<EvaluationResultResponse>(`/questionnaire/${jobId}/submit`, data),

  /**
   * Submit via SSE stream; onProgress(0–100) while generating resume. Resolves with EvaluationResultResponse.
   */
  async submitStream(
    jobId: number,
    data: UserAnswersPayload,
    callbacks: { onProgress?: (progress_pct: number) => void }
  ): Promise<EvaluationResultResponse> {
    const token = getAuthToken()
    if (!token) throw new Error('Not authenticated')
    const res = await fetch(apiUrl(`/questionnaire/${jobId}/submit/stream`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { detail?: string }).detail ?? `Request failed: ${res.status}`)
    }
    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')
    const decoder = new TextDecoder()
    let buffer = ''
    let result: EvaluationResultResponse | null = null
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
          const payload = JSON.parse(dataLine) as Record<string, unknown>
          if (event === 'progress' && typeof payload.progress_pct === 'number') {
            callbacks.onProgress?.(payload.progress_pct)
          } else if (event === 'done') {
            callbacks.onProgress?.(100)
            result = {
              scores: (payload.scores as SkillAreaScore[]) ?? [],
              overall_score: payload.overall_score as number | undefined,
              summary: payload.summary as string | undefined,
              concepts_to_prepare: payload.concepts_to_prepare as string[] | undefined,
            }
          } else if (event === 'error' && payload.detail) {
            throw new Error(String(payload.detail))
          }
        } catch (e) {
          if (e instanceof Error && event === 'error') throw e
          if (e instanceof SyntaxError) continue
          throw e
        }
      }
    }
    if (result == null) throw new Error('Stream ended without done event')
    return result
  },
}

export interface SkillGraphNode {
  id: string
  label: string
  category: string
  strength: 'strong' | 'partial' | 'gap'
}

export interface SkillGraphResponse {
  nodes: SkillGraphNode[]
  edges: { source: string; target: string; type: string }[]
}

export const gapApi = {
  list: () => api.get<{ items: SkillGapDashboardItem[] }>('/gap/'),
  get: (jobId: number) => api.get<SkillGapDashboardItem>(`/gap/${jobId}`),
  skillGraph: (jobId: number) => api.get<SkillGraphResponse>(`/gap/${jobId}/skill-graph`),
  exportUrl: (jobId: number, format: 'md' | 'pdf') => apiUrl(`/gap/${jobId}/export?format=${format}`),
  exportBlob: async (jobId: number, format: 'md' | 'pdf'): Promise<Blob> => {
    const { data } = await api.get(`/gap/${jobId}/export`, { params: { format }, responseType: 'blob' })
    return data as Blob
  },
}

export interface ResumeVersionItem {
  id: number
  version: number
  created_at: string
}

export interface ResumeVersionsResponse {
  job_submission_id: number
  versions: ResumeVersionItem[]
}

export interface ResumeDiffResponse {
  job_submission_id: number
  v1: number
  v2: number
  removed: { section: string; text: string; status: string }[]
  added: { section: string; text: string; status: string }[]
  unchanged: { section: string; text: string; status: string }[]
}

export const resumeApi = {
  preview: (jobId: number) => api.get<ResumePreviewResponse>(`/resume/preview/${jobId}`),
  previewVersion: (jobId: number, version: number) =>
    api.get<ResumePreviewResponse>(`/resume/preview/${jobId}/version/${version}`),
  versions: (jobId: number) => api.get<ResumeVersionsResponse>(`/resume/versions/${jobId}`),
  diff: (jobId: number, v1: number, v2: number) =>
    api.get<ResumeDiffResponse>(`/resume/diff/${jobId}`, { params: { v1, v2 } }),
  atsScore: (jobId: number) =>
    api.get<{ score: number; matched_keywords: string[]; missing_keywords: string[] }>(`/resume/ats-score/${jobId}`),
  share: (jobSubmissionId: number) =>
    api.post<{ share_url: string; expires_at: string }>('/resume/share', { job_submission_id: jobSubmissionId }),
  tailoredSummary: (jobId: number) =>
    api.post<{ one_liner: string }>('/resume/tailored-summary', { job_submission_id: jobId }),
  downloadUrl: (jobId: number) => apiUrl(`/resume/download/${jobId}`),
  downloadPdfUrl: (jobId: number) => apiUrl(`/resume/download/${jobId}/pdf`),
  downloadBlob: async (jobId: number): Promise<Blob> => {
    const { data } = await api.get(`/resume/download/${jobId}`, { responseType: 'blob' })
    return data as Blob
  },
}

export interface ProfileResponse {
  skills: string[]
  experience_summary?: string | null
  baseline_resume_json?: Record<string, unknown> | null
}

export const profileApi = {
  get: () => api.get<ProfileResponse>('/profile'),
  update: (data: { skills?: string[]; experience_summary?: string | null }) =>
    api.put<ProfileResponse>('/profile', data),
  uploadResume: async (file: File): Promise<{ message: string; chars_extracted: number }> => {
    const form = new FormData()
    form.append('file', file)
    const token = getAuthToken()
    const res = await fetch(apiUrl('/profile/resume'), {
      method: 'PUT',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error((err as { detail?: string }).detail ?? 'Upload failed')
    }
    return res.json()
  },
}

export const authApi = {
  firebaseLogin: (idToken: string) =>
    api.post<{ access_token: string; token_type: string }>('/auth/firebase', { id_token: idToken }),
  me: () => api.get<{ id: number; email: string; full_name?: string | null }>('/auth/me'),
}

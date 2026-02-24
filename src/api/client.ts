import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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

/** Normalize item to { text, study_urls } for consistent rendering. */
export function normalizeGapItem(item: string | SkillGapItemWithUrls): SkillGapItemWithUrls {
  if (typeof item === 'string') return { text: item, study_urls: { websites: [], youtube: [] } }
  return {
    text: item.text ?? '',
    study_urls: {
      websites: Array.isArray(item.study_urls?.websites) ? item.study_urls.websites : [],
      youtube: Array.isArray(item.study_urls?.youtube) ? item.study_urls.youtube : [],
    },
  }
}

export interface ResumePreviewResponse {
  job_submission_id: number
  resume_structured: { summary?: string; summary_deficiency?: string; sections: { heading: string; bullets: { text: string; is_deficient: boolean; deficiency_comment?: string }[] }[] }
  docx_path: string | null
}

/** WebSocket base URL (same origin, so proxy works). */
function getWsBaseUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}/api`
}

export const jobApi = {
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
    const res = await fetch(`/api/job/${jobId}/questionnaire/stage-answers/stream`, {
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
    const res = await fetch(`/api/questionnaire/${jobId}/submit/stream`, {
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

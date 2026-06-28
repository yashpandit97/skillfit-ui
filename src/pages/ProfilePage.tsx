import { useState, useEffect } from 'react'
import { Box, Flex, Text, Input } from '@chakra-ui/react'
import { HiUser, HiDocumentText, HiUpload } from 'react-icons/hi'
import { profileApi, type ProfileResponse } from '../api/client'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { FormField, FormTextarea } from '../components/ui/FormField'
import { Alert } from '../components/ui/Alert'
import { Skeleton, SkeletonText } from '../components/ui/Skeleton'
import { toaster } from '../lib/toaster'

export function ProfilePage() {
  const [skills, setSkills] = useState<string[]>([])
  const [skillInput, setSkillInput] = useState('')
  const [experienceSummary, setExperienceSummary] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    profileApi
      .get()
      .then((res) => {
        if (cancelled) return
        const d = res.data as ProfileResponse
        setSkills(d.skills ?? [])
        setExperienceSummary(d.experience_summary ?? '')
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load profile')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) {
      setSkills((prev) => [...prev, s])
      setSkillInput('')
    }
  }

  const removeSkill = (idx: number) => {
    setSkills((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      await profileApi.update({ skills, experience_summary: experienceSummary || null })
      toaster.create({ title: 'Profile saved', type: 'success' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf') && !file.name.toLowerCase().endsWith('.docx')) {
      setError('Only .pdf or .docx files allowed')
      return
    }
    setError(null)
    setUploading(true)
    try {
      await profileApi.uploadResume(file)
      toaster.create({ title: 'Resume uploaded', type: 'success' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
    e.target.value = ''
  }

  if (loading) {
    return (
      <Box maxW="672px" mx="auto">
        <Skeleton height="32px" width="200px" mb={4} />
        <SkeletonText noOfLines={4} gap={4} />
      </Box>
    )
  }

  return (
    <Box maxW="672px" mx="auto">
      <PageHeader
        title="Profile"
        subtitle="Add your skills and experience so we can personalize your resumes. Optional: upload a baseline resume."
      />
      <Card as="form" onSubmit={handleSave}>
        <FormField label={<><HiUser aria-hidden /> Skills (add one at a time)</>} id="skills">
          <Flex gap={2}>
            <Input
              id="skills"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="e.g. Python, React"
              bg="bg.canvas"
              borderColor="border.default"
              borderRadius="md"
            />
            <Button type="button" variant="outline" onClick={addSkill}>
              Add
            </Button>
          </Flex>
          {skills.length > 0 && (
            <Flex gap={2} flexWrap="wrap" mt={3}>
              {skills.map((s, i) => (
                <Flex
                  key={i}
                  align="center"
                  gap={1}
                  px={2}
                  py={1}
                  bg="bg.elevated"
                  borderRadius="md"
                  fontSize="sm"
                >
                  {s}
                  <Button type="button" variant="ghost" size="xs" onClick={() => removeSkill(i)} aria-label={`Remove ${s}`}>
                    ×
                  </Button>
                </Flex>
              ))}
            </Flex>
          )}
        </FormField>

        <FormField label={<><HiDocumentText aria-hidden /> Experience summary</>} id="experience">
          <FormTextarea
            id="experience"
            value={experienceSummary}
            onChange={(e) => setExperienceSummary(e.target.value)}
            placeholder="Brief summary of your background (used to tailor resume content)"
            rows={4}
          />
        </FormField>

        <FormField label={<><HiUpload aria-hidden /> Baseline resume (optional)</>}>
          <Input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} disabled={uploading} size="sm" />
          {uploading && (
            <Text fontSize="sm" color="fg.muted" mt={1}>
              Uploading…
            </Text>
          )}
        </FormField>

        {error && <Alert status="error">{error}</Alert>}
        <Button type="submit" loading={saving}>
          {saving ? 'Saving…' : 'Save profile'}
        </Button>
      </Card>
    </Box>
  )
}

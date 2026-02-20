'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button, DropZone, Alert } from '@/components/ui'

type ReportCardScannerProps = {
  onScanComplete: (result: ScanApiResult) => void
  onCancel: () => void
  locale: string
  gradingSystemCountry?: string
}

export type ScanApiResult = {
  success: boolean
  subjects: Array<{
    originalName: string
    grade: string
    confidence: number
    matchedSubjectId?: string
    matchedSubjectName?: string
    matchConfidence: 'high' | 'medium' | 'low' | 'none'
  }>
  metadata: {
    schoolYear?: string
    classLevel?: number
    studentName?: string
    termType?: string
    schoolName?: string
  }
  overallConfidence: number
  subjectCount: number
  matchedCount: number
  suggestedCountryCode?: string
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff']

export function ReportCardScanner({
  onScanComplete,
  onCancel,
  locale,
  gradingSystemCountry,
}: ReportCardScannerProps) {
  const t = useTranslations('scanner')
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (file: File) => {
    setError(null)

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError(t('invalidFileType'))
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(t('fileTooLarge'))
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setRotation(0)
    }
    reader.readAsDataURL(file)
  }

  const handleScan = async () => {
    if (!preview) return
    setScanning(true)
    setError(null)

    try {
      const res = await fetch('/api/grades/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: preview,
          locale,
          gradingSystemCountry,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.error || t('scanFailed'))
        return
      }
      if (data.debugInfo) {
        console.log('[dbg:scanner] Raw OCR text:\n' + (data.debugInfo.rawLines ?? []).join('\n'))
        console.log(
          '[dbg:scanner] Parsed subjects:\n' +
            (data.debugInfo.parsedSubjects ?? [])
              .map((s: { name: string; grade: string }) => `  ${s.name} → ${s.grade}`)
              .join('\n')
        )
        console.log(
          '[dbg:scanner] Match details:\n' +
            (data.debugInfo.matchDetails ?? [])
              .map(
                (s: { ocr: string; matched: string; confidence: string }) =>
                  `  ${s.ocr} → ${s.matched} [${s.confidence}]`
              )
              .join('\n')
        )
        if (data.metadata) {
          console.log('[dbg:scanner] Metadata:', JSON.stringify(data.metadata, null, 2))
        }
        if (data.debugInfo.suggestedCountryCode) {
          console.log('[dbg:scanner] Suggested country:', data.debugInfo.suggestedCountryCode)
        }
      }
      onScanComplete(data)
    } catch {
      setError(t('scanFailed'))
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-4">
      {!preview ? (
        <DropZone
          onFile={handleFile}
          accept="image/*"
          maxSize={MAX_FILE_SIZE}
          icon={<span>&#128247;</span>}
          title={t('uploadOrCapture')}
          subtitle={t('dragAndDrop')}
          actions={
            <>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold cursor-pointer hover:bg-primary-700 transition-colors">
                {t('takePhoto')}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                  }}
                />
              </label>
            </>
          }
        />
      ) : (
        <div className="space-y-3">
          <div className="relative rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={t('imagePreview')}
              className="max-h-96 object-contain transition-transform"
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="ghost" size="sm" onClick={() => setRotation((r) => (r + 90) % 360)}>
              {t('rotate')} 90&deg;
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPreview(null)
                setRotation(0)
              }}
            >
              {t('retake')}
            </Button>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleScan} isLoading={scanning} disabled={scanning}>
              {scanning ? t('scanning') : t('startScan')}
            </Button>
            <Button variant="ghost" onClick={onCancel}>
              {t('cancel')}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <Alert variant="error" onDismiss={() => setError(null)}>
          {error}
        </Alert>
      )}
    </div>
  )
}

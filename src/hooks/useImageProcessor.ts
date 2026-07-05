import { useEffect, useRef, useState } from 'react'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { processImage } from '#/lib/process.ts'
import type { ProcessOptions } from '#/lib/process.ts'

interface State {
  result: ProcessResult | null
  isProcessing: boolean
  error: string | null
}

/**
 * Runs the client-side image pipeline whenever the source or options change.
 * Debounced so dragging the quality slider does not re-encode on every pixel.
 * Revokes superseded result object URLs to avoid leaks.
 *
 * The pipeline is a plain async fn (see lib/process.ts); when a Web Worker is
 * added later, only this hook changes — callers keep the same interface.
 */
export function useImageProcessor(
  source: SourceImage | null,
  options: ProcessOptions,
  { debounceMs = 150 }: { debounceMs?: number } = {},
): State & { run: () => void } {
  const [state, setState] = useState<State>({
    result: null,
    isProcessing: false,
    error: null,
  })

  // Keep the latest result in a ref so cleanup can revoke it.
  const resultRef = useRef<ProcessResult | null>(null)
  const runIdRef = useRef(0)

  // Serialize options so the effect only re-runs on meaningful changes.
  const optionsKey = JSON.stringify(options)

  const execute = () => {
    if (!source) return
    const runId = ++runIdRef.current
    setState((s) => ({ ...s, isProcessing: true, error: null }))

    processImage(source, options)
      .then((result) => {
        // A newer run superseded this one — discard.
        if (runId !== runIdRef.current) {
          URL.revokeObjectURL(result.url)
          return
        }
        if (resultRef.current) URL.revokeObjectURL(resultRef.current.url)
        resultRef.current = result
        setState({ result, isProcessing: false, error: null })
      })
      .catch((err: unknown) => {
        if (runId !== runIdRef.current) return
        setState({
          result: null,
          isProcessing: false,
          error: err instanceof Error ? err.message : 'Processing failed.',
        })
      })
  }

  useEffect(() => {
    if (!source) {
      setState({ result: null, isProcessing: false, error: null })
      return
    }
    const t = setTimeout(execute, debounceMs)
    return () => clearTimeout(t)
  }, [source, optionsKey, debounceMs])

  // Revoke the last result on unmount.
  useEffect(() => {
    return () => {
      if (resultRef.current) URL.revokeObjectURL(resultRef.current.url)
    }
  }, [])

  return { ...state, run: execute }
}

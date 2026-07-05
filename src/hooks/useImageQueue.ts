import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { releaseSourceImage } from '#/lib/source.ts'
import { imagePool } from '#/workers/imagePool.ts'

export type QueueStatus = 'pending' | 'processing' | 'done' | 'error'

export interface QueueItem {
  source: SourceImage
  status: QueueStatus
  result?: ProcessResult
  error?: string
}

interface QueueApi {
  items: Array<QueueItem>
  doneCount: number
  errorCount: number
  isProcessing: boolean
  addSources: (images: Array<SourceImage>) => void
  remove: (id: string) => void
  clear: () => void
}

function patch(
  items: Array<QueueItem>,
  id: string,
  change: Partial<QueueItem>,
): Array<QueueItem> {
  return items.map((it) => (it.source.id === id ? { ...it, ...change } : it))
}

/**
 * Owns a list of source images and runs each through the shared worker pool
 * whenever it's added or the encode options change. Mirrors `useImageProcessor`'s
 * URL discipline: result URLs are revoked when superseded, removed, or unmounted,
 * and source images are released on removal/unmount.
 *
 * Processing is incremental — adding a file only encodes the new file, while
 * changing options re-encodes everything (each in-flight result is guarded by the
 * options key it was requested for, so stale results are discarded, not shown).
 */
export function useImageQueue(options: ProcessOptions): QueueApi {
  const [sources, setSources] = useState<Array<SourceImage>>([])
  const [items, setItems] = useState<Array<QueueItem>>([])

  const optionsKey = JSON.stringify(options)
  const sourcesKey = sources.map((s) => s.id).join(',')

  // id -> the current done result (kept so we can revoke its URL).
  const resultsRef = useRef<Map<string, ProcessResult>>(new Map())
  // id -> the options key we most recently requested processing for.
  const desiredRef = useRef<Map<string, string>>(new Map())
  // Latest sources, for unmount cleanup.
  const sourcesRef = useRef<Array<SourceImage>>([])
  sourcesRef.current = sources

  // Keep `options` fresh for the async closures without re-firing the effect.
  const optionsRef = useRef(options)
  optionsRef.current = options

  useEffect(() => {
    const ids = new Set(sources.map((s) => s.id))

    // Drop bookkeeping + results for sources that were removed.
    for (const id of [...desiredRef.current.keys()]) {
      if (!ids.has(id)) desiredRef.current.delete(id)
    }
    for (const [id, result] of [...resultsRef.current]) {
      if (!ids.has(id)) {
        URL.revokeObjectURL(result.url)
        resultsRef.current.delete(id)
      }
    }

    // Seed the visible list: keep results that already match the current options.
    setItems(
      sources.map((s) => {
        const done = resultsRef.current.get(s.id)
        if (done && desiredRef.current.get(s.id) === optionsKey) {
          return { source: s, status: 'done', result: done }
        }
        return { source: s, status: 'pending' }
      }),
    )

    sources.forEach((source) => {
      // Already have a current-options result — nothing to do.
      if (
        desiredRef.current.get(source.id) === optionsKey &&
        resultsRef.current.has(source.id)
      ) {
        return
      }

      desiredRef.current.set(source.id, optionsKey)
      const stale = resultsRef.current.get(source.id)
      if (stale) {
        URL.revokeObjectURL(stale.url)
        resultsRef.current.delete(source.id)
      }

      setItems((prev) =>
        patch(prev, source.id, {
          status: 'processing',
          result: undefined,
          error: undefined,
        }),
      )

      imagePool
        .process(
          {
            file: source.file,
            width: source.width,
            height: source.height,
          },
          optionsRef.current,
        )
        .then((result) => {
          // Superseded by an options change (or the source was removed).
          if (desiredRef.current.get(source.id) !== optionsKey) {
            URL.revokeObjectURL(result.url)
            return
          }
          resultsRef.current.set(source.id, result)
          setItems((prev) => patch(prev, source.id, { status: 'done', result }))
        })
        .catch((err: unknown) => {
          if (desiredRef.current.get(source.id) !== optionsKey) return
          setItems((prev) =>
            patch(prev, source.id, {
              status: 'error',
              error: err instanceof Error ? err.message : 'Processing failed.',
            }),
          )
        })
    })
    // sourcesKey + optionsKey capture every meaningful change; `options` and
    // `sources` are read through refs so they don't need to be dependencies.
  }, [sourcesKey, optionsKey])

  // Release everything on unmount.
  useEffect(() => {
    return () => {
      for (const result of resultsRef.current.values()) {
        URL.revokeObjectURL(result.url)
      }
      resultsRef.current.clear()
      for (const source of sourcesRef.current) releaseSourceImage(source)
    }
  }, [])

  const api = useMemo<Omit<QueueApi, 'items' | 'doneCount' | 'errorCount' | 'isProcessing'>>(
    () => ({
      addSources: (images) =>
        setSources((prev) => {
          const seen = new Set(prev.map((s) => s.id))
          return [...prev, ...images.filter((i) => !seen.has(i.id))]
        }),
      remove: (id) =>
        setSources((prev) => {
          const target = prev.find((s) => s.id === id)
          if (target) releaseSourceImage(target)
          return prev.filter((s) => s.id !== id)
        }),
      clear: () =>
        setSources((prev) => {
          for (const s of prev) releaseSourceImage(s)
          return []
        }),
    }),
    [],
  )

  const doneCount = items.filter((i) => i.status === 'done').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const isProcessing = items.some(
    (i) => i.status === 'pending' || i.status === 'processing',
  )

  return { items, doneCount, errorCount, isProcessing, ...api }
}

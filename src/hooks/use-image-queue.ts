import { useEffect, useMemo, useRef, useState } from 'react'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { releaseSourceImage } from '#/lib/source.ts'
import { imagePool } from '#/workers/image-pool.ts'

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
interface Request {
  key: string
  controller: AbortController
}

/** Owns sources, requests and results until removal, replacement or unmount. */
export function useImageQueue(options: ProcessOptions): QueueApi {
  const [sources, setSources] = useState<Array<SourceImage>>([])
  const [items, setItems] = useState<Array<QueueItem>>([])
  const sourcesRef = useRef(sources)
  const resultsRef = useRef(new Map<string, ProcessResult>())
  const requestsRef = useRef(new Map<string, Request>())
  const optionsKey = JSON.stringify(options)

  useEffect(() => {
    const results = resultsRef.current
    const requests = requestsRef.current
    const currentIds = new Set(sources.map((source) => source.id))
    for (const [id, request] of requests) {
      if (!currentIds.has(id) || request.key !== optionsKey) {
        requests.delete(id)
        request.controller.abort()
        const result = results.get(id)
        if (result) URL.revokeObjectURL(result.url)
        results.delete(id)
      }
    }
    const retained = new Set(
      sources
        .filter((source) => requests.get(source.id)?.key === optionsKey)
        .map((source) => source.id),
    )
    setItems((previous) =>
      sources.map((source) => {
        if (retained.has(source.id))
          return (
            previous.find((item) => item.source.id === source.id) ?? {
              source,
              status: 'processing',
            }
          )
        return { source, status: 'processing' }
      }),
    )
    for (const source of sources) {
      // Includes active and failed requests. Adding sources must not duplicate
      // in-flight work or silently retry earlier failures.
      if (requests.get(source.id)?.key === optionsKey) continue
      const request: Request = {
        key: optionsKey,
        controller: new AbortController(),
      }
      requests.set(source.id, request)
      const current = () =>
        requests.get(source.id) === request &&
        !request.controller.signal.aborted
      const patch = (change: Partial<QueueItem>) =>
        setItems((previous) =>
          previous.map((item) =>
            item.source.id === source.id ? { ...item, ...change } : item,
          ),
        )
      void imagePool
        .process(
          { file: source.file, width: source.width, height: source.height },
          options,
          request.controller.signal,
        )
        .then((result) => {
          if (!current()) {
            URL.revokeObjectURL(result.url)
            return
          }
          results.set(source.id, result)
          patch({ status: 'done', result })
        })
        .catch((error: unknown) => {
          if (!current()) return
          patch({
            status: 'error',
            error:
              error instanceof Error ? error.message : 'Processing failed.',
          })
        })
    }
  }, [sources, optionsKey])

  useEffect(
    () => () => {
      for (const request of requestsRef.current.values())
        request.controller.abort()
      requestsRef.current.clear()
      for (const result of resultsRef.current.values())
        URL.revokeObjectURL(result.url)
      resultsRef.current.clear()
      for (const source of sourcesRef.current) releaseSourceImage(source)
      sourcesRef.current = []
    },
    [],
  )

  const api = useMemo(() => {
    const discard = (id: string) => {
      const request = requestsRef.current.get(id)
      requestsRef.current.delete(id)
      request?.controller.abort()
      const result = resultsRef.current.get(id)
      if (result) URL.revokeObjectURL(result.url)
      resultsRef.current.delete(id)
    }
    return {
      addSources: (images: Array<SourceImage>) => {
        const next = [...sourcesRef.current]
        for (const image of images) {
          const duplicate = next.find((source) => source.id === image.id)
          if (!duplicate) next.push(image)
          else if (duplicate.url !== image.url) releaseSourceImage(image)
        }
        sourcesRef.current = next
        setSources(next)
      },
      remove: (id: string) => {
        discard(id)
        const source = sourcesRef.current.find(
          (candidate) => candidate.id === id,
        )
        if (source) releaseSourceImage(source)
        const next = sourcesRef.current.filter(
          (candidate) => candidate.id !== id,
        )
        sourcesRef.current = next
        setSources(next)
      },
      clear: () => {
        for (const source of sourcesRef.current) {
          discard(source.id)
          releaseSourceImage(source)
        }
        sourcesRef.current = []
        setSources([])
      },
    }
  }, [])
  return {
    items,
    doneCount: items.filter((item) => item.status === 'done').length,
    errorCount: items.filter((item) => item.status === 'error').length,
    isProcessing: items.some(
      (item) => item.status === 'pending' || item.status === 'processing',
    ),
    ...api,
  }
}

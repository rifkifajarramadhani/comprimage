/// <reference lib="webworker" />
import { processToBlob } from '#/lib/process.ts'
import type { ProcessInput, ProcessOptions } from '#/lib/process.ts'
import type { OutputFormat } from '#/types/image.ts'

export interface WorkerRequest {
  id: number
  input: ProcessInput
  options: ProcessOptions
}

export type WorkerResponse =
  | {
      id: number
      ok: true
      blob: Blob
      width: number
      height: number
      format: OutputFormat
    }
  | { id: number; ok: false; error: string }

self.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const { id, input, options } = event.data
  processToBlob(input, options)
    .then(({ blob, width, height, format }) => {
      const message: WorkerResponse = {
        id,
        ok: true,
        blob,
        width,
        height,
        format,
      }
      // Blob is structured-cloneable; no transferable needed.
      self.postMessage(message)
    })
    .catch((err: unknown) => {
      const message: WorkerResponse = {
        id,
        ok: false,
        error: err instanceof Error ? err.message : 'Processing failed.',
      }
      self.postMessage(message)
    })
})

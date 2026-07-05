import type { ProcessInput, ProcessOptions } from '#/lib/process.ts'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { processImage } from '#/lib/process.ts'
import type { WorkerRequest, WorkerResponse } from './image.worker.ts'

/**
 * A small pool of Web Workers that runs the image pipeline off the main thread.
 * Both the single-image hook and the batch queue share one lazily-created pool.
 *
 * Requests are correlated by an incrementing id and queued when every worker is
 * busy. Object URLs are minted here on the main thread (blob URLs created inside
 * a worker are not reliably usable from the document). If Web Workers or
 * OffscreenCanvas are unavailable, we fall back to main-thread `processImage`.
 */

interface Pending {
  resolve: (result: ProcessResult) => void
  reject: (error: Error) => void
}

interface PoolTask {
  id: number
  input: ProcessInput
  options: ProcessOptions
  pending: Pending
}

const POOL_SIZE = Math.max(
  1,
  Math.min(
    typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : 4,
    4,
  ),
)

function workersSupported(): boolean {
  return (
    typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
  )
}

class ImagePool {
  private workers: Array<Worker> = []
  private idle: Array<Worker> = []
  private queue: Array<PoolTask> = []
  private inFlight = new Map<number, Pending>()
  private busyWorker = new Map<number, Worker>()
  private nextId = 1
  private started = false

  private ensureStarted() {
    if (this.started) return
    this.started = true
    for (let i = 0; i < POOL_SIZE; i++) {
      const worker = new Worker(
        new URL('./image.worker.ts', import.meta.url),
        { type: 'module' },
      )
      worker.addEventListener('message', (e: MessageEvent<WorkerResponse>) =>
        this.onMessage(worker, e.data),
      )
      this.workers.push(worker)
      this.idle.push(worker)
    }
  }

  private onMessage(worker: Worker, data: WorkerResponse) {
    const pending = this.inFlight.get(data.id)
    this.inFlight.delete(data.id)
    this.busyWorker.delete(data.id)
    this.idle.push(worker)

    if (pending) {
      if (data.ok) {
        pending.resolve({
          blob: data.blob,
          url: URL.createObjectURL(data.blob),
          width: data.width,
          height: data.height,
          size: data.blob.size,
          format: data.format,
        })
      } else {
        pending.reject(new Error(data.error))
      }
    }
    this.pump()
  }

  private pump() {
    while (this.queue.length > 0 && this.idle.length > 0) {
      const task = this.queue.shift()!
      const worker = this.idle.shift()!
      this.inFlight.set(task.id, task.pending)
      this.busyWorker.set(task.id, worker)
      const message: WorkerRequest = {
        id: task.id,
        input: task.input,
        options: task.options,
      }
      worker.postMessage(message)
    }
  }

  process(input: ProcessInput, options: ProcessOptions): Promise<ProcessResult> {
    if (!workersSupported()) {
      // Main-thread fallback keeps behaviour identical on old browsers.
      return processImage(
        { file: input.file, width: input.width, height: input.height } as SourceImage,
        options,
      )
    }
    this.ensureStarted()
    const id = this.nextId++
    return new Promise<ProcessResult>((resolve, reject) => {
      this.queue.push({ id, input, options, pending: { resolve, reject } })
      this.pump()
    })
  }
}

export const imagePool = new ImagePool()

/** Convenience: process a `SourceImage` and get a `ProcessResult` with a fresh URL. */
export function processInPool(
  source: SourceImage,
  options: ProcessOptions,
): Promise<ProcessResult> {
  return imagePool.process(
    { file: source.file, width: source.width, height: source.height },
    options,
  )
}

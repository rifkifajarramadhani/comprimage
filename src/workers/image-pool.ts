import type {
  ProcessInput,
  ProcessOptions,
  ProcessedBlob,
} from '#/lib/process.ts'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import { processToBlob } from '#/lib/process.ts'
import { WORKER_TIMEOUT_MS } from '#/lib/image-limits.ts'
import { clampConcurrency, maxConcurrency } from '#/lib/settings.ts'
import type { WorkerRequest, WorkerResponse } from './image.worker.ts'

interface PoolTask {
  id: number
  input: ProcessInput
  options: ProcessOptions
  resolve: (result: ProcessResult) => void
  reject: (error: Error) => void
  signal?: AbortSignal
  abort?: () => void
  timer?: ReturnType<typeof setTimeout>
}

const abortError = () =>
  new DOMException('Image processing cancelled.', 'AbortError')

/** Tasks own their listeners/timers until settled; callers own result URLs. */
export class ImagePool {
  private workers: Array<Worker> = []
  private idle: Array<Worker> = []
  private active = new Map<Worker, PoolTask>()
  private tasks = new Map<number, PoolTask>()
  private queue: Array<PoolTask> = []
  private nextId = 1
  private started = false
  private useWorkers = false
  private fallbackBusy = false
  private size = clampConcurrency(Math.min(maxConcurrency(), 4))

  private spawn(): Worker {
    const worker = new Worker(new URL('./image.worker.ts', import.meta.url), {
      type: 'module',
    })
    worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) =>
      this.onMessage(worker, event.data),
    )
    worker.addEventListener('error', (event) => {
      event.preventDefault()
      this.failWorker(
        worker,
        new Error('Image worker crashed. Try processing the image again.'),
      )
    })
    worker.addEventListener('messageerror', () =>
      this.failWorker(
        worker,
        new Error('Could not read the image worker response.'),
      ),
    )
    return worker
  }

  private terminate(worker: Worker) {
    worker.terminate()
    this.workers = this.workers.filter((candidate) => candidate !== worker)
    this.idle = this.idle.filter((candidate) => candidate !== worker)
  }

  private syncWorkers() {
    while (this.workers.length > this.size && this.idle.length)
      this.terminate(this.idle[this.idle.length - 1])
    if (!this.useWorkers) return
    try {
      while (this.workers.length < this.size) {
        const worker = this.spawn()
        this.workers.push(worker)
        this.idle.push(worker)
      }
    } catch {
      // Some browsers expose Worker but cannot construct one. Queued tasks may
      // use the serial fallback; tasks already running are never retried.
      this.useWorkers = false
      for (const worker of [...this.idle]) this.terminate(worker)
    }
  }

  setSize(n: number) {
    this.size = clampConcurrency(n, maxConcurrency())
    if (this.started) {
      this.syncWorkers()
      this.pump()
    }
  }

  private settle(task: PoolTask, error?: Error, output?: ProcessedBlob) {
    if (!this.tasks.delete(task.id)) return
    clearTimeout(task.timer)
    if (task.abort) task.signal?.removeEventListener('abort', task.abort)
    this.queue = this.queue.filter((candidate) => candidate !== task)
    if (error) {
      task.reject(error)
      return
    }
    if (!output) {
      task.reject(new Error('No image result received.'))
      return
    }
    try {
      task.resolve({
        ...output,
        url: URL.createObjectURL(output.blob),
        size: output.blob.size,
      })
    } catch (cause) {
      task.reject(
        cause instanceof Error
          ? cause
          : new Error('Could not create image preview.'),
      )
    }
  }

  private releaseWorker(worker: Worker) {
    this.active.delete(worker)
    if (!this.useWorkers || this.workers.length > this.size)
      this.terminate(worker)
    else this.idle.push(worker)
  }

  private failWorker(worker: Worker, error: Error) {
    if (!this.workers.includes(worker)) return
    const task = this.active.get(worker)
    this.active.delete(worker)
    this.terminate(worker)
    if (task) this.settle(task, error)
    this.syncWorkers()
    this.pump()
  }

  private onMessage(worker: Worker, data: WorkerResponse | null | undefined) {
    const task = this.active.get(worker)
    // A stale or mismatched response must never release another task's worker.
    if (!task || !data || data.id !== task.id || !this.tasks.has(task.id))
      return
    this.releaseWorker(worker)
    if (data.ok) this.settle(task, undefined, data)
    else this.settle(task, new Error(data.error))
    this.syncWorkers()
    this.pump()
  }

  private startTimer(task: PoolTask, worker?: Worker) {
    // Start at dispatch, so time spent waiting in the queue is not charged.
    task.timer = setTimeout(() => {
      const error = new Error(
        'Image processing timed out after five minutes. Try a lower effort setting or a smaller image.',
      )
      if (worker) this.failWorker(worker, error)
      else this.settle(task, error)
    }, WORKER_TIMEOUT_MS)
  }

  private pump() {
    if (!this.useWorkers) {
      if (this.fallbackBusy) return
      const task = this.queue.shift()
      if (!task) return
      this.fallbackBusy = true
      this.startTimer(task)
      // A cancelled or timed-out codec can still be running synchronously.
      // Keep the slot occupied until it finishes and discard its late output.
      void processToBlob(task.input, task.options)
        .then(
          (output) => this.settle(task, undefined, output),
          (error: unknown) =>
            this.settle(
              task,
              error instanceof Error ? error : new Error('Processing failed.'),
            ),
        )
        .finally(() => {
          this.fallbackBusy = false
          this.pump()
        })
      return
    }
    while (this.queue.length && this.idle.length) {
      const task = this.queue.shift()!
      const worker = this.idle.shift()!
      this.active.set(worker, task)
      this.startTimer(task, worker)
      const message: WorkerRequest = {
        id: task.id,
        input: task.input,
        options: task.options,
      }
      try {
        worker.postMessage(message)
      } catch {
        this.failWorker(
          worker,
          new Error('Could not send the image to its worker.'),
        )
      }
    }
  }

  process(
    input: ProcessInput,
    options: ProcessOptions,
    signal?: AbortSignal,
  ): Promise<ProcessResult> {
    if (signal?.aborted) return Promise.reject(abortError())
    if (!this.started) {
      this.started = true
      this.useWorkers =
        typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
      this.syncWorkers()
    }
    return new Promise((resolve, reject) => {
      const task: PoolTask = {
        id: this.nextId++,
        input,
        options,
        signal,
        resolve,
        reject,
      }
      task.abort = () => {
        const worker = [...this.active].find(
          ([, active]) => active === task,
        )?.[0]
        if (worker) this.failWorker(worker, abortError())
        else {
          this.settle(task, abortError())
          this.pump()
        }
      }
      this.tasks.set(task.id, task)
      this.queue.push(task)
      signal?.addEventListener('abort', task.abort, { once: true })
      this.pump()
    })
  }
}

export const imagePool = new ImagePool()

export function processInPool(
  source: SourceImage,
  options: ProcessOptions,
  signal?: AbortSignal,
): Promise<ProcessResult> {
  return imagePool.process(
    { file: source.file, width: source.width, height: source.height },
    options,
    signal,
  )
}

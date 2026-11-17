import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ImagePool } from './image-pool.ts'
import type { WorkerRequest } from './image.worker.ts'
import type { ProcessedBlob } from '#/lib/process.ts'
import { processToBlob } from '#/lib/process.ts'
import { WORKER_TIMEOUT_MS } from '#/lib/image-limits.ts'

vi.mock('#/lib/process.ts', () => ({ processToBlob: vi.fn() }))

class FakeWorker extends EventTarget {
  static instances: Array<FakeWorker> = []
  static dispatchFailure = false
  terminate = vi.fn()
  messages: Array<WorkerRequest> = []
  constructor() {
    super()
    FakeWorker.instances.push(this)
  }
  postMessage(message: WorkerRequest) {
    if (FakeWorker.dispatchFailure) {
      FakeWorker.dispatchFailure = false
      throw new Error('dispatch')
    }
    this.messages.push(message)
  }
  reply(id = this.messages.at(-1)!.id) {
    this.dispatchEvent(
      new MessageEvent('message', { data: { id, ok: true, ...output() } }),
    )
  }
}
const input = {
  file: new File(['source'], 'source.png'),
  width: 10,
  height: 10,
}
const options = { encode: { format: 'image/webp' as const, quality: 0.8 } }
const output = (): ProcessedBlob => ({
  blob: new Blob(['result']),
  width: 10,
  height: 10,
  format: 'image/webp',
})
const latest = () => FakeWorker.instances.at(-1)!
function pool(size = 1) {
  const p = new ImagePool()
  p.setSize(size)
  return p
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.resetAllMocks()
  FakeWorker.instances = []
  FakeWorker.dispatchFailure = false
  vi.stubGlobal('Worker', FakeWorker)
  vi.stubGlobal('OffscreenCanvas', class {})
  vi.stubGlobal('navigator', { hardwareConcurrency: 4 })
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:result')
})
afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

for (const event of ['error', 'messageerror'])
  it(`settles ${event} once, replaces the worker and continues without retry`, async () => {
    const p = pool()
    const first = p.process(input, options)
    const worker = latest()
    const second = p.process(input, options)
    const failed = expect(first).rejects.toThrow(
      event === 'error' ? 'crashed' : 'response',
    )
    worker.dispatchEvent(new Event(event, { cancelable: true }))
    await failed
    expect(worker.terminate).toHaveBeenCalledOnce()
    expect(FakeWorker.instances).toHaveLength(2)
    expect(latest().messages).toHaveLength(1)
    worker.reply()
    worker.dispatchEvent(new Event(event))
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    latest().reply()
    await expect(second).resolves.toMatchObject({ url: 'blob:result' })
    expect(vi.getTimerCount()).toBe(0)
  })
it('settles postMessage failures and keeps processing future tasks', async () => {
  FakeWorker.dispatchFailure = true
  const p = pool()
  await expect(p.process(input, options)).rejects.toThrow('send')
  expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce()
  const next = p.process(input, options)
  latest().reply()
  await next
})
it('measures the five minute timeout from dispatch and replaces timed out workers', async () => {
  const p = pool()
  const first = p.process(input, options)
  const second = p.process(input, options)
  await vi.advanceTimersByTimeAsync(WORKER_TIMEOUT_MS - 1)
  const worker = latest()
  worker.reply()
  await first
  await vi.advanceTimersByTimeAsync(1)
  expect(worker.messages).toHaveLength(2)
  const timeout = expect(second).rejects.toThrow('five minutes')
  await vi.advanceTimersByTimeAsync(WORKER_TIMEOUT_MS - 1)
  await timeout
  expect(worker.terminate).toHaveBeenCalledOnce()
  expect(FakeWorker.instances).toHaveLength(2)
  const recovered = p.process(input, options)
  latest().reply()
  await recovered
})
it('ignores mismatched, duplicate and stale responses without releasing another task', async () => {
  const p = pool()
  const first = p.process(input, options)
  const worker = latest()
  const second = p.process(input, options)
  const third = p.process(input, options)
  worker.reply(999)
  expect(worker.messages).toHaveLength(1)
  const firstId = worker.messages[0].id
  worker.reply()
  await first
  expect(worker.messages).toHaveLength(2)
  worker.reply(firstId)
  expect(worker.messages).toHaveLength(2)
  worker.reply()
  await second
  expect(worker.messages).toHaveLength(3)
  worker.reply()
  await third
  expect(URL.createObjectURL).toHaveBeenCalledTimes(3)
})
it('rejects pre-aborted and queued tasks without dispatch or worker termination', async () => {
  const p = pool()
  const aborted = new AbortController()
  aborted.abort()
  await expect(p.process(input, options, aborted.signal)).rejects.toMatchObject(
    { name: 'AbortError' },
  )
  expect(FakeWorker.instances).toHaveLength(0)
  const first = p.process(input, options)
  const controller = new AbortController()
  const queued = p.process(input, options, controller.signal)
  const failed = expect(queued).rejects.toMatchObject({ name: 'AbortError' })
  controller.abort()
  await failed
  expect(latest().messages).toHaveLength(1)
  expect(latest().terminate).not.toHaveBeenCalled()
  latest().reply()
  await first
})
it('cancels active tasks, removes abort listeners and clears timers', async () => {
  const p = pool()
  const controller = new AbortController()
  const remove = vi.spyOn(controller.signal, 'removeEventListener')
  const task = p.process(input, options, controller.signal)
  const old = latest()
  const rejected = expect(task).rejects.toMatchObject({ name: 'AbortError' })
  controller.abort()
  await rejected
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  expect(vi.getTimerCount()).toBe(0)
  expect(old.terminate).toHaveBeenCalledOnce()
  expect(FakeWorker.instances).toHaveLength(2)
  const next = p.process(input, options)
  old.reply()
  expect(URL.createObjectURL).not.toHaveBeenCalled()
  latest().reply()
  await next
})
it('removes abort listeners after success and does not terminate idle workers on later abort', async () => {
  const p = pool()
  const controller = new AbortController()
  const remove = vi.spyOn(controller.signal, 'removeEventListener')
  const task = p.process(input, options, controller.signal)
  latest().reply()
  await task
  controller.abort()
  expect(remove).toHaveBeenCalledWith('abort', expect.any(Function))
  expect(latest().terminate).not.toHaveBeenCalled()
  expect(vi.getTimerCount()).toBe(0)
})
it('handles normal image errors and preview URL failures without hanging', async () => {
  const p = pool()
  const failed = p.process(input, options)
  const error = expect(failed).rejects.toThrow('codec failed')
  latest().dispatchEvent(
    new MessageEvent('message', {
      data: { id: latest().messages[0].id, ok: false, error: 'codec failed' },
    }),
  )
  await error
  vi.mocked(URL.createObjectURL).mockImplementationOnce(() => {
    throw new Error('preview failed')
  })
  const task = p.process(input, options)
  const rejected = expect(task).rejects.toThrow('preview failed')
  latest().reply()
  await rejected
  expect(vi.getTimerCount()).toBe(0)
})
it('honors the current pool size after shrinking, growing and failures', async () => {
  const p = pool(4)
  const tasks = Array.from({ length: 4 }, () => p.process(input, options))
  const original = [...FakeWorker.instances]
  p.setSize(1)
  p.setSize(3)
  original[0].reply()
  await tasks[0]
  expect(original[0].terminate).toHaveBeenCalledOnce()
  original[1].reply()
  await tasks[1]
  expect(original[1].terminate).not.toHaveBeenCalled()
  const failed = expect(tasks[2]).rejects.toThrow('crashed')
  original[2].dispatchEvent(new Event('error'))
  await failed
  expect(FakeWorker.instances).toHaveLength(5)
  original[3].reply()
  await tasks[3]
  p.setSize(1)
  expect(
    FakeWorker.instances.filter((w) => !w.terminate.mock.calls.length),
  ).toHaveLength(1)
})

describe('serial main-thread fallback', () => {
  it('serializes work and discards late output after cancellation', async () => {
    vi.stubGlobal('Worker', undefined)
    const finishes: Array<(value: ProcessedBlob) => void> = []
    vi.mocked(processToBlob).mockImplementation(
      () => new Promise((resolve) => finishes.push(resolve)),
    )
    const p = pool()
    const controller = new AbortController()
    const first = p.process(input, options, controller.signal)
    const second = p.process(input, options)
    const rejected = expect(first).rejects.toMatchObject({ name: 'AbortError' })
    controller.abort()
    await rejected
    expect(processToBlob).toHaveBeenCalledTimes(1)
    finishes[0](output())
    await vi.advanceTimersByTimeAsync(0)
    expect(processToBlob).toHaveBeenCalledTimes(2)
    expect(URL.createObjectURL).not.toHaveBeenCalled()
    finishes[1](output())
    await second
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })
  it('keeps a timed out fallback slot occupied until its codec returns', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined)
    let finish!: (value: ProcessedBlob) => void
    vi.mocked(processToBlob)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          }),
      )
      .mockResolvedValue(output())
    const p = pool()
    const first = p.process(input, options)
    const second = p.process(input, options)
    const timeout = expect(first).rejects.toThrow('five minutes')
    await vi.advanceTimersByTimeAsync(WORKER_TIMEOUT_MS)
    await timeout
    expect(processToBlob).toHaveBeenCalledTimes(1)
    finish(output())
    await second
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })
  it('falls back when construction fails and settles codec errors', async () => {
    vi.stubGlobal(
      'Worker',
      class {
        constructor() {
          throw new Error('disabled')
        }
      },
    )
    vi.mocked(processToBlob)
      .mockRejectedValueOnce(new Error('codec failed'))
      .mockResolvedValue(output())
    const p = pool()
    await expect(p.process(input, options)).rejects.toThrow('codec failed')
    await expect(p.process(input, options)).resolves.toMatchObject({
      url: 'blob:result',
    })
  })
})

// @vitest-environment jsdom
import { StrictMode } from 'react'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useImageProcessor } from './use-image-processor.ts'
import { useImageQueue } from './use-image-queue.ts'
import { imagePool, processInPool } from '#/workers/image-pool.ts'
import type { ProcessResult, SourceImage } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'

vi.mock('#/workers/image-pool.ts', () => ({
  imagePool: { process: vi.fn() },
  processInPool: vi.fn(),
}))
const source = (id = 'a'): SourceImage => ({
  id,
  file: new File(['image'], `${id}.png`),
  url: `blob:source-${id}`,
  width: 10,
  height: 10,
  size: 5,
  type: 'image/png',
})
const result = (id = 'a'): ProcessResult => ({
  blob: new Blob(['result']),
  url: `blob:result-${id}`,
  width: 10,
  height: 10,
  size: 6,
  format: 'image/webp',
})
const defaultOptions: ProcessOptions = {
  encode: { format: 'image/webp', quality: 0.8 },
}
const changed: ProcessOptions = { encode: { format: 'image/png', quality: 1 } }
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubGlobal('URL', { revokeObjectURL: vi.fn() })
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

it('single-image processing cancels obsolete options, clears sources and releases late results', async () => {
  const first = deferred<ProcessResult>()
  const second = deferred<ProcessResult>()
  vi.mocked(processInPool)
    .mockReturnValueOnce(first.promise)
    .mockReturnValueOnce(second.promise)
  const image = source()
  const hook = renderHook<
    ReturnType<typeof useImageProcessor>,
    { image: SourceImage | null; options: ProcessOptions }
  >(
    ({
      image: currentImage,
      options,
    }: {
      image: SourceImage | null
      options: ProcessOptions
    }) => useImageProcessor(currentImage, options, { debounceMs: 0 }),
    { initialProps: { image, options: defaultOptions } },
  )
  await waitFor(() => expect(processInPool).toHaveBeenCalledTimes(1))
  hook.rerender({ image, options: changed })
  expect(vi.mocked(processInPool).mock.calls[0][2]?.aborted).toBe(true)
  await act(async () => first.resolve(result('old')))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-old')
  await waitFor(() => expect(processInPool).toHaveBeenCalledTimes(2))
  await act(async () => second.resolve(result('new')))
  expect(hook.result.current.result?.url).toBe('blob:result-new')
  hook.rerender({ image: null, options: changed })
  expect(hook.result.current.result).toBeNull()
  expect(vi.mocked(processInPool).mock.calls[1][2]?.aborted).toBe(true)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-new')
})
it('single-image processing aborts and rejects late state updates on unmount', async () => {
  const pending = deferred<ProcessResult>()
  vi.mocked(processInPool).mockReturnValue(pending.promise)
  const image = source()
  const hook = renderHook(() =>
    useImageProcessor(image, defaultOptions, { debounceMs: 0 }),
  )
  await waitFor(() => expect(processInPool).toHaveBeenCalledTimes(1))
  hook.unmount()
  expect(vi.mocked(processInPool).mock.calls[0][2]?.aborted).toBe(true)
  await act(async () => pending.resolve(result()))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-a')
})
it('single-image failures release the previous result', async () => {
  vi.mocked(processInPool)
    .mockResolvedValueOnce(result())
    .mockRejectedValueOnce(new Error('failed'))
  const image = source()
  const hook = renderHook(
    ({ options }) => useImageProcessor(image, options, { debounceMs: 0 }),
    { initialProps: { options: defaultOptions } },
  )
  await waitFor(() => expect(hook.result.current.result).not.toBeNull())
  hook.rerender({ options: changed })
  await waitFor(() => expect(hook.result.current.error).toBe('failed'))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-a')
})
it('adding sources keeps active tasks and errors without duplicate processing or automatic retries', async () => {
  const pending = deferred<ProcessResult>()
  vi.mocked(imagePool.process)
    .mockReturnValueOnce(pending.promise)
    .mockRejectedValueOnce(new Error('bad'))
    .mockResolvedValueOnce(result('c'))
  const hook = renderHook(() => useImageQueue(defaultOptions))
  act(() => hook.result.current.addSources([source('a')]))
  act(() => hook.result.current.addSources([source('b')]))
  await waitFor(() => expect(hook.result.current.errorCount).toBe(1))
  expect(imagePool.process).toHaveBeenCalledTimes(2)
  expect(vi.mocked(imagePool.process).mock.calls[0][2]?.aborted).toBe(false)
  act(() => hook.result.current.addSources([source('c')]))
  await waitFor(() => expect(hook.result.current.doneCount).toBe(1))
  expect(imagePool.process).toHaveBeenCalledTimes(3)
  await act(async () => pending.resolve(result('a')))
  expect(hook.result.current.doneCount).toBe(2)
  expect(hook.result.current.errorCount).toBe(1)
})
it('option changes cancel active batch work, release previous results and discard stale output', async () => {
  const pending = deferred<ProcessResult>()
  vi.mocked(imagePool.process)
    .mockResolvedValueOnce(result('a'))
    .mockReturnValueOnce(pending.promise)
    .mockResolvedValueOnce(result('new-a'))
    .mockResolvedValueOnce(result('new-b'))
  const hook = renderHook(({ options }) => useImageQueue(options), {
    initialProps: { options: defaultOptions },
  })
  act(() => hook.result.current.addSources([source('a'), source('b')]))
  await waitFor(() => expect(hook.result.current.doneCount).toBe(1))
  hook.rerender({ options: changed })
  expect(vi.mocked(imagePool.process).mock.calls[1][2]?.aborted).toBe(true)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-a')
  await act(async () => pending.resolve(result('old-b')))
  await waitFor(() => expect(hook.result.current.doneCount).toBe(2))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-old-b')
  expect(hook.result.current.items.map((item) => item.result?.url)).toEqual([
    'blob:result-new-a',
    'blob:result-new-b',
  ])
})
it('removal, clearing and unmount cancel batch requests and release source/result URLs', async () => {
  const a = deferred<ProcessResult>()
  const c = deferred<ProcessResult>()
  vi.mocked(imagePool.process)
    .mockReturnValueOnce(a.promise)
    .mockResolvedValueOnce(result('b'))
    .mockReturnValueOnce(c.promise)
  const hook = renderHook(() => useImageQueue(defaultOptions))
  act(() => hook.result.current.addSources([source('a'), source('b')]))
  await waitFor(() => expect(hook.result.current.doneCount).toBe(1))
  act(() => hook.result.current.remove('a'))
  expect(vi.mocked(imagePool.process).mock.calls[0][2]?.aborted).toBe(true)
  await act(async () => a.resolve(result('a')))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source-a')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-a')
  act(() => hook.result.current.clear())
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source-b')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-b')
  act(() => hook.result.current.addSources([source('c')]))
  hook.unmount()
  expect(vi.mocked(imagePool.process).mock.calls[2][2]?.aborted).toBe(true)
  await act(async () => c.resolve(result('c')))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source-c')
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:result-c')
})
it('does not release the same batch source twice under StrictMode or reprocess a duplicate', async () => {
  vi.mocked(imagePool.process).mockResolvedValue(result())
  const image = source()
  const hook = renderHook(() => useImageQueue(defaultOptions), {
    wrapper: ({ children }) => <StrictMode>{children}</StrictMode>,
  })
  act(() => hook.result.current.addSources([image, image]))
  await waitFor(() => expect(hook.result.current.doneCount).toBe(1))
  act(() => hook.result.current.addSources([image]))
  expect(imagePool.process).toHaveBeenCalledOnce()
  hook.unmount()
  expect(
    vi
      .mocked(URL.revokeObjectURL)
      .mock.calls.filter(([url]) => url === image.url),
  ).toHaveLength(1)
})

it('reports current reserved batch usage before queued React updates flush', () => {
  vi.mocked(imagePool.process).mockReturnValue(new Promise(() => {}))
  const hook = renderHook(() => useImageQueue(defaultOptions))
  act(() => {
    hook.result.current.addSources([source('a'), source('b')])
    expect(hook.result.current.getUsage()).toEqual({ count: 2, pixels: 200 })
    hook.result.current.remove('a')
    expect(hook.result.current.getUsage()).toEqual({ count: 1, pixels: 100 })
    hook.result.current.clear()
    expect(hook.result.current.getUsage()).toEqual({ count: 0, pixels: 0 })
  })
})

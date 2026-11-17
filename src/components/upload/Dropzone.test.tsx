// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ImportResult } from '#/lib/source.ts'
import type { SourceImage } from '#/types/image.ts'
import { importImages, releaseSourceImage } from '#/lib/source.ts'
import { Dropzone } from './Dropzone.tsx'

vi.mock('#/lib/source.ts', () => ({
  ACCEPTED_TYPES: ['image/png'],
  MAX_FILE_BYTES: 50 * 1024 * 1024,
  importImages: vi.fn(),
  releaseSourceImage: vi.fn(),
}))
const file = new File(['fixture'], 'a.png', { type: 'image/png' })
const source = {
  file,
  id: 'a',
  url: 'blob:a',
  width: 1,
  height: 1,
  size: 1,
  type: 'image/png',
} satisfies SourceImage
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)
const choose = () =>
  fireEvent.change(screen.getByLabelText('Upload image'), {
    target: { files: [file] },
  })
it('keeps valid files and names rejected files after changing to a compact batch dropzone', async () => {
  const onImages = vi.fn()
  vi.mocked(importImages).mockResolvedValue({
    accepted: [source],
    rejected: [
      { file: new File(['bad'], 'broken.png'), reason: 'Unreadable metadata' },
    ],
  })
  const view = render(<Dropzone multiple onImages={onImages} />)
  choose()
  await waitFor(() => expect(onImages).toHaveBeenCalledWith([source]))
  view.rerender(<Dropzone multiple compact onImages={onImages} />)
  expect(screen.getByRole('alert').textContent).toContain(
    'broken.png: Unreadable metadata',
  )
  expect(releaseSourceImage).not.toHaveBeenCalled()
})
it('blocks overlapping imports and releases an unclaimed preview after cancellation', async () => {
  let finish!: (result: ImportResult) => void
  vi.mocked(importImages).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const onImages = vi.fn()
  render(<Dropzone multiple onImages={onImages} />)
  choose()
  await screen.findByRole('button', { name: 'Cancel import' })
  choose()
  expect(importImages).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Cancel import' }))
  expect(vi.mocked(importImages).mock.calls[0][2]?.aborted).toBe(true)
  await act(async () => finish({ accepted: [source], rejected: [] }))
  expect(onImages).not.toHaveBeenCalled()
  expect(releaseSourceImage).toHaveBeenCalledWith(source)
  expect(screen.getByRole('status').textContent).toContain('No new images')
})
it('cancels on unmount and releases a late preview', async () => {
  let finish!: (result: ImportResult) => void
  vi.mocked(importImages).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const onImage = vi.fn()
  const view = render(<Dropzone onImage={onImage} />)
  choose()
  await screen.findByRole('button', { name: 'Cancel import' })
  view.unmount()
  expect(vi.mocked(importImages).mock.calls[0][2]?.aborted).toBe(true)
  await act(async () => finish({ accepted: [source], rejected: [] }))
  expect(releaseSourceImage).toHaveBeenCalledWith(source)
  expect(onImage).not.toHaveBeenCalled()
})

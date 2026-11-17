import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createSourceImage,
  importImages,
  releaseSourceImage,
} from './source.ts'
import { MAX_FILE_BYTES } from './image-limits.ts'
import { decode, drawToCanvas } from './canvas.ts'
import type * as CanvasModule from './canvas.ts'

vi.mock('./canvas.ts', async (original) => ({
  ...(await original<typeof CanvasModule>()),
  decode: vi.fn(),
}))

function png(name = 'image.png', width = 100, height = 100): File {
  const bytes = new Uint8Array(24)
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10])
  bytes.set([73, 72, 68, 82], 12)
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return new File([bytes], name, { type: 'image/png' })
}
function bitmap(width = 100, height = 100) {
  return { width, height, close: vi.fn() } as unknown as ImageBitmap
}
let nextUrl = 0
beforeEach(() => {
  vi.mocked(decode)
    .mockReset()
    .mockImplementation(async () => bitmap())
  vi.spyOn(URL, 'createObjectURL').mockImplementation(
    () => `blob:test-${nextUrl++}`,
  )
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('source admission before decoding', () => {
  it('uses detected format rather than trusting the supplied MIME type', async () => {
    const source = await createSourceImage(
      new File([await png().arrayBuffer()], 'disguised.jpg', {
        type: 'image/jpeg',
      }),
    )
    expect(source.type).toBe('image/png')
    releaseSourceImage(source)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(source.url)
  })
  it('rejects malformed metadata and oversized pixels without a decode', async () => {
    for (const file of [
      new File(['junk'], 'bad.png'),
      png('huge.png', 5001, 5000),
      png('zero.png', 0, 20),
    ]) {
      await expect(createSourceImage(file)).rejects.toThrow()
    }
    expect(decode).not.toHaveBeenCalled()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
  it('accepts the exact file/pixel boundaries and rejects larger files', async () => {
    const file = png('boundary.png', 5000, 5000)
    Object.defineProperty(file, 'size', { value: MAX_FILE_BYTES })
    vi.mocked(decode).mockResolvedValue(bitmap(5000, 5000))
    await expect(createSourceImage(file)).resolves.toMatchObject({
      width: 5000,
      height: 5000,
    })
    const tooBig = png()
    Object.defineProperty(tooBig, 'size', { value: MAX_FILE_BYTES + 1 })
    await expect(createSourceImage(tooBig)).rejects.toThrow('50 MiB')
    expect(decode).toHaveBeenCalledTimes(1)
  })
  it('rechecks decoded dimensions and closes bitmaps even on failure or cancellation', async () => {
    const huge = bitmap(5001, 5000)
    vi.mocked(decode).mockResolvedValueOnce(huge)
    await expect(createSourceImage(png())).rejects.toThrow('25 MP')
    expect(huge.close).toHaveBeenCalledOnce()
    const controller = new AbortController()
    const late = bitmap()
    vi.mocked(decode).mockImplementationOnce(async () => {
      controller.abort()
      return late
    })
    await expect(
      createSourceImage(png(), controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(late.close).toHaveBeenCalledOnce()
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
  it('closes a bitmap when creating its preview fails', async () => {
    const decoded = bitmap()
    vi.mocked(decode).mockResolvedValue(decoded)
    vi.mocked(URL.createObjectURL).mockImplementationOnce(() => {
      throw new Error('URL failed')
    })
    await expect(createSourceImage(png())).rejects.toThrow('URL failed')
    expect(decoded.close).toHaveBeenCalledOnce()
  })
  it('rejects already cancelled imports without reading or decoding', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(
      createSourceImage(png(), controller.signal),
    ).rejects.toMatchObject({ name: 'AbortError' })
    expect(decode).not.toHaveBeenCalled()
  })
})

describe('bounded batch imports', () => {
  it('keeps valid files, reports failures by file and preserves selection order', async () => {
    vi.mocked(decode).mockImplementation(async (file) => {
      if ((file as File).name === 'broken.png') throw new Error('Broken image')
      return bitmap()
    })
    const files = [
      png('a.png'),
      new File(['bad'], 'metadata.png'),
      png('broken.png'),
      png('b.png'),
    ]
    const result = await importImages(files)
    expect(result.accepted.map((s) => s.file.name)).toEqual(['a.png', 'b.png'])
    expect(result.rejected.map((r) => r.file.name)).toEqual([
      'metadata.png',
      'broken.png',
    ])
    expect(result.rejected[1].reason).toBe('Broken image')
  })
  it('limits decoding to two and keeps order when the second image finishes first', async () => {
    const releases: Array<() => void> = []
    let active = 0
    let peak = 0
    vi.mocked(decode).mockImplementation(
      () =>
        new Promise((resolve) => {
          active++
          peak = Math.max(peak, active)
          releases.push(() => {
            active--
            resolve(bitmap())
          })
        }),
    )
    const importing = importImages([png('a.png'), png('b.png'), png('c.png')])
    await vi.waitFor(() => expect(releases).toHaveLength(2))
    expect(peak).toBe(2)
    releases[1]()
    await vi.waitFor(() => expect(releases).toHaveLength(3))
    releases[2]()
    releases[0]()
    expect((await importing).accepted.map((s) => s.file.name)).toEqual([
      'a.png',
      'b.png',
      'c.png',
    ])
    expect(peak).toBe(2)
  })
  it('enforces count across repeated additions and frees capacity on decode failure', async () => {
    const first = await importImages([png('a.png'), png('b.png')], {
      count: 49,
      pixels: 0,
    })
    expect(first.accepted).toHaveLength(1)
    expect(first.rejected[0].reason).toContain('50 images')
    const second = await importImages([png('c.png')], {
      count: 50,
      pixels: 10_000,
    })
    expect(second.accepted).toHaveLength(0)
    vi.mocked(decode)
      .mockRejectedValueOnce(new Error('bad'))
      .mockResolvedValue(bitmap())
    const recovered = await importImages([png('bad.png'), png('good.png')], {
      count: 49,
      pixels: 0,
    })
    expect(recovered.accepted[0].file.name).toBe('good.png')
  })
  it('reserves the exact aggregate pixel boundary before decoding', async () => {
    vi.mocked(decode).mockResolvedValue(bitmap(5000, 5000))
    const result = await importImages(
      [png('a.png', 5000, 5000), png('b.png', 1, 1)],
      { count: 3, pixels: 75_000_000 },
    )
    expect(result.accepted).toHaveLength(1)
    expect(result.rejected[0].reason).toContain('100 MP')
    expect(decode).toHaveBeenCalledTimes(1)
  })
  it('checks decoded aggregate pixels without creating a preview', async () => {
    vi.mocked(decode).mockResolvedValue(bitmap(200, 100))
    const result = await importImages([png()], { count: 1, pixels: 99_990_000 })
    expect(result.accepted).toHaveLength(0)
    expect(result.rejected[0].reason).toContain('100 MP')
    expect(URL.createObjectURL).not.toHaveBeenCalled()
  })
  it('releases completed previews and closes late bitmaps when cancelled', async () => {
    let finish!: (value: ImageBitmap) => void
    const late = bitmap()
    vi.mocked(decode)
      .mockResolvedValueOnce(bitmap())
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve
          }),
      )
    const controller = new AbortController()
    const importing = importImages(
      [png('a.png'), png('b.png')],
      undefined,
      controller.signal,
    )
    const aborted = expect(importing).rejects.toMatchObject({
      name: 'AbortError',
    })
    await vi.waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1))
    controller.abort()
    finish(late)
    await aborted
    expect(late.close).toHaveBeenCalledOnce()
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1)
  })
  it('does not allocate an oversized or invalid output canvas', () => {
    const create = vi.fn()
    vi.stubGlobal('OffscreenCanvas', create)
    for (const target of [
      { width: 5001, height: 5000 },
      { width: Infinity, height: 100 },
      { width: NaN, height: 1 },
    ])
      expect(() => drawToCanvas(bitmap(), target)).toThrow()
    expect(create).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })
})

it('recognizes each allowed metadata format and rejects HEIC despite a PNG MIME type', async () => {
  const box = (type: string, ...parts: Uint8Array[]) => {
    const bytes = new Uint8Array(
      8 + parts.reduce((sum, p) => sum + p.length, 0),
    )
    new DataView(bytes.buffer).setUint32(0, bytes.length)
    bytes.set(new TextEncoder().encode(type), 4)
    let offset = 8
    for (const part of parts) {
      bytes.set(part, offset)
      offset += part.length
    }
    return bytes
  }
  const iso = (brand: string) => {
    const size = new Uint8Array(12)
    const view = new DataView(size.buffer)
    view.setUint32(4, 100)
    view.setUint32(8, 100)
    return new Uint8Array([
      ...box('ftyp', new TextEncoder().encode(brand), new Uint8Array(4)),
      ...box(
        'meta',
        new Uint8Array(4),
        box('pitm', new Uint8Array([0, 0, 0, 0, 0, 1])),
        box(
          'iprp',
          box('ipco', box('ispe', size)),
          box('ipma', new Uint8Array([0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1])),
        ),
      ),
    ])
  }
  const webp = new Uint8Array(30)
  webp.set(new TextEncoder().encode('RIFF'), 0)
  webp.set(new TextEncoder().encode('WEBPVP8 '), 8)
  const view = new DataView(webp.buffer)
  view.setUint32(16, 10, true)
  view.setUint16(26, 100, true)
  view.setUint16(28, 100, true)
  const formats = [
    ['jpeg', new Uint8Array([255, 216, 255, 192, 0, 7, 8, 0, 100, 0, 100])],
    ['gif', new Uint8Array([71, 73, 70, 56, 57, 97, 100, 0, 100, 0])],
    ['webp', webp],
    ['avif', iso('avif')],
  ] as const
  for (const [type, bytes] of formats)
    expect(
      (
        await createSourceImage(
          new File([new Uint8Array(bytes)], `fixture.${type}`, {
            type: 'image/png',
          }),
        )
      ).type,
    ).toBe(`image/${type}`)
  vi.mocked(decode).mockClear()
  await expect(
    createSourceImage(
      new File([new Uint8Array(iso('heic'))], 'disguised.png', {
        type: 'image/png',
      }),
    ),
  ).rejects.toThrow('not supported')
  expect(decode).not.toHaveBeenCalled()
})

it('cancels metadata reads without attempting a decode', async () => {
  const controller = new AbortController()
  const cancel = vi.fn()
  const file = png()
  Object.defineProperty(file, 'stream', {
    value: () =>
      new ReadableStream({
        start() {
          controller.abort()
        },
        cancel,
      }),
  })
  await expect(
    createSourceImage(file, controller.signal),
  ).rejects.toMatchObject({ name: 'AbortError' })
  expect(decode).not.toHaveBeenCalled()
  expect(cancel).toHaveBeenCalledOnce()
})

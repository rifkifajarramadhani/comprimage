import { describe, expect, it } from 'vitest'
import { ssim } from './ssim.ts'

/** Build a fake ImageData (jsdom lacks the constructor) from a pixel painter. */
function makeImage(
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number],
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const [r, g, b] = paint(x, y)
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  return { data, width, height } as ImageData
}

describe('ssim', () => {
  it('scores identical images as 1', () => {
    const img = makeImage(32, 32, (x, y) => [(x * 8) % 256, (y * 8) % 256, 128])
    expect(ssim(img, img)).toBeCloseTo(1, 6)
  })

  it('scores a degraded copy below 1 but above 0', () => {
    const original = makeImage(64, 64, (x, y) => [
      (x * 4) % 256,
      (y * 4) % 256,
      (x + y) % 256,
    ])
    // Add a strong constant offset + inversion in places to degrade structure.
    const degraded = makeImage(64, 64, (x, y) => {
      const noise = ((x * 31 + y * 17) % 90) - 45
      return [
        (x * 4 + noise) % 256,
        (y * 4 - noise) % 256,
        (x + y + noise) % 256,
      ]
    })
    const score = ssim(original, degraded)
    expect(score).toBeLessThan(0.99)
    expect(score).toBeGreaterThan(0)
  })

  it('rates a lightly perturbed copy higher than a heavily perturbed one', () => {
    const base = makeImage(64, 64, (x, y) => [
      (x * 4) % 256,
      (y * 4) % 256,
      100,
    ])
    const light = makeImage(64, 64, (x, y) => [
      ((x * 4) % 256) + 3,
      (y * 4) % 256,
      100,
    ])
    const heavy = makeImage(64, 64, (x, y) => [
      ((x * 4) % 256) + 60,
      ((y * 4) % 256) + 60,
      160,
    ])
    expect(ssim(base, light)).toBeGreaterThan(ssim(base, heavy))
  })

  it('throws on mismatched dimensions', () => {
    const a = makeImage(16, 16, () => [0, 0, 0])
    const b = makeImage(16, 32, () => [0, 0, 0])
    expect(() => ssim(a, b)).toThrow()
  })
})

/**
 * Structural Similarity (SSIM) — a perceptual image-quality metric that tracks
 * how a lossy encode looks to a human far better than raw byte error (PSNR).
 * Returns a score in roughly [0, 1]: 1.0 means identical, ~0.98+ is visually
 * lossless, and lower values mean more visible degradation.
 *
 * This drives the "target quality" auto mode: we encode candidates and keep the
 * smallest file whose SSIM still clears the user's target (see lib/encode.ts).
 *
 * Implementation: mean SSIM over non-overlapping 8×8 luma blocks with the
 * standard constants. Pure and dependency-free so it can be unit-tested.
 */

// Rec. 601 luma weights — matches how the eye weighs R/G/B brightness.
function luma(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

// Stabilising constants from the SSIM paper for an 8-bit (L=255) dynamic range.
const C1 = (0.01 * 255) ** 2
const C2 = (0.03 * 255) ** 2
const WIN = 8

function toLumaPlane(img: ImageData): Float64Array {
  const { data, width, height } = img
  const out = new Float64Array(width * height)
  for (let i = 0, p = 0; p < out.length; i += 4, p++) {
    out[p] = luma(data[i], data[i + 1], data[i + 2])
  }
  return out
}

/**
 * Mean SSIM between two equally-sized images. Throws if the dimensions differ —
 * callers compare a source against its own re-encode, so sizes always match.
 */
export function ssim(a: ImageData, b: ImageData): number {
  if (a.width !== b.width || a.height !== b.height) {
    throw new Error('SSIM requires images of identical dimensions.')
  }
  const { width, height } = a
  const la = toLumaPlane(a)
  const lb = toLumaPlane(b)

  let total = 0
  let blocks = 0
  const n = WIN * WIN

  for (let y = 0; y + WIN <= height; y += WIN) {
    for (let x = 0; x + WIN <= width; x += WIN) {
      let sumA = 0
      let sumB = 0
      let sumAA = 0
      let sumBB = 0
      let sumAB = 0
      for (let j = 0; j < WIN; j++) {
        let idx = (y + j) * width + x
        for (let i = 0; i < WIN; i++, idx++) {
          const va = la[idx]
          const vb = lb[idx]
          sumA += va
          sumB += vb
          sumAA += va * va
          sumBB += vb * vb
          sumAB += va * vb
        }
      }
      const muA = sumA / n
      const muB = sumB / n
      const varA = sumAA / n - muA * muA
      const varB = sumBB / n - muB * muB
      const covAB = sumAB / n - muA * muB

      const num = (2 * muA * muB + C1) * (2 * covAB + C2)
      const den = (muA * muA + muB * muB + C1) * (varA + varB + C2)
      total += num / den
      blocks++
    }
  }

  // Images smaller than one window: fall back to a single global comparison.
  return blocks > 0 ? total / blocks : 1
}

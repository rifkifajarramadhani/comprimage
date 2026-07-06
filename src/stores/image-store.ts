import { create } from 'zustand'
import type { SourceImage } from '#/types/image.ts'
import { releaseSourceImage } from '#/lib/source.ts'

/**
 * Shared source image for the single-tool flow (resize / compress / convert).
 * Lifting it out of the individual routes lets the home dropzone hand the image
 * off to `/resize` without a re-drop, and keeps it loaded when switching tools.
 * The store owns the object-URL lifecycle: replacing or clearing releases it.
 */
interface ImageStore {
  source: SourceImage | null
  setSource: (image: SourceImage) => void
  clearSource: () => void
}

export const useImageStore = create<ImageStore>((set, get) => ({
  source: null,
  setSource: (image) => {
    const prev = get().source
    if (prev) releaseSourceImage(prev)
    set({ source: image })
  },
  clearSource: () => {
    const prev = get().source
    if (prev) releaseSourceImage(prev)
    set({ source: null })
  },
}))

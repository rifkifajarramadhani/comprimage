import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions, ResizeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { ResizeControls } from '#/components/controls/ResizeControls.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { ToolGuide } from '#/components/layout/ToolGuide.tsx'
import { createSeoHead } from '#/lib/seo.ts'
import type { FaqEntry } from '#/lib/seo.ts'

const STEPS = [
  {
    title: 'Drop an image into the browser',
    body: 'JPG, PNG, WebP, AVIF, and GIF are accepted, up to 50 MB per file. The file is read straight from disk into the page — there is no upload step and no server involved at any point.',
  },
  {
    title: 'Choose how the new size is measured',
    body: 'Set a target width, a target height, a longest-edge limit, or a percentage of the original. With aspect ratio locked, the other dimension follows automatically so nothing is stretched.',
  },
  {
    title: 'Compare, then download',
    body: 'The resized result appears next to the original with the new dimensions and file size. Adjust the numbers until it looks right, then save the file to your device.',
  },
]

const NOTES = [
  {
    title: 'Downscaling happens in steps, not one jump',
    body: 'Shrinking an image by a large factor in a single pass makes the browser sample too few source pixels per output pixel, which produces aliasing and moiré on fine detail. Comprimage halves the image repeatedly until it is within range of the target, so edges and textures survive a big reduction.',
  },
  {
    title: 'Upscaling is blocked by default',
    body: 'Enlarging an image cannot invent detail that was never captured — it only produces a bigger, softer file. The prevent-upscaling switch clamps the output to the source dimensions. Turn it off in Settings if you deliberately need a larger canvas.',
  },
  {
    title: 'Picking a target width',
    body: 'Full-width web imagery rarely needs more than 1920px, in-article images are usually fine at 1280px, and thumbnails at 400px. Serving a 4000px photo into a 600px slot wastes bandwidth on pixels nobody sees.',
  },
  {
    title: 'Resizing and compression stack',
    body: 'Fewer pixels means fewer bytes before the encoder even runs, so resizing first and then choosing an efficient format compounds the saving. The output format and quality controls sit in the same panel for that reason.',
  },
]

const FAQ: Array<FaqEntry> = [
  {
    question: 'Are my images uploaded anywhere when I resize them?',
    answer:
      'No. Comprimage decodes, resizes, and re-encodes entirely inside your browser using WebAssembly. Your images are never transmitted to a server, and nothing is stored after you close the tab.',
  },
  {
    question: 'Will resizing an image reduce its quality?',
    answer:
      'Making an image smaller discards pixels, but progressive downscaling keeps that loss invisible at normal viewing sizes by halving the image in stages instead of one destructive jump. Making an image larger genuinely does reduce apparent quality, which is why upscaling is blocked by default.',
  },
  {
    question: 'How do I resize an image without stretching it?',
    answer:
      'Leave the aspect ratio lock enabled. You then set only one dimension — width, height, or longest edge — and the other is calculated from the original proportions, so the image is never distorted.',
  },
  {
    question: 'What is the largest file I can resize?',
    answer:
      'Files up to 50 MB each. Because processing runs on your own machine, very large images are limited by your available memory rather than by any upload quota.',
  },
]

export const Route = createFileRoute('/resize')({
  component: ResizePage,
  head: () =>
    createSeoHead({
      path: '/resize',
      title: 'Resize Images Online Privately | Comprimage',
      description:
        'Resize images in your browser while preserving aspect ratio and preventing unwanted upscaling. Your files never leave your device.',
      breadcrumb: 'Resize images',
      faq: FAQ,
    }),
})

function ResizePage() {
  const settings = useSettingsStore.getState()
  const [resize, setResize] = useState<ResizeOptions>({
    mode: 'width',
    value: 1280,
    keepAspectRatio: true,
    preventUpscaling: settings.preventUpscale,
  })
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  const options: ProcessOptions = { resize, encode }

  return (
    <ToolWorkspace
      title="Resize images"
      command="comprimage resize"
      description="Change dimensions while keeping the result crisp. Aspect ratio stays locked and upscaling is blocked by default."
      options={options}
      controls={
        <div className="grid gap-5">
          <p className="terminal-label">[ resize ]</p>
          <ResizeControls options={resize} onChange={setResize} />
          <div className="border-border border-t" />
          <p className="terminal-label">[ output ]</p>
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
      guide={
        <ToolGuide
          heading="How to resize an image online without losing quality"
          intro="Resizing changes how many pixels an image contains. Done carelessly it softens edges and introduces moiré; done in stages it stays sharp. Comprimage runs the careful version locally, so a resize costs you no privacy and no upload time."
          steps={STEPS}
          notes={NOTES}
          faq={FAQ}
        />
      }
    />
  )
}

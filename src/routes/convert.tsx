import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import type { EncodeOptions } from '#/types/image.ts'
import type { ProcessOptions } from '#/lib/process.ts'
import { useSettingsStore } from '#/stores/settings-store.ts'
import { ToolWorkspace } from '#/components/ToolWorkspace.tsx'
import { FormatSelect } from '#/components/controls/FormatSelect.tsx'
import { CompressControls } from '#/components/controls/CompressControls.tsx'
import { ToolGuide } from '#/components/layout/ToolGuide.tsx'
import { createSeoHead } from '#/lib/seo.ts'
import type { FaqEntry } from '#/lib/seo.ts'

const STEPS = [
  {
    title: 'Drop in the source image',
    body: 'JPG, PNG, WebP, AVIF, and GIF are all accepted as input, up to 50 MB per file. The browser decodes it to raw pixels locally — no upload, no queue, no account.',
  },
  {
    title: 'Choose the target format',
    body: 'Convert to JPG, PNG, WebP, AVIF, or JPEG XL. AVIF and JPEG XL are encoded through WebAssembly, which means Comprimage can produce them even in browsers whose own canvas cannot.',
  },
  {
    title: 'Tune, compare, and download',
    body: 'Lossy targets expose quality and effort; supported formats also offer lossless output and chroma subsampling. The result is shown against the original with the new file size before you save it.',
  },
]

const FORMAT_NOTES = [
  {
    title: 'JPG — universal, photographs only',
    body: 'Supported by literally everything and still a safe default for photos when compatibility matters most. It has no transparency and no lossless mode, and it handles sharp edges and flat colour poorly. Comprimage encodes it with MozJPEG, which is meaningfully more efficient than a standard JPEG encoder.',
  },
  {
    title: 'PNG — lossless, for graphics',
    body: 'The right choice for screenshots, logos, diagrams, and anything with transparency or hard edges. It is lossless, so the quality control does nothing; size reductions come from OxiPNG optimisation instead. Avoid it for photographs, where files become very large.',
  },
  {
    title: 'WebP — the safe modern default',
    body: 'Supported by every current browser and typically 25–35% smaller than an equivalent JPEG. It handles both photographs and graphics, supports transparency, and has a lossless mode, which makes it the best single replacement for both JPG and PNG on the web.',
  },
  {
    title: 'AVIF — smallest files, slower to encode',
    body: 'Usually beats WebP again on file size, especially at low quality and on smooth gradients, and supports transparency and lossless. Browser support is now broad but encoding costs noticeably more CPU time, so it rewards patience.',
  },
  {
    title: 'JPEG XL — excellent, limited support',
    body: 'Very strong quality-per-byte with a genuinely useful lossless mode. Browser support remains limited, so treat it as an archival or pipeline format rather than something you serve directly to visitors.',
  },
  {
    title: 'A note on animation',
    body: 'Animated GIFs can be used as input, but conversion takes the first frame — output is always a still image. Converting between lossy formats also re-encodes rather than recovering detail, so go back to the highest-quality original you have wherever possible.',
  },
]

const FAQ: Array<FaqEntry> = [
  {
    question: 'Is AVIF better than WebP?',
    answer:
      'AVIF usually produces a smaller file at the same visual quality, with a clear advantage on smooth gradients and at aggressive compression levels. WebP encodes far faster and has slightly wider support, so it remains the safer default unless file size is your priority.',
  },
  {
    question: 'Does converting an image reduce its quality?',
    answer:
      'Converting to a lossy format such as JPG, WebP, or AVIF re-encodes the image and discards some detail. Converting to PNG, or enabling the lossless switch on WebP, AVIF, or JPEG XL, preserves every pixel exactly.',
  },
  {
    question: 'Can I convert a PNG to JPG and keep transparency?',
    answer:
      'No — JPG has no alpha channel, so transparent areas are flattened. If you need transparency in a smaller file, convert to WebP or AVIF instead; both support alpha and compress much better than PNG for photographic content.',
  },
  {
    question: 'Are my files sent anywhere during conversion?',
    answer:
      'No. Every codec runs as WebAssembly inside your own browser tab. Your images are never uploaded, which is also why conversion works with no network connection once the page has loaded.',
  },
]

export const Route = createFileRoute('/convert')({
  component: ConvertPage,
  head: () =>
    createSeoHead({
      path: '/convert',
      title: 'Convert Image Formats Privately | Comprimage',
      description:
        'Convert images between JPG, PNG, WebP, AVIF, and JPEG XL with local WebAssembly codecs. Your files are never uploaded.',
      breadcrumb: 'Convert formats',
      faq: FAQ,
    }),
})

function ConvertPage() {
  const settings = useSettingsStore.getState()
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  const options: ProcessOptions = { encode }

  return (
    <ToolWorkspace
      title="Convert formats"
      command="comprimage convert"
      description="Change between JPG, PNG, WebP, AVIF, and JPEG XL with local WebAssembly codecs."
      options={options}
      controls={
        <div className="grid gap-5">
          <p className="terminal-label">[ output ]</p>
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
            label="Convert to"
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
      guide={
        <ToolGuide
          heading="How to convert between JPG, PNG, WebP, AVIF, and JPEG XL"
          intro="Every image format makes a different trade between file size, fidelity, features, and how many browsers can open it. Picking the right one is usually worth more than any amount of quality-slider tuning."
          steps={STEPS}
          notes={FORMAT_NOTES}
          notesLabel="which format to choose"
          faq={FAQ}
        />
      }
    />
  )
}

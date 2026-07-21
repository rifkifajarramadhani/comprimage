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
    title: 'Drop in the image you want to shrink',
    body: 'JPG, PNG, WebP, AVIF, and GIF are accepted, up to 50 MB per file. Dimensions are left untouched — compressing only changes how those pixels are stored.',
  },
  {
    title: 'Pick a format and a quality level',
    body: 'MozJPEG, libwebp, libaom (AVIF), OxiPNG, and libjxl all run as WebAssembly codecs in the page. They consistently produce smaller files at a given quality than the browser’s built-in encoder, and they expose effort and lossless controls it never did.',
  },
  {
    title: 'Check the before-and-after, then save',
    body: 'The original and the compressed result are shown side by side with the exact byte saving. If the difference is invisible at full size, the quality setting is doing its job.',
  },
]

const NOTES = [
  {
    title: 'Quality versus effort',
    body: 'Quality decides how much image detail the encoder is allowed to discard, and it is the main lever on file size. Effort decides how hard the encoder works to hit that quality — raising it spends more CPU time and returns a smaller file with no additional visual loss. Raise effort before lowering quality.',
  },
  {
    title: 'What auto quality is measuring',
    body: 'Auto mode binary-searches the quality range and scores each candidate with SSIM, a perceptual metric that tracks how an encode looks to a human far better than raw byte error. It keeps the smallest file still scoring above your target, so you get the saving without guessing at a number.',
  },
  {
    title: 'When lossless is worth it',
    body: 'Screenshots, diagrams, line art, and anything with flat colour and hard edges compress well losslessly and show lossy artefacts badly. Photographs are the opposite: lossy encoding at quality 75–85 is usually indistinguishable from the original at a fraction of the size.',
  },
  {
    title: 'What to expect from each format',
    body: 'Re-encoding a typical photo to WebP usually lands 25–35% below a comparable JPEG, and AVIF lower still, though AVIF costs noticeably more encoding time. PNG is lossless, so its quality slider does nothing — its savings come from OxiPNG’s optimisation passes instead.',
  },
]

const FAQ: Array<FaqEntry> = [
  {
    question: 'Does compressing an image here upload it to a server?',
    answer:
      'No. Every decode, comparison, and encode runs inside your browser through WebAssembly codecs. The image never leaves your device, so there is nothing to delete afterwards.',
  },
  {
    question: 'What quality setting should I use?',
    answer:
      'For photographs, 75–85 is the usual sweet spot: the saving is large and the difference is invisible at normal viewing size. Below about 60 you will start to see blocking and colour banding in smooth gradients like skies.',
  },
  {
    question: 'How much smaller will my image get?',
    answer:
      'It depends on the source. A photo straight from a camera or phone often drops by 60–80% with no visible change, while an image that has already been compressed once has much less left to give. The exact byte saving is shown before you download anything.',
  },
  {
    question: 'Can I compress an image without any quality loss?',
    answer:
      'Yes. Choose PNG, or enable the lossless switch on WebP, AVIF, or JPEG XL. The output is pixel-identical to the input, and the saving comes purely from more efficient storage rather than discarded detail.',
  },
]

export const Route = createFileRoute('/compress')({
  component: CompressPage,
  head: () =>
    createSeoHead({
      path: '/compress',
      title: 'Compress Images Online Privately | Comprimage',
      description:
        'Reduce image file size with modern JPEG, WebP, AVIF, PNG, and JPEG XL codecs. Preview quality before saving; nothing is uploaded.',
      breadcrumb: 'Compress images',
      faq: FAQ,
    }),
})

function CompressPage() {
  const settings = useSettingsStore.getState()
  const [encode, setEncode] = useState<EncodeOptions>({
    format: settings.defaultFormat,
    quality: settings.defaultQuality,
  })

  // Compress keeps the source dimensions (no resize) — just re-encodes.
  const options: ProcessOptions = { encode }

  return (
    <ToolWorkspace
      title="Compress images"
      command="comprimage compress"
      description="Reduce file size at the same dimensions and see the result update as you tune quality."
      options={options}
      controls={
        <div className="grid gap-5">
          <p className="terminal-label">[ output ]</p>
          <FormatSelect
            value={encode.format}
            onChange={(format) => setEncode((e) => ({ ...e, format }))}
            label="Encode as"
          />
          <CompressControls value={encode} onChange={setEncode} />
        </div>
      }
      guide={
        <ToolGuide
          heading="How to compress an image online without visible quality loss"
          intro="Compression trades detail you cannot see for bytes you do not have to send. The trick is knowing where that line sits, which is why Comprimage shows you the original and the result together before you commit to a download."
          steps={STEPS}
          notes={NOTES}
          faq={FAQ}
        />
      }
    />
  )
}

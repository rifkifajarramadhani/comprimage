import type { FaqEntry } from '#/lib/seo.ts'

export interface GuideStep {
  title: string
  body: string
}

/**
 * Below-the-fold explanatory copy for a tool page. Rendered unconditionally —
 * the workspace above it is empty until an image is dropped, so this is the
 * only substantive content a crawler (or a first-time visitor) ever sees.
 *
 * The `faq` array is the same one the route hands to `createSeoHead`, which
 * keeps the FAQPage structured data and its visible counterpart in sync.
 */
export function ToolGuide({
  heading,
  intro,
  steps,
  notes,
  notesLabel = 'choosing settings',
  faq,
}: {
  heading: string
  intro: string
  steps: Array<GuideStep>
  notes?: Array<GuideStep>
  notesLabel?: string
  faq: Array<FaqEntry>
}) {
  return (
    <div className="border-border mt-14 flex flex-col gap-12 border-t pt-10">
      <section>
        <p className="terminal-label">[ how it works ]</p>
        <h2 className="text-foreground mt-4 text-xl font-bold tracking-[-0.03em]">
          {heading}
        </h2>
        <p className="text-body-text mt-3 max-w-2xl leading-7">{intro}</p>
        <ol className="border-border mt-6 max-w-3xl border-y">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="border-border grid gap-4 border-b py-5 last:border-b-0 sm:grid-cols-[40px_1fr]"
            >
              <span className="border-border text-brand mono flex size-10 items-center justify-center rounded-sm border text-sm font-semibold">
                {index + 1}
              </span>
              <div>
                <h3 className="text-foreground font-semibold">{step.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {step.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {notes && notes.length > 0 && (
        <section>
          <p className="terminal-label">[ {notesLabel} ]</p>
          <div className="mt-6 grid max-w-4xl gap-7 sm:grid-cols-2">
            {notes.map((note) => (
              <article key={note.title}>
                <h3 className="text-foreground font-semibold">{note.title}</h3>
                <p className="text-muted-foreground mt-2 text-sm leading-6">
                  {note.body}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="surface-subtle max-w-4xl p-5 sm:p-6">
        <p className="terminal-label">[ common questions ]</p>
        <dl className="mt-5 flex flex-col gap-5">
          {faq.map(({ question, answer }) => (
            <div key={question}>
              <dt className="text-foreground text-sm font-semibold">
                {question}
              </dt>
              <dd className="text-muted-foreground mt-2 text-sm leading-6">
                {answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}

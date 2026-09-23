import { PageHeader } from "@/components/layout/PageHeader";
import { Reveal } from "@/components/motion/Reveal";

/** Página institucional de texto corrido — a mesma composição para termos e privacidade. */
export function LegalPage({
  label,
  title,
  lead,
  sections,
}: {
  label: string;
  title: string[];
  lead: string;
  sections: { heading: string; body: string[] }[];
}) {
  return (
    <>
      <PageHeader label={label} title={title} lead={lead} />

      <div className="shell-plp pb-[var(--spacing-commerce)]">
        <div className="grid md:grid-cols-12 md:gap-x-8">
          <div className="md:col-span-8 md:col-start-5 lg:col-span-7">
            {sections.map((section, i) => (
              <Reveal
                key={section.heading}
                delay={i * 0.05}
                className="border-t border-[var(--color-rule)] py-[clamp(1.5rem,2.6vw,2.25rem)]"
              >
                <h2 className="t-h3">{section.heading}</h2>
                <div className="mt-3 space-y-3">
                  {section.body.map((paragraph, j) => (
                    <p key={j} className="t-body max-w-[62ch]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

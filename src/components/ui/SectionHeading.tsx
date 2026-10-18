import { cn } from "@/lib/utils";
import { TextReveal } from "./TextReveal";
import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string | string[];
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}

export function SectionHeading({ eyebrow, title, description, align = "left", className, titleClassName }: SectionHeadingProps) {
  return (
    <div className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <Reveal>
          <p className="eyebrow mb-5 flex items-center gap-3">
            <span className="inline-block h-px w-8 bg-gradient-to-r from-electric to-neon" aria-hidden />
            {eyebrow}
          </p>
        </Reveal>
      )}
      <TextReveal
        as="h2"
        text={title}
        className={cn(
          "font-display text-4xl font-bold leading-[1.02] tracking-[-0.03em] text-fg sm:text-5xl lg:text-6xl",
          titleClassName,
        )}
      />
      {description && (
        <Reveal delay={0.15}>
          <p className="mt-6 text-base leading-relaxed text-muted sm:text-lg">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
